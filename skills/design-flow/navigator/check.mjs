// Look navigator check: drives the app the way Anshul would, at 390 px (touch) and 1440 px (mouse), dark and light.
//   node check.mjs [url] [--out <dir>, default the system temp folder] [--only 390-dark,...] [--no-extra]
// url defaults to http://127.0.0.1:8917/navigator/index.html (serve skills/design-flow with any static server).
// Swipes move slowly on purpose (a flick would pass on speed alone and hide a broken drag).
// GitHub's tree listing is fetched once here and replayed to the page, so a run costs one API call, not forty; the look files
// themselves still come from raw.githubusercontent.com like they do for him. The Ask panel's /api/claude routes are mocked
// (no key, no spend); answers in Ask screenshots are the mock's. Prints a JSON summary; exits 1 when any check fails.
import { launch } from '../assets/lib/playwright.mjs';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const BASE = args.find(a => /^(https?|file):/.test(a)) || 'http://127.0.0.1:8917/navigator/index.html';
const OUT = resolve(opt('--out', join(tmpdir(), 'look-navigator-shots'))); mkdirSync(OUT, { recursive: true });
const ONLY = opt('--only', '');
const url = q => BASE + (q ? (BASE.includes('?') ? '&' : '?') + q : '');
const results = []; const ok = (name, pass, detail) => { results.push({ name, pass: !!pass, detail: detail === undefined ? '' : detail }); if (!pass) console.error('FAIL', name, detail || ''); };

// one GitHub tree call for the whole run
let TREE = null;
try { const r = await fetch('https://api.github.com/repos/shootdaj/skills/git/trees/master?recursive=1'); if (r.ok) TREE = await r.text(); } catch (e) {}
if (!TREE) {
  const snap = readFileSync(join(here, 'snapshot.js'), 'utf8'); const j = JSON.parse(snap.slice(snap.indexOf('{'), snap.lastIndexOf('}') + 1));
  TREE = JSON.stringify({ truncated: false, tree: j.looks.map(f => ({ path: 'skills/design-flow/directions/' + f.file, type: 'blob', sha: 'snap-' + f.file })) });
}
const EXTRA_MD = `# Material test\n\nA look added on GitHub with no judged scores and no demo yet. Light first.\n\n\`\`\`json\n${JSON.stringify({ id: 'material-test', name: 'Material test', mood: 'tonal surfaces, rounded, calm', first: 'light',
  fonts: { display: 'Roboto Flex', body: 'Roboto Flex', mono: 'Roboto Mono', google: 'Roboto+Flex:wght@400;500;700&family=Roboto+Mono:wght@400;500' },
  light: { bg: '#FEF7FF', s1: '#FFFFFF', s2: '#F3EDF7', line: '#CAC4D0', txt: '#1D1B20', txt2: '#49454F', accent: '#6750A4', accentTxt: '#6750A4', onAccent: '#FFFFFF', ok: '#386A20', part: '#7D5700', miss: '#B3261E' },
  dark: { bg: '#141218', s1: '#1D1B20', s2: '#2B2930', line: '#49454F', txt: '#E6E0E9', txt2: '#CAC4D0', accent: '#D0BCFF', accentTxt: '#D0BCFF', onAccent: '#381E72', ok: '#A6D388', part: '#F5BD52', miss: '#F2B8B5' },
  radius: 16, density: 'regular', best: ['app screen', 'dashboard'], avoid: ['print-like docs'], palettes: [], source: 'check.mjs fixture', derived: [] }, null, 1)}\n\`\`\`\n\nMotion signature: container transform; state layers.\n\nForms: cards; chips.\n\n3D: none.\n`;

function sse(blocks, stop) {
  const ev = (t, d) => `event: ${t}\ndata: ${JSON.stringify(Object.assign({ type: t }, d))}\n\n`;
  let s = ev('message_start', { message: { id: 'msg_mock', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], usage: { input_tokens: 12, cache_creation_input_tokens: 6100, cache_read_input_tokens: 0, output_tokens: 1 } } });
  blocks.forEach((b, i) => {
    if (b.type === 'text') { s += ev('content_block_start', { index: i, content_block: { type: 'text', text: '' } }); for (const part of b.text.match(/.{1,24}/gs)) s += ev('content_block_delta', { index: i, delta: { type: 'text_delta', text: part } }); }
    else { s += ev('content_block_start', { index: i, content_block: { type: 'tool_use', id: b.id, name: b.name, input: {} } }); s += ev('content_block_delta', { index: i, delta: { type: 'input_json_delta', partial_json: JSON.stringify(b.input) } }); }
    s += ev('content_block_stop', { index: i });
  });
  return s + ev('message_delta', { delta: { stop_reason: stop }, usage: { output_tokens: 60 } }) + ev('message_stop', {});
}

