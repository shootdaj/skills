// The publish gate's check. Every page design-flow publishes passes through here first (scripts/publish-page.sh). Usage:
//   node check-page.mjs <dir or index.html> [--repo <project dir>|none] [--ask-off-reason "<why>"] [--shots <dir>] [--json]
// What it checks, in one headless load at 1440 by 900 with a clean localStorage, then one at 800:
//   stamp      <html data-recipe="report|page"> written by the recipe's build.sh. Without it the page was hand-rolled: refused.
//   opening    the title and opening rules shared with shoot.mjs (recipes/report/assets/checks.mjs): plain h1 of 14 words or fewer at
//              32 px or less, one purpose line, four to six one-line bullets led in bold, nothing else above them, first screen holds them.
//   italics    no italic or oblique text anywhere visible ("never use that fucking stupid italic font", 2026-10-08).
//   dark       the page opens dark with nothing saved: data-theme dark and a dark body background.
//   console    zero console errors and zero page errors.
//   audit      12 px text floor, 44 px targets, no horizontal scroll at 1440 or 800, no em or en dashes or curly quotes.
//   glossary   when the page carries the glossary part: hover, focus and Escape work and the footer names the source. With --repo:
//              a project that declares a glossary must have it in the page. A glossary the project does not declare is noted, not refused.
//   ask        a report (data-recipe="report") carries the Ask panel (window.__askPanel, a 44 px Ask button) and .herenow/proxy.json with
//              /api/claude, /api/claude-fb and /api/claude-count. Without the panel it is refused, unless --ask-off-reason is given and the
//              footer records it (publish-page.sh writes that line from ASK=off ASK_OFF_REASON=...). A page (data-recipe="page") needs no panel.
//   proof      kind=proof: every screenshot has a caption and the URL it was taken on under it, and the image file exists.
// Prints OK / FAIL / NOTE lines, then GATE PASS or GATE REFUSED, and exits 1 on refusal. --json prints the summary as JSON instead.
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../assets/lib/playwright.mjs';
import { findGlossary } from '../recipes/report/assets/glossary.mjs';
import { auditEval, auditFails, openingEval, openingFails, openingWhy, glossaryRun, glossaryFails } from '../recipes/report/assets/checks.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const target = resolve(args.find(a => !a.startsWith('--') && !(args[args.indexOf(a) - 1] || '').startsWith('--')) || '.');
const file = existsSync(target) && statSync(target).isDirectory() ? join(target, 'index.html') : target;
const dir = dirname(file);
const REPO = opt('--repo', '');
const REASON = opt('--ask-off-reason', '');
const SHOTS = opt('--shots', '');
const JSON_OUT = args.includes('--json');
const ok = [], fail = [], note = [];
const out = { page: file, recipe: null, kind: null, ok, fail, note };
const done = () => {
  if (JSON_OUT) console.log(JSON.stringify({ pass: !fail.length, ...out }, null, 1));
  else { ok.forEach(l => console.log('OK   ' + l)); note.forEach(l => console.log('NOTE ' + l)); fail.forEach(l => console.log('FAIL ' + l)); console.log(fail.length ? `GATE REFUSED: ${fail.length} problem${fail.length === 1 ? '' : 's'} in ${file}` : `GATE PASS ${file}`); }
  process.exit(fail.length ? 1 : 0);
};

if (!existsSync(file)) { fail.push(`no index.html in ${dir} (the recipe builds one at the folder root)`); done(); }
const html = readFileSync(file, 'utf8');
const stamp = (html.match(/<html[^>]*\sdata-recipe="(report|page)"/) || [])[1];
if (!stamp) {
  fail.push('not built through the recipe: no data-recipe stamp on <html>. Hand-rolled HTML is not published. Build it with the report starter (recipes/report/assets/starter/build.sh) or the page starter (recipes/page/assets/starter/build.sh) and publish again');
  done();
}
out.recipe = stamp; out.kind = (html.match(/<html[^>]*\sdata-kind="([a-z]+)"/) || [])[1] || null;
ok.push(`stamp: built through the ${stamp} recipe${out.kind ? ' (kind ' + out.kind + ')' : ''}`);

