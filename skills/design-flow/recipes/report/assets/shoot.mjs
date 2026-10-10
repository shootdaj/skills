// report recipe verification. Usage:
//   node shoot.mjs /path/to/index.html [--key <slug>] [--repo <project dir>] [--sections id,id] [--only dark|800|fallback] [--playwright /path/to/package.json]
// Writes PNGs to shots/ next to the page and prints a JSON summary. Zero errors and no failed audit lines = pass.
// No setup needed: Playwright is found or installed by design-flow/assets/lib/playwright.mjs; --playwright is an optional override.
import { mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { launch } from '../../../assets/lib/playwright.mjs';
import { findGlossary } from './glossary.mjs';
import { briefStrings } from './brief.mjs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const file = resolve(args.find(a => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--')) || 'index.html');
const KEY = opt('--key', 'report');
const SECTIONS = (opt('--sections', '') || '').split(',').filter(Boolean);
const only = opt('--only', 'all');
const REPO = opt('--repo', ''); // the project the report is for: checks the page against the glossary that project declares
const repoGlossary = REPO ? findGlossary(resolve(REPO)) : undefined;
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
// The opening rule (2026-10-10, replaces the 2026-10-08 purpose line): the overview is an h1 title (the question the report answers or
// the decision it supports, 14 words or fewer, 32 px at most), then div.lead: the lead statement (two or three plain paragraphs at 18 px
// or more, no wider than 70ch, three to five span.hl highlights), the Your call strip (.ask) and the side card (.how-card), then
// ul.opening: four to six one-line bullets, each led by a bold key number or phrase. No highlight or bullet lead has a background fill.
// Every text in the overview outside its figures reaches 10:1 contrast against what is behind it (the page, or the strip or card surface).
// Title, lead, strip and card fit the first screen at 1440 by 900 and the first bullet is on it. No other paragraph, verdict label,
// eyebrow or stat tiles; no text above 48 px anywhere, no italic text in any heading or hero element. Run at 1440 wide.
const opening = page => page.evaluate(() => {
  const ov = document.getElementById('overview'); if (!ov) return { tag: 'opening', missing: '#overview' };
  const kids = [...ov.children]; const h1 = ov.querySelector('h1');
  const lead = ov.querySelector('.lead'); const ask = lead && lead.querySelector('.ask'); const card = lead && lead.querySelector('.how-card');
  const paras = lead ? [...lead.querySelectorAll('p')].filter(p => !p.closest('.ask,.how-card')) : [];
  const hls = paras.flatMap(p => [...p.querySelectorAll('.hl')]);
  const ul = ov.querySelector('ul.opening'); const after = lead ? lead.nextElementSibling : null;
  const lis = ul ? [...ul.children].filter(e => e.tagName === 'LI') : [];
  const lines = el => { const t = el.querySelector('.ot') || el; const lh = parseFloat(getComputedStyle(t).lineHeight) || 24; return Math.round(t.getBoundingClientRect().height / lh); };
  const H = innerHeight, inFold = e => { if (!e) return false; const r = e.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= H; };
  const shown = e => { const cs = getComputedStyle(e); return e.getClientRects().length && cs.display !== 'none' && cs.visibility !== 'hidden' && !e.closest('.doors,.sr,[inert]'); };
  const label = e => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '');
  const snip = e => ' "' + e.textContent.trim().replace(/\s+/g, ' ').slice(0, 32) + '"';
  const textEls = [...document.body.querySelectorAll('*')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && shown(e));
  // Colours: a 1 px canvas turns any computed colour (rgb, color(srgb), oklab after color-mix) into 8-bit RGBA.
  const cx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
  const rgba = s => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const over = (top, bot) => [0, 1, 2].map(i => top[i] * top[3] + bot[i] * (1 - top[3]));
  const page = [document.documentElement, document.body].reduce((c, e) => over(rgba(getComputedStyle(e).backgroundColor), c), [255, 255, 255]);
  const behind = el => { const chain = []; for (let e = el; e && e !== document.body && e !== document.documentElement; e = e.parentElement) chain.unshift(e); return chain.reduce((c, e) => over(rgba(getComputedStyle(e).backgroundColor), c), page); };
  const lum = c => c.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = el => { const bg = behind(el); const fg = over(rgba(getComputedStyle(el).color), bg); const a = lum(fg), b = lum(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
  const openingText = textEls.filter(e => ov.contains(e) && !e.closest('.fg,figure,svg'));
  const filled = e => { const cs = getComputedStyle(e); return rgba(cs.backgroundColor)[3] > 0.01 || cs.backgroundImage !== 'none'; };
  const chOf = p => { const probe = document.createElement('span'); probe.style.cssText = 'position:absolute;visibility:hidden;width:70ch;font:inherit;letter-spacing:inherit'; p.appendChild(probe); const w = probe.getBoundingClientRect().width / 70; probe.remove(); return p.getBoundingClientRect().width / w; };
  return { tag: 'opening',
    titleFirst: !!h1 && kids[0] === h1, titleWords: h1 ? h1.textContent.trim().split(/\s+/).length : 0, titlePx: h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0,
    lead: !!lead && paras.length > 0, leadAfterTitle: !!lead && kids[1] === lead, leadParagraphs: paras.length,
    leadPx: paras.length ? Math.min(...paras.map(p => parseFloat(getComputedStyle(p).fontSize))) : 0,
    leadCh: paras.length ? Math.round(Math.max(...paras.map(chOf))) : 0,
    highlights: hls.length, filled: [...hls, ...lis.map(li => li.querySelector('b,strong')).filter(Boolean)].filter(filled).map(e => label(e) + snip(e)).slice(0, 6),
    lowContrast: openingText.map(e => [e, ratio(e)]).filter(([, r]) => r < 10).map(([e, r]) => r.toFixed(1) + ':1 ' + label(e) + snip(e)).slice(0, 8),
    ask: !!ask && shown(ask) && !!ask.textContent.trim(), card: !!card && shown(card) && !!card.textContent.trim(),
    bulletsFirst: !!ul && !!after && (after === ul || after.firstElementChild === ul), bullets: lis.length,
    firstScreen: !!lead && [h1, ...paras, ask, card].every(inFold) && inFold(lis[0]),
    unled: lis.filter(li => !li.querySelector('b,strong')).length, wrapped: lis.filter(li => lines(li) > 1).length,
    display: textEls.filter(e => parseFloat(getComputedStyle(e).fontSize) > 48).map(e => label(e) + ' ' + getComputedStyle(e).fontSize).slice(0, 5),
    italic: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,h1 *,h2 *,h3 *,h4 *,h5 *,h6 *,#overview,#overview *,.top *,.ph *,.fg-h *')].filter(e => textEls.includes(e) && /italic|oblique/.test(getComputedStyle(e).fontStyle)).map(label).slice(0, 5),
    banned: [...document.querySelectorAll('.verdict,.eyebrow,.tiles,.tile,.stat-tile'), ...ov.querySelectorAll('p')].filter(e => !e.closest('.lead,figure')).map(label).slice(0, 5) };
});
// Plain reasons for every opening failure, so the summary says what to fix.
const openingFails = l => {
  if (l.missing) return ['no ' + l.missing];
  const f = [];
  if (!l.titleFirst) f.push('the h1 title is not the first thing in #overview');
  if (l.titleWords > 14) f.push(`title is ${l.titleWords} words, over 14`);
  if (l.titlePx > 32) f.push(`title is ${l.titlePx} px, over 32`);
  if (!l.lead) f.push('lead statement missing: div.lead with two or three plain paragraphs right under the title');
  else {
    if (!l.leadAfterTitle) f.push('lead statement is not directly under the title');
    if (l.leadPx < 18) f.push(`lead text is ${l.leadPx} px, under 18`);
    if (l.leadCh > 70) f.push(`lead is ${l.leadCh}ch wide, over 70`);
    if (l.highlights < 3 || l.highlights > 5) f.push(`${l.highlights} highlights (span.hl) in the lead, needs 3 to 5`);
  }
  if (l.filled.length) f.push('highlight or bullet lead with a background fill: ' + l.filled.join('; '));
  if (l.lowContrast.length) f.push('opening text under 10:1 contrast: ' + l.lowContrast.join('; '));
  if (!l.ask) f.push('Your call strip missing (.lead .ask)');
  if (!l.card) f.push('side card missing (.lead .how-card)');
  if (!l.firstScreen) f.push('title, lead, Your call strip and side card are not all on the first screen at 1440 by 900 with the first bullet on it');
  if (!l.bulletsFirst) f.push('ul.opening does not follow the lead');
  if (l.bullets < 4 || l.bullets > 6) f.push(`${l.bullets} opening bullets, needs 4 to 6`);
  if (l.unled) f.push(`${l.unled} bullets without a bold lead`);
  if (l.wrapped) f.push(`${l.wrapped} bullets wrap past one line`);
  if (l.display.length) f.push('text over 48 px: ' + l.display.join('; '));
  if (l.italic.length) f.push('italic text: ' + l.italic.join('; '));
  if (l.banned.length) f.push('label, eyebrow, stat tile or paragraph outside the lead: ' + l.banned.join('; '));
  return f;
};
// The length budget (2026-10-08, "any future reports need to be fucking shorter"): with every chapter open the page fits in about
// three 900 px screens before the appendix (fails above 3.3), at most five chapters, every caption 12 words or fewer (a Details link excluded).
const length = page => page.evaluate(() => {
  const ap = document.getElementById('appendix'); const end = ap || document.querySelector('footer') || document.body;
  const endY = ap ? ap.getBoundingClientRect().top + scrollY : end.getBoundingClientRect().bottom + scrollY;
  const words = c => { const k = c.cloneNode(true); k.querySelectorAll('.dlink').forEach(d => d.remove()); return k.textContent.trim().split(/\s+/).filter(Boolean).length; };
  return { tag: 'length', screens: +(endY / 900).toFixed(2), chapters: document.querySelectorAll('section.panel:not(#appendix):not(#prototypes)').length,
    longCaptions: [...document.querySelectorAll('figcaption')].filter(c => words(c) > 12).map(c => words(c) + ' words: ' + c.textContent.trim().slice(0, 40)).slice(0, 8) };
});
// Glossary hover (2026-10-08): with a glossary, at least one term is wrapped and hover, focus and Escape work; without one, no glossary
// markup at all. With --repo the page must match what the project declares.
async function glossary(page, theme) {
  const st = await page.evaluate(() => ({ inPage: !!window.REPORT_GLOSSARY, source: window.REPORT_GLOSSARY ? window.REPORT_GLOSSARY.source : null,
    terms: document.querySelectorAll('.gl-term').length, markup: document.querySelectorAll('.gl-term,#gl-pop,.gl-src').length,
    footer: (document.querySelector('.gl-src') || {}).textContent || '' }));
  const r = { tag: 'glossary-' + theme, ...st, declared: repoGlossary === undefined ? null : !!repoGlossary };
  if (!st.inPage || !st.terms) return r;
  const shown = () => page.evaluate(() => { const p = document.getElementById('gl-pop'); return p && p.classList.contains('show') && getComputedStyle(p).fontStyle === 'normal' ? p.textContent : ''; });
  const t = page.locator('.gl-term').first(); await t.scrollIntoViewIfNeeded(); await t.hover(); await page.waitForTimeout(300);
  r.hoverShows = !!(await shown()); r.popText = (await shown()).slice(0, 80);
  await page.screenshot({ path: S + `08-1440-${theme}-glossary-hover.png` });
  await page.mouse.move(2, 2); await page.waitForTimeout(250); r.leaveHides = !(await shown());
  await t.focus(); await page.waitForTimeout(150); r.focusShows = !!(await shown());
  await page.keyboard.press('Escape'); await page.waitForTimeout(150); r.escapeHides = !(await shown());
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); scrollTo(0, 0); }); await page.waitForTimeout(200);
  return r;
}
// The context brief (2026-10-10): the appendix (section#appendix) ends with a collapsed "About this report" entry
// (details#about-report) that shows the same facts as the CONTEXT block in d-data.js, the brief the Ask panel hands Claude first.
// Run with every chapter open: opens the entry, screenshots it, audits it open, closes it again.
async function about(page) {
  const brief = await page.evaluate(() => (typeof CONTEXT !== 'undefined' ? CONTEXT : null));
  const r = await page.evaluate(() => { const ap = document.getElementById('appendix'), el = document.getElementById('about-report');
    const body = ap && (ap.querySelector('.pbi') || ap); const entries = body ? [...body.children].filter(e => !/^(SCRIPT|STYLE|TEMPLATE)$/.test(e.tagName)) : [];
    const sum = el && el.querySelector(':scope > summary');
    return { tag: 'about', appendix: !!ap, entry: !!el, inAppendix: !!(ap && el && ap.contains(el)), last: !!el && entries[entries.length - 1] === el,
      details: !!el && el.tagName === 'DETAILS', openOnLoad: !!el && el.open, summary: sum ? sum.textContent.replace(/\s+/g, ' ').trim() : '' }; });
  r.brief = !!brief; r.missing = []; r.missingLinks = [];
  if (r.entry && r.details) {
    await page.locator('#about-report > summary').scrollIntoViewIfNeeded(); await page.click('#about-report > summary'); await page.waitForTimeout(500);
    const shown = await page.evaluate(() => { const el = document.getElementById('about-report'); return { open: el.open, text: el.innerText.replace(/\s+/g, ' '), hrefs: [...el.querySelectorAll('a[href]')].map(a => a.href) }; });
    r.opens = shown.open; await page.locator('#about-report').screenshot({ path: S + '09-1440-dark-about.png' });
    if (brief) { const norm = x => x.replace(/\s+/g, ' ').trim(); r.missing = briefStrings(brief).filter(x => !shown.text.includes(norm(x))).map(x => x.slice(0, 40));
      r.missingLinks = (Array.isArray(brief.project && brief.project.links) ? brief.project.links : []).map(l => l.url).filter(u => !shown.hrefs.some(h => h.replace(/\/$/, '') === u.replace(/\/$/, ''))); }
    r.openAudit = await audit(page, 'dark1440-about-open');
    await page.click('#about-report > summary'); await page.waitForTimeout(300);
  }
  const f = [];
  if (!r.brief) f.push('no CONTEXT brief in the page: add the CONTEXT block to d-data.js');
  if (!r.appendix) f.push('no appendix (section.panel#appendix) to hold the About this report entry');
  if (!r.entry) f.push('no "About this report" entry (details#about-report)');
  else {
    if (!r.inAppendix) f.push('About this report is not inside the appendix');
    else if (!r.last) f.push('About this report is not the last entry of the appendix');
    if (!r.details) f.push('About this report is not a collapsible details element');
    if (r.openOnLoad) f.push('About this report is open on load; it starts collapsed');
    if (r.summary !== 'About this report') f.push(`its summary reads "${r.summary}", not "About this report"`);
    if (r.details && !r.opens) f.push('About this report does not open when its summary is clicked');
    if (r.missing.length) f.push('the entry leaves out brief facts: ' + r.missing.join('; '));
    if (r.missingLinks.length) f.push('the entry leaves out brief links: ' + r.missingLinks.join(' '));
    const a = r.openAudit; if (a && (a.small.length || a.smallTargets.length || a.hscroll)) f.push('the open entry breaks the text or target size floor: ' + [...a.small, ...a.smallTargets].slice(0, 4).join('; '));
  }
  r.fails = f; return r;
}
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
  { const o = await opening(page); o.fails = openingFails(o); log.push(o); }
  log.push(await glossary(page, 'dark'));
  await expandAll(page); await sweep(page);
  log.push(await audit(page, 'dark1440-expanded'));
  log.push(await length(page));
  log.push(await about(page));
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
  { const o = await opening(page); log.push({ tag: 'opening-light', lowContrast: o.lowContrast || [], filled: o.filled || [] }); }
  log.push(await glossary(page, 'light'));
  for (const id of sections.slice(0, 2)) { const el = page.locator('#' + id); await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(500); await el.screenshot({ path: S + `03-1440-light-${id}.png` }); }
  log.push(await audit(page, 'light1440-expanded'));
  await ctx.close();
}
if (only === 'all' || only === '800') {
  for (const theme of ['dark', 'light']) {
    const { ctx, page } = await open({ width: 800, height: 1000 }, theme);
    await page.screenshot({ path: S + `04-800-${theme}-top.png` });
    log.push({ tag: 'lead-800-' + theme, leadPx: await page.evaluate(() => { const ps = [...document.querySelectorAll('#overview .lead p')].filter(p => !p.closest('.ask,.how-card')); return ps.length ? Math.min(...ps.map(p => parseFloat(getComputedStyle(p).fontSize))) : 0; }) });
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
  log.push({ tag: 'no-motion', pageErrors: e2, ...(await p2.evaluate(() => { const els = [...document.querySelectorAll('#overview .opening li')]; return { visibleOpening: els.filter(t => getComputedStyle(t).opacity === '1').length, opening: els.length }; })) });
  await ctx2.close();
}
await browser.close();
const failed = log.filter(l => l.hscroll || (l.small && l.small.length) || (l.smallTargets && l.smallTargets.length) || l.dashesOrCurlyQuotes || (l.pageErrors && l.pageErrors.length) || (l.tag === 'no-webgl' && l.figuresWithContent < l.figures) || (l.tag === 'no-motion' && (!l.opening || l.visibleOpening < l.opening)) || ((l.tag === 'opening' || l.tag === 'about') && l.fails.length) || (l.tag === 'opening-light' && (l.lowContrast.length || l.filled.length)) || (/^lead-800/.test(l.tag) && l.leadPx < 18) || (/^glossary/.test(l.tag) && ((l.inPage && (!l.terms || !l.hoverShows || !l.leaveHides || !l.focusShows || !l.escapeHides || !l.footer)) || (!l.inPage && l.markup) || (l.declared !== null && l.declared !== l.inPage))) || (l.tag === 'length' && (l.screens > 3.3 || l.chapters > 5 || l.longCaptions.length)));
console.log(JSON.stringify({ pass: errs.length === 0 && failed.length === 0, errs, log }, null, 1));
process.exit(errs.length || failed.length ? 1 : 0);