const browser = await launch({ headless: true });
async function context(w, theme, o = {}) {
  const phone = w < 600;
  const ctx = await browser.newContext({ viewport: { width: w, height: phone ? 844 : 900 }, deviceScaleFactor: phone ? 2 : 1, hasTouch: phone, isMobile: phone });
  try { await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(BASE).origin }); } catch (e) {}
  const page = await ctx.newPage(); const bad = []; page._asks = [];
  page.on('console', m => { if (m.type() === 'error') bad.push('console: ' + m.text()); });
  page.on('pageerror', e => bad.push('pageerror: ' + e.message));
  page.on('requestfailed', r => { const f = (r.failure() || {}).errorText || ''; if (!/ERR_ABORTED/.test(f)) bad.push('failed: ' + r.url() + ' ' + f); });
  page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  await page.route('https://api.github.com/**', route => {
    let body = TREE; if (o.extra) { const t = JSON.parse(TREE); t.tree.push({ path: 'skills/design-flow/directions/material-test.md', type: 'blob', sha: 'extra-material-test' }); body = JSON.stringify(t); }
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body });
  });
  if (o.extra) await page.route('**/directions/material-test.md', route => route.fulfill({ status: 200, contentType: 'text/plain', headers: { 'access-control-allow-origin': '*' }, body: EXTRA_MD }));
  await page.route('**/api/claude-count', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"input_tokens": 6123}' }));
  await page.route('**/api/claude', async route => {
    const body = JSON.parse(route.request().postData() || '{}'); page._asks.push(body);
    const last = body.messages[body.messages.length - 1]; const hasResult = Array.isArray(last.content) && last.content.some(c => c.type === 'tool_result');
    const blocks = hasResult ? [{ type: 'text', text: 'Use **Aurora editorial** for a launch page: its best list names launch, and its serif and slow aurora suit a story. [[look:aurora-editorial]] For a darker, techier launch, try [[look:obsidian-spotlight]].' }]
      : [{ type: 'text', text: 'Opening it for you.' }, { type: 'tool_use', id: 'toolu_mock1', name: 'show_look', input: { id: 'aurora-editorial' } }];
    route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse(blocks, hasResult ? 'end_turn' : 'tool_use') });
  });
  page._bad = bad; page._phone = phone; page._w = w; page._theme = theme;
  return { ctx, page };
}
const S = page => page.evaluate(() => Object.assign({}, window.NavApp.S, { n: window.NavApp.data.looks.length }));
const tap = (page, sel) => page._phone ? page.locator(sel).first().tap() : page.locator(sel).first().click();
async function shot(page, name, full) { const f = join(OUT, `${name}-${page._w}-${page._theme}.png`); await page.screenshot({ path: f, fullPage: !!full }); return f; }
async function audit(page, where) {
  const r = await page.evaluate(() => {
    const out = { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, italic: [], tiny: [] };
    const vis = el => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && b.width > 0 && b.height > 0 && !el.closest('[hidden], .sr, .skip'); };
    for (const el of document.querySelectorAll('body *')) {
      if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      if (!vis(el)) continue; const s = getComputedStyle(el);
      if (s.fontStyle === 'italic' || s.fontStyle.startsWith('oblique')) out.italic.push(el.tagName + '.' + el.className);
      if (parseFloat(s.fontSize) < 11.5) out.tiny.push(el.tagName + '.' + el.className + ' ' + s.fontSize);
    }
    return out;
  });
  ok(`${where}: no sideways scroll`, r.sw === r.cw, `${r.sw} vs ${r.cw}`);
  ok(`${where}: zero italic`, r.italic.length === 0, r.italic.slice(0, 5));
  ok(`${where}: no text under 12 px`, r.tiny.length === 0, r.tiny.slice(0, 5));
}
async function clip(page) { return page.evaluate(async () => { try { return await navigator.clipboard.readText(); } catch (e) { return window.__lastCopy || ''; } }); }
async function touch(page, type, x, y) { const c = page._cdp || (page._cdp = await page.context().newCDPSession(page)); await c.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] }); }
async function hold(page, x, y, ms, during) {
  if (page._phone) { await touch(page, 'touchStart', x, y); await page.waitForTimeout(ms); const v = during && await during(); await touch(page, 'touchEnd', x, y); return v; }
  await page.mouse.move(x, y); await page.mouse.down(); await page.waitForTimeout(ms); const v = during && await during(); await page.mouse.up(); return v;
}
async function drag(page, x0, y0, x1, y1, steps = 12) {
  if (page._phone) { await touch(page, 'touchStart', x0, y0); for (let i = 1; i <= steps; i++) { await touch(page, 'touchMove', x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps); await page.waitForTimeout(35); } await touch(page, 'touchEnd', x1, y1); return; }
  await page.mouse.move(x0, y0); await page.mouse.down(); for (let i = 1; i <= steps; i++) { await page.mouse.move(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps); await page.waitForTimeout(35); } await page.mouse.up();
}
const ready = async page => { await page.waitForFunction(() => window.NavApp && window.NavApp.data.looks.length > 0 && document.querySelector('#sync').dataset.s === 'live', null, { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(500); };

async function run(w, theme) {
  const tag = `${w}-${theme}`; if (ONLY && !ONLY.split(',').includes(tag)) return;
  const { ctx, page } = await context(w, theme);
  // 1. home: the mood map
  await page.goto(url('theme=' + theme), { waitUntil: 'networkidle' }); await ready(page);
  let st = await S(page);
  ok(`${tag} map: looks loaded live`, (await page.textContent('#sync')).includes('Live'), await page.textContent('#sync'));
  ok(`${tag} map: theme ${theme}`, await page.evaluate(() => document.documentElement.dataset.theme) === theme);
  const tiles = await page.$$eval('.map .tile', els => els.map(e => { const b = e.getBoundingClientRect(); return { id: e.dataset.id, x: b.left, y: b.top, w: b.width, h: b.height }; }));
  ok(`${tag} map: a tile per look`, tiles.length === st.n, `${tiles.length} tiles, ${st.n} looks`);
  const overl = []; for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) { const a = tiles[i], b = tiles[j]; if (a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1) overl.push(a.id + '/' + b.id); }
  ok(`${tag} map: no tiles overlap`, overl.length === 0, overl);
  ok(`${tag} map: tiles show their look's display font`, await page.$eval('.tile[data-id="swiss-broadsheet"] .tile-n', e => /Big Shoulders/.test(getComputedStyle(e).fontFamily)));
  await shot(page, 'map'); await audit(page, `${tag} map`);
  // filter chips by job
  const dash = await page.evaluate(() => window.NavApp.data.looks.filter(l => l.jobs.includes('dashboards')).length);
  await tap(page, '[data-job="dashboards"]'); await page.waitForTimeout(500);
  ok(`${tag} map: Dashboards chip keeps ${dash} looks lit`, await page.$$eval('.map .tile:not(.dim)', e => e.length) === dash);
  ok(`${tag} map: filter is in the link`, page.url().includes('job=dashboards'));
  await tap(page, '[data-job="all"]'); await page.waitForTimeout(300);
  // grid toggle
  await tap(page, '[data-seg="layout"] [data-v="grid"]'); await page.waitForTimeout(900);
  ok(`${tag} grid: a card per look with a star graph`, await page.$$eval('.gcard', e => e.length) === st.n && await page.$$eval('.gcard .radar polygon.shape', e => e.length) === st.n);
  await shot(page, 'grid', true); await audit(page, `${tag} grid`);
  await tap(page, '[data-seg="layout"] [data-v="map"]'); await page.waitForTimeout(900);
  // the tiles' dark/light toggle flips the theme, every tile with it
  const other = theme === 'dark' ? 'light' : 'dark';
  const bg0 = await page.$eval('.tile[data-id="ink"] .tile-in', e => getComputedStyle(e).backgroundColor);
  await tap(page, `[data-seg="theme"] [data-v="${other}"]`); await page.waitForTimeout(900);
  const bg1 = await page.$eval('.tile[data-id="ink"] .tile-in', e => getComputedStyle(e).backgroundColor);
  ok(`${tag} map: dark/light toggle flips tiles`, bg0 !== bg1 && await page.evaluate(() => document.documentElement.dataset.theme) === other && page.url().includes('theme=' + other), `${bg0} -> ${bg1}`);
  await tap(page, `[data-seg="theme"] [data-v="${theme}"]`); await page.waitForTimeout(900);
  // drop a pin on an empty spot
  const spot = await page.evaluate(() => { const m = document.querySelector('.map'), r = m.getBoundingClientRect(); const ts = [...m.querySelectorAll('.tile')].map(t => t.getBoundingClientRect());
    for (let y = r.top + 90; y < r.bottom - 160; y += 13) for (let x = r.left + 70; x < r.right - 70; x += 13) if (ts.every(b => x < b.left - 30 || x > b.right + 30 || y < b.top - 30 || y > b.bottom + 30)) return { x, y }; return null; });
  if (spot) {
    await page.evaluate(y => scrollTo(0, y - 300 + scrollY), spot.y); await page.waitForTimeout(200);
    const s2 = await page.evaluate(() => { const m = document.querySelector('.map'), r = m.getBoundingClientRect(); const ts = [...m.querySelectorAll('.tile')].map(t => t.getBoundingClientRect());
      for (let y = Math.max(r.top + 90, 120); y < Math.min(r.bottom - 160, innerHeight - 200); y += 13) for (let x = r.left + 70; x < r.right - 70; x += 13) if (ts.every(b => x < b.left - 30 || x > b.right + 30 || y < b.top - 30 || y > b.bottom + 30)) return { x, y }; return null; });
    if (page._phone) await page.touchscreen.tap(s2.x, s2.y); else await page.mouse.click(s2.x, s2.y);
    await page.waitForTimeout(700);
    ok(`${tag} map: tapping an empty spot drops a pin`, await page.isVisible('.pin-card') && await page.isVisible('.map .pin'));
    await shot(page, 'pin-drop');
    await tap(page, '.pin-card [data-make]'); await page.waitForTimeout(900); st = await S(page);
    const req = await page.textContent('[data-req]');
    ok(`${tag} pin: Make it opens the maker at that spot`, st.view === 'make' && st.mode === 'pin' && st.px != null && /dropped a pin/.test(req), page.url());
    const jb = req.match(/```json\s*([\s\S]*?)```/); let parsed = null; try { parsed = JSON.parse(jb[1]); } catch (e) {}
    ok(`${tag} pin: request holds a valid look file`, parsed && parsed.id && parsed.dark && parsed.light && parsed.dark.bg && parsed.fonts && typeof parsed.radius === 'number', parsed ? parsed.id : 'no JSON');
    await shot(page, 'make-pin', true); await audit(page, `${tag} make-pin`);
    await page.goBack(); await page.waitForTimeout(800);
    ok(`${tag} back button returns to the map`, (await S(page)).view === 'map');
  } else ok(`${tag} map: found an empty spot`, false);

  // 2. look page from a tile
  await page.goto(url('theme=' + theme), { waitUntil: 'networkidle' }); await ready(page);
  await tap(page, '.tile[data-id="aurora-editorial"]'); await page.waitForTimeout(1200); st = await S(page);
  ok(`${tag} look: tile opens its page`, st.view === 'look' && st.look === 'aurora-editorial' && page.url().includes('look=aurora-editorial'));
  ok(`${tag} look: star graph has 10 attributes`, await page.$$eval('.rbox .ax', e => e.length) === 10 && (await page.$eval('.rbox polygon.shape', e => e.getAttribute('points') || '')).split(' ').length === 10);
  ok(`${tag} look: measured and judged both labelled`, await page.$$eval('.rbox .ax.measured', e => e.length) === 6 && await page.$$eval('.rbox .ax.judged', e => e.length) === 4);
  await tap(page, '.rbox .ax.judged'); await page.waitForTimeout(400);
  ok(`${tag} look: tapping a label explains the number`, /judged/i.test(await page.textContent('.rbox .rtip')) && await page.isVisible('.rbox .rtip.on'));
  await shot(page, 'look'); await audit(page, `${tag} look`);
  await page.locator('[data-use]').first().scrollIntoViewIfNeeded(); await tap(page, '.actions [data-use]'); await page.waitForTimeout(400);
  ok(`${tag} look: Use this look copies "use Aurora editorial"`, (await clip(page)) === 'use Aurora editorial' && await page.isVisible('#toast.on'), await clip(page));
  await shot(page, 'look-full', true);
  // full demo
  if (!(await page.$('.actions [data-demo][disabled]'))) {
    await tap(page, '.actions [data-demo]'); await page.waitForTimeout(500);
    const fr = page.frameLocator('#demo iframe'); let loaded = false; try { await fr.locator('body').waitFor({ timeout: 15000 }); loaded = (await fr.locator('h1').count()) > 0; } catch (e) {}
    ok(`${tag} look: Full demo opens the showcase`, loaded && page.url().includes('demo=1'));
    await page.waitForTimeout(1200); await shot(page, 'demo');
    await tap(page, '#demo [data-close]'); await page.waitForTimeout(300);
    ok(`${tag} look: demo closes back to the look`, await page.isHidden('#demo') && !page.url().includes('demo=1'));
  } else ok(`${tag} look: aurora-editorial has a demo`, false, 'demo disabled');
  // a look with no demo shows "demo coming"
  const nod = await page.evaluate(() => window.NavApp.data.looks.map(l => l.id).find(id => !(window.NAV_SNAPSHOT.demos || []).includes(id)));
  if (nod) { await page.goto(url(`view=look&look=${nod}&theme=${theme}`), { waitUntil: 'networkidle' }); await ready(page);
    ok(`${tag} look: ${nod} shows "Demo coming"`, await page.isVisible('.demo-coming') && await page.$('.actions [data-demo][disabled]') !== null); }
  // swipe the hero to the next look
  await page.goto(url(`view=look&look=ink&theme=${theme}`), { waitUntil: 'networkidle' }); await ready(page);
  const hb = await page.$eval('[data-hero]', e => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  const nextId = await page.evaluate(() => { const L = window.NavApp.data.looks; return L[(L.findIndex(l => l.id === 'ink') + 1) % L.length].id; });
  await drag(page, hb.x + hb.w * .8, hb.y + hb.h * .55, hb.x + hb.w * .12, hb.y + hb.h * .55); await page.waitForTimeout(1000);
  ok(`${tag} look: swiping the hero goes to the next look`, (await S(page)).look === nextId, (await S(page)).look);

  // 3. try it on my page
  await page.goto(url(`view=try&look=ink&page=report&theme=${theme}`), { waitUntil: 'networkidle' }); await ready(page);
  ok(`${tag} try: report opening in Ink`, await page.$eval('[data-stage] .lk', e => e.dataset.look) === 'ink' && await page.isVisible('[data-stage] .lk-report'));
  await shot(page, 'try-report'); await audit(page, `${tag} try`);
  for (const k of ['site', 'compare']) {
    await tap(page, `[data-seg="page"] [data-v="${k}"]`); await page.waitForTimeout(800);
    ok(`${tag} try: ${k} page`, await page.isVisible(`[data-stage] .lk-${k === 'site' ? 'site' : 'cmp'}`) && page.url().includes('page=' + k));
    await shot(page, 'try-' + k); await audit(page, `${tag} try-${k}`);
  }
  await tap(page, '[data-stage] .lk-tab[data-t="a"]'); await page.waitForTimeout(300);
  ok(`${tag} try: the sample's own tabs work`, await page.$eval('[data-stage] .lk-opts', e => e.dataset.show) === 'a');
  await tap(page, `[data-seg="page"] [data-v="report"]`); await page.waitForTimeout(700);
  await tap(page, '.strip [data-l="toy-blocks"]'); await page.waitForTimeout(900);
  ok(`${tag} try: tapping a look in the strip re-dresses the page`, (await S(page)).look === 'toy-blocks' && await page.$eval('[data-stage] .lk', e => e.dataset.look) === 'toy-blocks' && page.url().includes('look=toy-blocks'));
  const sb = await page.$eval('[data-stage]', e => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  const after = await page.evaluate(() => { const L = window.NavApp.data.looks; return L[(L.findIndex(l => l.id === 'toy-blocks') + 1) % L.length].id; });
  const sy = sb.y + Math.min(260, sb.h / 2);
  await drag(page, sb.x + sb.w * .85, sy, sb.x + sb.w * .1, sy); await page.waitForTimeout(1000);
  ok(`${tag} try: swiping sideways goes to the next look`, (await S(page)).look === after, (await S(page)).look);
  const held = await hold(page, sb.x + sb.w / 2, sy, 700, () => page.evaluate(() => [document.querySelector('[data-stage]').classList.contains('holding'), document.querySelector('[data-stage] .lk').dataset.look]));
  await page.waitForTimeout(300);
  const back = await page.$eval('[data-stage] .lk', e => e.dataset.look);
  ok(`${tag} try: press and hold shows the previous look, letting go returns`, held[0] && held[1] === 'toy-blocks' && back === after, `${held} -> ${back}`);
  await tap(page, '.strip-bar [data-use]'); await page.waitForTimeout(300);
  const nm = await page.evaluate(id => window.NavApp.data.looks.find(l => l.id === id).name, after);
  ok(`${tag} try: Use this look copies its name`, (await clip(page)) === 'use ' + nm, await clip(page));

  // 4. compare, from a shared link
  await page.goto(url(`look=ink&page=report&theme=${theme}&vs=plum`), { waitUntil: 'networkidle' }); await ready(page); st = await S(page);
  ok(`${tag} compare: the link ?look=ink&page=report&vs=plum opens Ink vs Plum report`, st.view === 'compare' && st.look === 'ink' && st.vs === 'plum-report' && st.theme === theme);
  ok(`${tag} compare: both star graphs overlaid`, await page.$$eval('.cmp-side polygon.shape', e => e.length) === 2);
  await shot(page, 'compare'); await audit(page, `${tag} compare`);
  const hbox = await page.$eval('.cmp-handle .grip', e => { const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
  const stg = await page.$eval('.cmp-stage', e => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, axis: e.dataset.axis }; });
  const clip0 = await page.$eval('[data-a]', e => e.style.clipPath);
  if (stg.axis === 'x') await drag(page, hbox.x, hbox.y, stg.x + stg.w * .25, hbox.y, 10); else await drag(page, hbox.x, hbox.y, hbox.x, stg.y + stg.h * .25, 10);
  await page.waitForTimeout(300);
  const clip1 = await page.$eval('[data-a]', e => e.style.clipPath);
  ok(`${tag} compare: dragging the divider moves the split (${stg.axis === 'x' ? 'left/right' : 'up/down'})`, clip0 !== clip1 && Math.abs(+(await page.$eval('.cmp-handle', e => e.getAttribute('aria-valuenow'))) - 25) <= 4, `${clip0} -> ${clip1}`);
  ok(`${tag} compare: split runs ${page._phone ? 'up/down on a phone' : 'left/right on desktop'}`, stg.axis === (page._phone ? 'y' : 'x'));
  const hbb = await page.$eval('[data-hold]', e => { e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
  const fl = await hold(page, hbb.x, hbb.y, 500, () => page.evaluate(() => [document.querySelector('.cmp-stage').classList.contains('holding'), document.querySelector('[data-a]').dataset.look]));
  await page.waitForTimeout(300);
  ok(`${tag} compare: press and hold flips the two looks, letting go flips back`, fl[0] && fl[1] === 'plum-report' && await page.$eval('[data-a]', e => e.dataset.look) === 'ink', fl);
  await tap(page, '[data-swap]'); await page.waitForTimeout(500); st = await S(page);
  ok(`${tag} compare: swap`, st.look === 'plum-report' && st.vs === 'ink');
  await tap(page, '[data-use="b"]'); await page.waitForTimeout(300);
  ok(`${tag} compare: Use B copies "use Ink"`, (await clip(page)) === 'use Ink');

  // 5. make: blend two
  await page.goto(url(`view=make&mode=blend&look=ink&vs=aurora-editorial&mix=40&theme=${theme}`), { waitUntil: 'networkidle' }); await ready(page);
  const rb = await page.$eval('[data-mix]', e => { e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; });
  const sw0 = await page.$eval('.tokens .tok:nth-child(5) i', e => getComputedStyle(e).backgroundColor);
  await drag(page, rb.x + rb.w * .4, rb.y, rb.x + rb.w * .76, rb.y, 10); await page.waitForTimeout(500); st = await S(page);
  const sw1 = await page.$eval('.tokens .tok:nth-child(5) i', e => getComputedStyle(e).backgroundColor);
  ok(`${tag} blend: dragging the slider re-blends the colours`, Math.abs(st.mix - 75) <= 6 && sw0 !== sw1, `mix ${st.mix}, accent ${sw0} -> ${sw1}`);
  ok(`${tag} blend: fonts swap past the midpoint`, (await page.textContent('.fnt')) === 'Aurora editorial' && await page.$eval('[data-box]', e => /Instrument Serif/.test(getComputedStyle(e).getPropertyValue('--fd'))));
  ok(`${tag} blend: contrast badges for both themes`, await page.$$eval('.checks .badge', e => e.length) >= 8);
  await page.locator('[data-name]').fill('Night lagoon'); await page.waitForTimeout(200);
  const req2 = await page.textContent('[data-req]'); const j2 = req2.match(/```json\s*([\s\S]*?)```/); let p2 = null; try { p2 = JSON.parse(j2[1]); } catch (e) {}
  ok(`${tag} blend: request names the new look file`, /directions\/night-lagoon\.md/.test(req2) && p2 && p2.name === 'Night lagoon' && p2.id === 'night-lagoon' && p2.dark.accent && p2.light.accent);
  await tap(page, '[data-copyreq]'); await page.waitForTimeout(300);
  ok(`${tag} blend: Copy request puts it on the clipboard`, (await clip(page)).startsWith('Add a new look to design-flow'));
  await shot(page, 'make-blend', true); await audit(page, `${tag} make-blend`);
  // the warning: Ink -> Aurora at 40% makes a mustard accent; its blended button text must still be readable, others are checked
  await tap(page, '[data-seg="mode"] [data-v="pin"]'); await page.waitForTimeout(900);
  const mm = await page.$eval('.mini-map .map', e => { e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  if (page._phone) await page.touchscreen.tap(mm.x + mm.w * .85, mm.y + mm.h * .92); else await page.mouse.click(mm.x + mm.w * .85, mm.y + mm.h * .92);
  await page.waitForTimeout(600); st = await S(page);
  ok(`${tag} pin: tapping the mini map moves the pin`, st.mode === 'pin' && st.px != null && page.url().includes('px='), page.url());

  // 6. how it fits together
  await tap(page, '.top [data-go="system"]'); await page.waitForTimeout(1300);
  ok(`${tag} system: diagram with its wires`, (await S(page)).view === 'system' && await page.$$eval('.sys .node', e => e.length) === 7 && await page.$$eval('.sys svg.wires path', e => e.length) >= 9);
  await tap(page, '[data-n="looks"]'); await page.waitForTimeout(500);
  ok(`${tag} system: tapping Looks explains it`, await page.isVisible('.node-info') && /Looks: \d+/.test(await page.textContent('.node-info')));
  await shot(page, 'system', true); await audit(page, `${tag} system`);
  await tap(page, '.node-info [data-go="map"]'); await page.waitForTimeout(900);
  ok(`${tag} system: "See them on the map" goes home`, (await S(page)).view === 'map');

  // 7. Ask (proxy mocked)
  await tap(page, '#askBtn'); await page.waitForTimeout(700);
  ok(`${tag} ask: panel opens with no warning`, await page.isVisible('#ask.on') && !(await page.isVisible('#ask .ask-status.on')));
  const sh = await page.$$eval('#ask .ask-sugg .chip', e => e.map(c => c.getBoundingClientRect().height));
  ok(`${tag} ask: suggestion chips keep their size`, sh.length === 4 && Math.max(...sh) < 80, sh.map(Math.round));
  if (!page._phone) { await page.waitForTimeout(400); const ov = await page.evaluate(() => { const a = document.querySelector('#ask').getBoundingClientRect().left; return [...document.querySelectorAll('main .tile, main .gcard')].filter(t => t.getBoundingClientRect().right > a + 1).length; });
    ok(`${tag} ask: page docks beside the panel (no tile hidden under it)`, ov === 0, ov + ' tiles under the panel'); }
  await shot(page, 'ask-open');
  await tap(page, '#ask .ask-sugg .chip'); await page.waitForTimeout(2500);
  const ans = await page.textContent('#ask .ask-log');
  ok(`${tag} ask: answer streams in with look chips`, /Aurora editorial/.test(ans) && await page.$$eval('#ask .ask-look', e => e.length) >= 1);
  const a0 = page._asks[0] || {};
  ok(`${tag} ask: request carries the design-system brief, cached, with 4 tools`, a0.model === 'claude-opus-5-5' && a0.stream === true && a0.system && a0.system[1].cache_control && /"looks":/.test(a0.system[1].text) && /"brief":/.test(a0.system[1].text) && (a0.tools || []).length === 4);
  ok(`${tag} ask: Claude's tool opened the look`, (await S(page)).view === 'look' && (await S(page)).look === 'aurora-editorial');
  await shot(page, 'ask');
  await tap(page, '#ask [data-close]'); await page.waitForTimeout(400);

  ok(`${tag}: no console errors or failed requests`, page._bad.length === 0, page._bad.slice(0, 8));
  await ctx.close();
}

async function extra() {
  // A look added on GitHub with no judged scores and no demo (the coming Material looks): it must still appear and work.
  const { ctx, page } = await context(1440, 'dark', { extra: true });
  await page.goto(url('theme=dark'), { waitUntil: 'networkidle' }); await ready(page);
  const st = await S(page);
  ok('new look: appears live on the map', await page.isVisible('.tile[data-id="material-test"]'), `${st.n} looks`);
  ok('new look: marked as measured only', await page.isVisible('.tile[data-id="material-test"] .nojudge'));
  await page.click('.tile[data-id="material-test"]'); await page.waitForTimeout(1200);
  ok('new look: its page shows 6 measured attributes and 4 not judged yet', await page.$$eval('.alist .arow:not(.none)', e => e.length) === 6 && await page.$$eval('.alist .arow.none', e => e.length) === 4);
  ok('new look: star graph draws the measured spikes', (await page.$eval('.rbox polygon.shape', e => e.getAttribute('points') || '')).split(' ').length === 6);
  ok('new look: demo coming', await page.isVisible('.demo-coming'));
  await page.screenshot({ path: join(OUT, 'new-look-1440-dark.png'), fullPage: true });
  await page.goto(url('view=compare&look=material-test&vs=ink&theme=dark'), { waitUntil: 'networkidle' }); await ready(page);
  ok('new look: compares against a judged look', await page.$$eval('.cmp-side polygon.shape', e => e.length) === 2);
  ok('new look: no console errors or failed requests', page._bad.length === 0, page._bad.slice(0, 6));
  await ctx.close();
}
async function fileMode() {
  // opened as a file (no server, no GitHub): the built-in copy carries every look
  const f = resolve(here, 'index.html'); if (!existsSync(f)) return;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage(); const bad = [];
  page.on('pageerror', e => bad.push(e.message)); page.on('console', m => { if (m.type() === 'error') bad.push(m.text()); });
  await page.goto('file://' + f); await page.waitForTimeout(2000);
  ok('file: opens from the built-in copy', await page.$$eval('.map .tile', e => e.length) >= 11 && (await page.textContent('#sync')).includes('Built-in'), await page.textContent('#sync'));
  ok('file: no errors', bad.length === 0, bad.slice(0, 4));
  await ctx.close();
}

for (const w of [390, 1440]) for (const t of ['dark', 'light']) { try { await run(w, t); } catch (e) { ok(`${w}-${t}: run finished`, false, e.message.split('\n')[0]); } }
if (!args.includes('--no-extra')) { try { await extra(); } catch (e) { ok('new look run finished', false, e.message.split('\n')[0]); } try { await fileMode(); } catch (e) { ok('file run finished', false, e.message); } }
await browser.close();
const failed = results.filter(r => !r.pass);
console.log(JSON.stringify({ checks: results.length, passed: results.length - failed.length, failed, shots: OUT }, null, 1));
process.exit(failed.length ? 1 : 0);