// the ask panel and its manifest (a report feature)
const hasPanel = /window\.__askPanel|ask-sheet/.test(html);
const manifestPath = join(dir, '.herenow', 'proxy.json');
let manifest = null; try { manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null; } catch (e) { manifest = { bad: e.message }; }
const routes = manifest && manifest.proxies ? Object.keys(manifest.proxies) : [];
const askOffLine = (html.match(/<span class="ask-off">([^<]*)<\/span>/) || [])[1] || '';

// glossary declared by the project
let declared = null, declaredWhere = '';
if (REPO && REPO !== 'none') { const g = findGlossary(resolve(REPO)); declared = !!g; declaredWhere = g ? (g.label || g.url) : 'none'; }

const browser = await launch({ headless: true });
const errs = [];
async function open(width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errs.push(`[${width}] ` + m.text()); });
  page.on('pageerror', e => errs.push(`[${width}] PAGEERROR ` + e.message));
  await page.goto('file://' + file); await page.waitForTimeout(3400);
  return { ctx, page };
}
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const { ctx, page } = await open(1440, 900);

// dark by default
const theme = await page.evaluate(() => { const bg = getComputedStyle(document.body).backgroundColor; const m = bg.match(/\d+(\.\d+)?/g) || [0, 0, 0]; const L = (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; return { theme: document.documentElement.dataset.theme, bg, lum: +L.toFixed(3) }; });
if (theme.theme === 'dark' && theme.lum < 0.3) ok.push(`dark by default (body ${theme.bg})`); else fail.push(`not dark by default: data-theme=${theme.theme}, body ${theme.bg} (luminance ${theme.lum})`);

// the opening
const op = await page.evaluate(openingEval, stamp === 'page' ? 'page' : 'report');
if (!openingFails(op)) ok.push(`opening: title ${op.titleWords} words at ${op.titlePx}px, one purpose line, ${op.bullets} bullets led in bold, first screen holds them`);
else openingWhy(op).forEach(w => fail.push('opening: ' + w));
if (op.italicAnywhere && op.italicAnywhere.length) fail.push('italic text on the page: ' + op.italicAnywhere.join(', ')); else ok.push('no italic text anywhere');
if (SHOTS) await page.screenshot({ path: join(SHOTS, 'gate-1440-dark-top.png') });

// audit at 1440 with everything open
if (await page.locator('#expandAll').count()) { await page.click('#expandAll'); await page.waitForTimeout(700); }
const a1 = await page.evaluate(auditEval, '1440');
if (!auditFails(a1)) ok.push('1440: no horizontal scroll, text 12px or larger, targets 44px or larger, straight quotes');
else { if (a1.hscroll) fail.push('horizontal page scroll at 1440'); if (a1.small.length) fail.push('text under 12px at 1440: ' + a1.small.slice(0, 5).join('; ')); if (a1.smallTargets.length) fail.push('targets under 44px at 1440: ' + a1.smallTargets.slice(0, 6).join(', ')); if (a1.dashesOrCurlyQuotes) fail.push('em or en dashes or curly quotes in the page text'); }

// glossary
const gl = await glossaryRun(page, 'dark', SHOTS ? join(SHOTS, 'gate-1440-dark-glossary-hover.png') : '');
if (gl.inPage) { if (!glossaryFails(gl, null)) ok.push(`glossary: ${gl.terms} wrapped term${gl.terms === 1 ? '' : 's'} on the page from ${gl.source}; hover, focus and Escape work; footer names the source`); else fail.push(`glossary part broken: ${JSON.stringify({ terms: gl.terms, hoverShows: gl.hoverShows, leaveHides: gl.leaveHides, focusShows: gl.focusShows, escapeHides: gl.escapeHides, footer: !!gl.footer })}`); }
else if (gl.markup) fail.push('glossary markup without the glossary part (stray .gl-term, #gl-pop or .gl-src)');
else ok.push('glossary: none in the page');
if (declared === true && !gl.inPage) fail.push(`the project declares a glossary (${declaredWhere}) but the page has no glossary part: rerun the build with the glossary (recipes/report/assets/glossary.mjs --repo ${REPO})`);
if (declared === false && gl.inPage) note.push(`the page carries a glossary (${gl.source}) that ${REPO} does not declare; kept`);
if (declared === null) note.push('no --repo given: the glossary was checked for behaviour only, not against what the project declares');

// the ask panel
const askDom = await page.evaluate(() => { const b = document.querySelector('.ask-fab'); const r = b ? b.getBoundingClientRect() : null; return { api: !!window.__askPanel, button: !!b, w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0, context: !!document.getElementById('ask-context') }; });
if (stamp === 'report') {
  if (hasPanel && askDom.api && askDom.button) {
    const need = ['/api/claude', '/api/claude-fb', '/api/claude-count'].filter(r => !routes.includes(r));
    if (askDom.w < 44 || askDom.h < 44) fail.push(`Ask button is ${askDom.w}x${askDom.h}px (44 at least)`);
    if (!manifest) fail.push('Ask panel present but .herenow/proxy.json is missing next to index.html: run the build again (ask-build.mjs writes it); publishing without it drops the routes');
    else if (manifest.bad) fail.push('.herenow/proxy.json is not valid JSON: ' + manifest.bad);
    else if (need.length) fail.push('.herenow/proxy.json lacks ' + need.join(', '));
    else ok.push(`ask panel: present, ${askDom.w}x${askDom.h}px button, manifest routes ${routes.join(', ')}`);
    if (!askDom.context) note.push('no frozen ask-context in the page: the panel reads the page live (works, caches less reliably); rerun ask-build.mjs');
  } else if (REASON) {
    if (askOffLine.includes(REASON)) ok.push(`ask panel off on purpose, recorded in the footer: "${askOffLine}"`);
    else fail.push(`ASK_OFF_REASON given but the footer does not record it (expected a <span class="ask-off"> with "${REASON}"; publish-page.sh writes it)`);
  } else fail.push('a report publishes with its Ask panel and this one has none. Build with the panel on (sh build.sh), or leave it out on purpose with ASK=off ASK_OFF_REASON="why" publish-page.sh ...');
} else {
  if (hasPanel) { const need = ['/api/claude', '/api/claude-count'].filter(r => !routes.includes(r)); if (need.length) fail.push('page carries the Ask panel but .herenow/proxy.json lacks ' + need.join(', ')); else ok.push('ask panel: present on a page, manifest routes in place'); }
  else ok.push('ask panel: none, as pages ship (a report feature)');
}

// proof pages: caption plus URL under every screenshot, and the file exists
if (out.kind === 'proof') {
  const shots = await page.evaluate(() => [...document.querySelectorAll('figure.shot')].map(f => ({ id: f.id, img: (f.querySelector('img') || {}).getAttribute ? f.querySelector('img').getAttribute('src') : null, alt: (f.querySelector('img') || {}).alt || '', cap: ((f.querySelector('.cap') || {}).textContent || '').trim(), url: ((f.querySelector('.u') || {}).textContent || '').trim() })));
  const bad = shots.filter(s => !s.img || !s.cap || !/^https?:\/\//.test(s.url) || !s.alt || (!/^https?:/.test(s.img) && !existsSync(join(dir, decodeURIComponent(s.img)))));
  if (!shots.length) fail.push('proof page without a single figure.shot');
  else if (bad.length) fail.push('proof figures missing a caption, a URL, alt text or the image file: ' + bad.map(s => s.id).join(', '));
  else ok.push(`proof: ${shots.length} screenshots, each with a caption, its URL and an image file on disk`);
}
await ctx.close();

// 800 wide
const n = await open(800, 1000);
if (await n.page.locator('#expandAll').count()) { await n.page.click('#expandAll'); await n.page.waitForTimeout(600); }
const a2 = await n.page.evaluate(auditEval, '800');
if (a2.hscroll) fail.push('horizontal page scroll at 800'); else ok.push('800: no horizontal scroll');
if (SHOTS) await n.page.screenshot({ path: join(SHOTS, 'gate-800-dark-top.png') });
await n.ctx.close();
await browser.close();

// console
if (errs.length) fail.push('console errors: ' + [...new Set(errs)].slice(0, 5).join(' | ')); else ok.push('console: zero errors at 1440 and 800');
done();
