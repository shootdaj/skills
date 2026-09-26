// Shared Playwright loader for every design-flow script. No setup needed: it finds an installed @playwright/test or
// installs one, once, into ~/.design-flow/playwright, and it picks a browser (installed Google Chrome first, bundled
// Chromium as the silent fallback). Import it from any script:
//
//   import { loadPlaywright, ensureChromium, launch } from '../lib/playwright.mjs';
//   const pw = loadPlaywright();                 // { chromium, firefox, webkit, ... }
//   const browser = await launch({ headless: true });   // chromium, best available channel
//
// Search order for the package: --playwright <package.json> on the command line, PLAYWRIGHT_PACKAGE_JSON, the current
// folder, this helper's folder, the global npm root (npm root -g), then ~/.design-flow/playwright. All optional.
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { homedir, platform } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const CACHE_DIR = join(homedir(), '.design-flow', 'playwright');
const say = m => process.stderr.write('design-flow: ' + m + '\n');
const run = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, npm_config_fund: 'false', npm_config_audit: 'false', npm_config_update_notifier: 'false' } });

function argOpt(k) { const a = process.argv, i = a.indexOf(k); return i >= 0 && a[i + 1] ? a[i + 1] : undefined; }
function asPackageJson(p) { if (!p) return null; p = resolve(String(p).replace(/^~(?=\/|$)/, homedir())); return p.endsWith('.json') ? p : join(p, 'package.json'); }
function tryRequire(from) {
  if (!from) return null;
  for (const name of ['@playwright/test', 'playwright']) { try { return createRequire(from)(name); } catch (e) {} }
  return null;
}
let cached = null; let cachedFrom = null;

/** Where the package was found (a package.json path), for scripts that need a cwd for `playwright install`. */
export function playwrightHome() { return cachedFrom ? dirname(cachedFrom) : null; }

/** Load @playwright/test (or playwright), installing it once into ~/.design-flow/playwright when nothing has it. */
export function loadPlaywright(explicit) {
  if (cached) return cached;
  const tries = [asPackageJson(explicit || argOpt('--playwright')), asPackageJson(process.env.PLAYWRIGHT_PACKAGE_JSON), join(process.cwd(), 'package.json'), join(here, 'package.json')];
  const g = spawnSync('npm', ['root', '-g'], { stdio: ['ignore', 'pipe', 'ignore'] });
  if (g.status === 0 && g.stdout) { const root = g.stdout.toString().trim(); if (root) tries.push(join(root, 'package.json')); }
  tries.push(join(CACHE_DIR, 'package.json'));
  for (const t of tries.filter(Boolean)) { const m = tryRequire(t); if (m) { cached = m; cachedFrom = t; return m; } }
  installPackage();
  const m = tryRequire(join(CACHE_DIR, 'package.json'));
  if (!m) throw new Error('design-flow: Playwright install into ' + CACHE_DIR + ' did not work. Run: cd ' + CACHE_DIR + ' && npm i @playwright/test && npx playwright install chromium');
  cached = m; cachedFrom = join(CACHE_DIR, 'package.json');
  return m;
}

function installPackage() {
  const npm = spawnSync('npm', ['--version'], { stdio: 'ignore' });
  if (npm.error || npm.status !== 0) throw new Error('design-flow: npm is not on the PATH. Install Node.js (brew install node) and run again.');
  say('one-time setup: installing Playwright and Chromium into ' + CACHE_DIR + ' (a minute or two, no other setup needed)');
  mkdirSync(CACHE_DIR, { recursive: true });
  const pkg = join(CACHE_DIR, 'package.json');
  if (!existsSync(pkg)) writeFileSync(pkg, JSON.stringify({ name: 'design-flow-playwright', private: true, description: 'Playwright cache for the design-flow skills; safe to delete' }, null, 2) + '\n');
  const i = run('npm', ['i', '--silent', '--no-audit', '--no-fund', '@playwright/test'], CACHE_DIR);
  if (i.status !== 0) throw new Error('design-flow: npm i @playwright/test failed in ' + CACHE_DIR + '\n' + (i.stderr || '').toString().slice(-800));
  installBrowser(CACHE_DIR, true);
}

function installBrowser(cwd, quietFail) {
  const cli = ['node_modules', '.bin', 'playwright'].reduce((p, s) => join(p, s), cwd);
  const r = existsSync(cli) ? run(cli, ['install', 'chromium'], cwd) : run('npx', ['--yes', 'playwright', 'install', 'chromium'], cwd);
  if (r.status !== 0) { const msg = 'design-flow: Chromium download failed (' + ((r.stderr || '').toString().trim().split('\n').pop() || 'no detail') + ')'; if (quietFail) say(msg + '; installed Google Chrome will be used if present'); else throw new Error(msg); }
  return r.status === 0;
}

/** Path of an installed Google Chrome, or null. */
export function chromePath() {
  const mac = [join('/Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'), join(homedir(), 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome')];
  const linux = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/opt/google/chrome/chrome'];
  const win = [join(process.env['PROGRAMFILES'] || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'), join(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', 'Google/Chrome/Application/chrome.exe')];
  const list = platform() === 'darwin' ? mac : platform() === 'win32' ? win : linux;
  return list.find(p => existsSync(p)) || null;
}

/**
 * Make sure a Chromium-family browser can launch. Returns the launch options to spread in: `{ channel: 'chrome' }` when
 * Google Chrome is installed, else `{}` after making sure Playwright's bundled Chromium is downloaded.
 */
export function ensureChromium(pw) {
  pw = pw || loadPlaywright();
  if (chromePath()) return { channel: 'chrome' };
  let exe = ''; try { exe = pw.chromium.executablePath(); } catch (e) {}
  if (exe && existsSync(exe)) return {};
  say('one-time setup: downloading Chromium for Playwright');
  installBrowser(playwrightHome() || CACHE_DIR, false);
  return {};
}

/** Launch chromium with the best available channel; falls back to the bundled Chromium if Chrome refuses. */
export async function launch(opts = {}) {
  const pw = loadPlaywright();
  const ch = ensureChromium(pw);
  if (ch.channel) { try { return await pw.chromium.launch({ ...ch, ...opts }); } catch (e) { /* Chrome too old or locked; use the bundled build */ } }
  let exe = ''; try { exe = pw.chromium.executablePath(); } catch (e) {}
  if (!(exe && existsSync(exe))) installBrowser(playwrightHome() || CACHE_DIR, false);
  return pw.chromium.launch(opts);
}

/** Same fallback rule for a persistent profile (a visible window the user works in). */
export async function launchPersistent(profileDir, opts = {}) {
  const pw = loadPlaywright();
  mkdirSync(profileDir, { recursive: true });
  const ch = ensureChromium(pw);
  if (ch.channel) { try { return await pw.chromium.launchPersistentContext(profileDir, { ...ch, ...opts }); } catch (e) {} }
  let exe = ''; try { exe = pw.chromium.executablePath(); } catch (e) {}
  if (!(exe && existsSync(exe))) installBrowser(playwrightHome() || CACHE_DIR, false);
  return pw.chromium.launchPersistentContext(profileDir, opts);
}
