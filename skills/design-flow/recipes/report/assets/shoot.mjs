// report recipe verification. Usage:
//   node shoot.mjs /path/to/index.html [--key <slug>] [--sections id,id] [--only dark|800|fallback] [--playwright /path/to/package.json]
// Writes PNGs to shots/ next to the page and prints a JSON summary. Zero errors and no failed audit lines = pass.
// No setup needed: Playwright is found or installed by design-flow/assets/lib/playwright.mjs; --playwright is an optional override.
import { mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { launch } from '../../../assets/lib/playwright.mjs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const file = resolve(args.find(a => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--')) || 'index.html');
const KEY = opt('--key', 'report');
const SECTIONS = (opt('--sections', '') || '').split(',').filter(Boolean);
const only = opt('--only', 'all');
if (!existsSync(file)) { console.error('shoot.mjs: no such page ' + file + ' (build it first: sh <starter>/build.sh)'); process.exit(2); }
const dir = dirname(file) + '/'; const S = dir + 'shots/'; mkdirSync(S, { recursive: true });
const URL_ = 'file://' + file;
const browser = await launch({ headless: true });
const errs = []; const log = [];
const audit = (page, tag) => page.evaluate((tag) => {
  const d = document.documentElement; const small = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    if (!n.textContent.trim()) continue; const el = n.parentElement;
    if (!el || el.closest('.sr,[hidden],script,style,[inert],.doors')) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    let fs = parseFloat(cs.fontSize);
    if (el instanceof SVGElement && el.getScreenCTM) { const m = el.getScreenCTM(); if (m) fs *= Math.hypot(m.a, m.b); }
    if (el.getClientRects().length && fs < 11.95) small.push(fs.toFixed(1) + ' ' + el.tagName + '.' + (el.className.baseVal ?? el.className) + ' "' + n.textContent.trim().slice(0, 30) + '"');
  }
  const smallT = [...document.querySelectorAll('button,a,[role=button],input')].filter(e => { const r = e.getBoundingClientRect(); if (!r.width || e.closest('[inert],svg,.sr,.fg-b')) return false; return r.height < 43.5 || r.width < 43.5; })
    .map(e => (e.className.baseVal ?? e.className) + ':' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)).slice(0, 10);
  const dash = /[–—“”‘’]/.test(document.body.innerText);
  return { tag, hscroll: d.scrollWidth > d.clientWidth, small: [...new Set(small)].slice(0, 15), smallTargets: smallT, dashesOrCurlyQuotes: dash };
}, tag);
async function sweep(page) { const h = await page.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < h; y += 500) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(90); } await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300); }
async function open(viewport, theme, initScript) {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport });
  if (theme) await ctx.addInitScript(([k, t]) => { try { localStorage.setItem(k + '-theme', t); } catch (e) {} }, [KEY, theme]);
  if (initScript) await ctx.addInitScript(initScript);
  const page = await ctx.newPage();
  const tag = `[${theme} ${viewport.width}]`;
  page.on('console', m => { if (m.type() === 'error') errs.push(tag + ' ' + m.text()); });
  page.on('pageerror', e => errs.push(tag + ' PAGEERROR ' + e.message));
  await page.goto(URL_); await page.waitForTimeout(3400);
  return { ctx, page };
}
const expandAll = async page => { if (await page.locator('#expandAll').count()) { await page.click('#expandAll'); await page.waitForTimeout(700); } };
const sections = SECTIONS.length ? SECTIONS : await (async () => { const { ctx, page } = await open({ width: 1440, height: 900 }, 'dark'); const ids = await page.evaluate(() => [...document.querySelectorAll('section.panel')].map(s => s.id)); await ctx.close(); return ids; })();

