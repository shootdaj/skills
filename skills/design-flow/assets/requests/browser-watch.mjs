// Open a design room in a Chrome window Claude Code controls, and bridge its localStorage queue to files.
// usage: node browser-watch.mjs <url-or-file> --room <room_dir> [--profile ~/.design-flow/browser] [--playwright /path/package.json]
// Page -> files: each new pending item in localStorage 'design-requests' is written to <room>/_requests/<id>.json and printed as
//   NEW_REQUEST <path>   (one stdout line per request, for Claude Code's Monitor tool)
// Files -> page: status, name and result from those files are copied back into the page's queue every 2 s, and the page reloads
//   once when a request turns done so the new design appears. Closing the window ends the watch (prints WATCH_ENDED).
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';
const a = process.argv.slice(2); const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const target = a.find((x, i) => !x.startsWith('--') && !(a[i - 1] || '').startsWith('--'));
if (!target) { console.error('usage: node browser-watch.mjs <url-or-file> --room <room_dir>'); process.exit(2); }
const room = resolve(opt('--room', '.')); const qdir = join(room, '_requests'); mkdirSync(qdir, { recursive: true });
const profile = resolve(opt('--profile', join(homedir(), '.design-flow', 'browser')).replace(/^~/, homedir()));
const url = /^https?:|^file:/.test(target) ? target : 'file://' + resolve(target);
const pwArg = opt('--playwright', process.env.PLAYWRIGHT_PACKAGE_JSON);
function loadPlaywright() { for (const t of [pwArg, process.cwd() + '/package.json', import.meta.url, '/Users/Anshul.Vishwakarma/Code/sypris/package.json'].filter(Boolean)) { try { return createRequire(t)('@playwright/test'); } catch (e) {} } throw new Error('Playwright not found; pass --playwright /path/to/package.json'); }
const { chromium } = loadPlaywright();
const launch = o => chromium.launchPersistentContext(profile, { headless: false, viewport: null, args: ['--start-maximized'], ignoreDefaultArgs: ['--no-sandbox', '--enable-automation'], ...o });
const ctx = await launch({ channel: 'chrome' }).catch(() => launch({}));
await ctx.addInitScript(() => { window.__designFlowWatcher = true; });
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto(url);
const seen = new Set(); const announced = new Set();
const pathFor = id => join(qdir, id.replace(/[^\w.-]/g, '') + '.json');
let closed = false; ctx.on('close', () => { closed = true; }); page.on('close', () => { closed = true; });
console.log('WATCHING ' + url); 
while (!closed) {
  try {
    const q = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('design-requests') || '[]'); } catch (e) { return []; } });
    let changed = false;
    for (const r of q) {
      const p = pathFor(r.id);
      if (r.status === 'pending' && !seen.has(r.id) && !existsSync(p)) { writeFileSync(p, JSON.stringify(r, null, 1)); seen.add(r.id); console.log('NEW_REQUEST ' + p); continue; }
      seen.add(r.id);
      if (existsSync(p)) {
        try {
          const f = JSON.parse(readFileSync(p, 'utf8'));
          for (const k of ['status', 'name', 'result', 'updated', 'stage', 'percent', 'progress', 'eta', 'started', 'estimateMin']) if (JSON.stringify(f[k]) !== JSON.stringify(r[k]) && f[k] !== undefined) { r[k] = f[k]; changed = true; }
        } catch (e) {}
      }
    }
    if (changed) {
      await page.evaluate(q => { localStorage.setItem('design-requests', JSON.stringify(q)); dispatchEvent(new StorageEvent('storage', { key: 'design-requests' })); }, q);
      const fresh = q.filter(r => r.status === 'done' && !announced.has(r.id));
      if (fresh.length) { fresh.forEach(r => { announced.add(r.id); console.log('DONE ' + r.id + ' ' + (r.name || '')); }); await page.reload(); }
    }
  } catch (e) { if (/closed|Target/.test(String(e))) break; }
  await new Promise(r => setTimeout(r, 2000));
}
console.log('WATCH_ENDED'); try { await ctx.close(); } catch (e) {} process.exit(0);