if (only === 'all' || only === 'dark') {
  const { ctx, page } = await open({ width: 1440, height: 900 }, 'dark');
  await page.screenshot({ path: S + '01-1440-dark-top.png' });
  log.push(await audit(page, 'dark1440-top'));
  await expandAll(page); await sweep(page);
  log.push(await audit(page, 'dark1440-expanded'));
  const st = await page.addStyleTag({ content: '#top{position:relative!important}.totop{display:none!important}' });
  for (const [i, id] of sections.entries()) {
    const el = page.locator('#' + id); if (!(await el.count())) { errs.push('missing section #' + id); continue; }
    await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(1200);
    await el.screenshot({ path: S + `1${i}-1440-dark-${String(i + 1).padStart(2, '0')}-${id}.png` });
  }
  await st.evaluate(e => e.remove());
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(400);
  const tb = (await page.locator('#themeBtn').count()) ? '#themeBtn' : '#theme-toggle';
  await page.click(tb); await page.waitForTimeout(1500);
  await page.screenshot({ path: S + '03-1440-light-top.png' });
  log.push(await audit(page, 'light1440-top'));
  for (const id of sections.slice(0, 2)) { const el = page.locator('#' + id); await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(500); await el.screenshot({ path: S + `03-1440-light-${id}.png` }); }
  log.push(await audit(page, 'light1440-expanded'));
  await ctx.close();
}
if (only === 'all' || only === '800') {
  for (const theme of ['dark', 'light']) {
    const { ctx, page } = await open({ width: 800, height: 1000 }, theme);
    await page.screenshot({ path: S + `04-800-${theme}-top.png` });
    await expandAll(page); await sweep(page);
    log.push(await audit(page, theme + '800-expanded'));
    if (theme === 'dark') { await page.addStyleTag({ content: '#top{position:relative!important}.totop{display:none!important}' }); for (const id of sections.slice(0, 2)) { const el = page.locator('#' + id); await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(800); await el.screenshot({ path: S + `04-800-dark-${id}.png` }); } }
    await ctx.close();
  }
}
if (only === 'all' || only === 'fallback') {
  const { ctx, page } = await open({ width: 1440, height: 900 }, 'dark', () => {
    window.WebGLRenderingContext = undefined; window.WebGL2RenderingContext = undefined;
    const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...r) { if (/webgl/i.test(t)) return null; return g.call(this, t, ...r); };
  });
  await expandAll(page); await sweep(page);
  await page.screenshot({ path: S + '06-1440-no-webgl.png' });
  log.push({ tag: 'no-webgl', figuresWithContent: await page.evaluate(() => [...document.querySelectorAll('.fg-b')].filter(b => b.children.length).length), figures: await page.evaluate(() => document.querySelectorAll('.fg-b').length) });
  await ctx.close();
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await ctx2.route(/motion@/, r => r.abort());
  const p2 = await ctx2.newPage(); const e2 = [];
  p2.on('pageerror', e => e2.push(e.message)); p2.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push('[no-motion] ' + m.text()); }); // the aborted Motion request itself logs ERR_FAILED
  await p2.goto(URL_); await p2.waitForTimeout(2500);
  await p2.screenshot({ path: S + '07-1440-no-motion-top.png' });
  log.push({ tag: 'no-motion', pageErrors: e2, visibleTiles: await p2.evaluate(() => [...document.querySelectorAll('.tile')].filter(t => getComputedStyle(t).opacity === '1').length), tiles: await p2.evaluate(() => document.querySelectorAll('.tile').length) });
  await ctx2.close();
}
await browser.close();
const failed = log.filter(l => l.hscroll || (l.small && l.small.length) || (l.smallTargets && l.smallTargets.length) || l.dashesOrCurlyQuotes || (l.pageErrors && l.pageErrors.length) || (l.tag === 'no-webgl' && l.figuresWithContent < l.figures) || (l.tag === 'no-motion' && l.visibleTiles < l.tiles));
console.log(JSON.stringify({ pass: errs.length === 0 && failed.length === 0, errs, log }, null, 1));
process.exit(errs.length || failed.length ? 1 : 0);
