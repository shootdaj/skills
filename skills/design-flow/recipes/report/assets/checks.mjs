// Shared page checks for the report recipe and the page recipe. Each *Eval function runs inside the page (page.evaluate), so it may
// only use what the browser has; the *Fails functions read the result. shoot.mjs (the full report verification) and
// design-flow/scripts/check-page.mjs (the publish gate) both import from here, so a rule changes in one place.

// Text, target and typography audit at the current viewport. Excludes screen-reader text, hidden nodes and the theme doors.
export const auditEval = (tag) => {
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
};
export const auditFails = l => !!(l.hscroll || (l.small && l.small.length) || (l.smallTargets && l.smallTargets.length) || l.dashesOrCurlyQuotes);

// The opening rule (2026-10-08): the overview is an h1 title (the question the report answers or the decision it supports, 14 words
// or fewer, normal heading size), then p.purpose (one line: the source and what the reader does now), then ul.opening: four to six
// one-line bullets, each led by a bold key number or phrase, the first starting within 150 px of the overview top. No other paragraph,
// verdict label, eyebrow or stat tiles. Title 32 px at most, no text above 48 px anywhere, no italic text in any heading or hero element.
// Run at 1440 wide. mode 'report' (default) wants a whole figure in the first screen; mode 'page' (proof, approval, judging, gallery)
// wants the first item to have started before the fold, since a full-width screenshot is taller than what is left of the screen.
export const openingEval = (mode) => {
  const ov = document.getElementById('overview'); if (!ov) return { tag: 'opening', missing: '#overview' };
  const kids = [...ov.children]; const h1 = ov.querySelector('h1'); const purpose = ov.querySelector('p.purpose');
  const ul = ov.querySelector('ul.opening'); const after = purpose ? purpose.nextElementSibling : null;
  const lis = ul ? [...ul.children].filter(e => e.tagName === 'LI') : [];
  const lines = el => { const t = el.querySelector('.ot') || el; const lh = parseFloat(getComputedStyle(t).lineHeight) || 24; return Math.round(t.getBoundingClientRect().height / lh); };
  const H = innerHeight, inFold = e => { const r = e.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= H; };
  const started = e => { const r = e.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.top < H - 80; };
  const shown = e => { const cs = getComputedStyle(e); return e.getClientRects().length && cs.display !== 'none' && cs.visibility !== 'hidden' && !e.closest('.doors,.sr,[inert]'); };
  const label = e => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '');
  const textEls = [...document.body.querySelectorAll('*')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && shown(e));
  const firstItem = document.querySelector('.panel.open .fg, .panel.open .ap, .panel.open .jd, .panel.open .gal .gc');
  return { tag: 'opening', mode: mode || 'report',
    titleFirst: !!h1 && kids[0] === h1, titleWords: h1 ? h1.textContent.trim().split(/\s+/).length : 0, titlePx: h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0,
    bulletsTop: lis.length ? Math.round(lis[0].getBoundingClientRect().top - ov.getBoundingClientRect().top) : 0,
    purposeLine: !!purpose && kids[1] === purpose && lines(purpose) === 1,
    bulletsFirst: !!ul && !!after && (after === ul || after.firstElementChild === ul), bullets: lis.length,
    firstScreen: lis.length > 0 && lis.every(inFold) && (mode === 'page' ? !!firstItem && started(firstItem) : [...document.querySelectorAll('#overview .fg, .panel.open .fg')].some(inFold)),
    unled: lis.filter(li => !li.querySelector('b,strong')).length, wrapped: lis.filter(li => lines(li) > 1).length,
    display: textEls.filter(e => parseFloat(getComputedStyle(e).fontSize) > 48).map(e => label(e) + ' ' + getComputedStyle(e).fontSize).slice(0, 5),
    italic: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,h1 *,h2 *,h3 *,h4 *,h5 *,h6 *,#overview,#overview *,.top *,.ph *,.fg-h *')].filter(e => textEls.includes(e) && /italic|oblique/.test(getComputedStyle(e).fontStyle)).map(label).slice(0, 5),
    italicAnywhere: textEls.filter(e => /italic|oblique/.test(getComputedStyle(e).fontStyle)).map(label).slice(0, 5),
    banned: [...document.querySelectorAll('.verdict,.eyebrow,.tiles,.tile,.stat-tile,#overview p:not(.purpose),#overview .ov-grid > p')].map(label).slice(0, 5) };
};
export const openingFails = l => !!(l.missing || !l.titleFirst || l.titleWords > 14 || l.titlePx > 32 || l.bulletsTop > 150 || !l.purposeLine || !l.bulletsFirst || l.bullets < 4 || l.bullets > 6 || l.unled || l.wrapped || !l.firstScreen || l.display.length || l.italic.length || l.banned.length);
// One line per broken rule, for people reading the gate's output.
export const openingWhy = l => {
  if (l.missing) return ['no ' + l.missing + ' section'];
  const w = [];
  if (!l.titleFirst) w.push('the h1 title is not the first thing in #overview');
  if (l.titleWords > 14) w.push(`title has ${l.titleWords} words (14 at most)`);
  if (l.titlePx > 32) w.push(`title is ${l.titlePx}px (32 at most)`);
  if (!l.purposeLine) w.push('no one-line p.purpose right under the title');
  if (!l.bulletsFirst) w.push('ul.opening does not follow the purpose line');
  if (l.bullets < 4 || l.bullets > 6) w.push(`${l.bullets} opening bullets (four to six)`);
  if (l.bulletsTop > 150) w.push(`bullets start ${l.bulletsTop}px down (150 at most)`);
  if (l.unled) w.push(`${l.unled} bullet(s) without a bold lead`);
  if (l.wrapped) w.push(`${l.wrapped} bullet(s) wrap past one line at 1440`);
  if (!l.firstScreen) w.push(l.mode === 'page' ? 'the bullets and the first item do not fit the first screen at 1440 by 900' : 'the bullets and one figure do not fit the first screen at 1440 by 900');
  if (l.display.length) w.push('text over 48px: ' + l.display.join(', '));
  if (l.italic.length) w.push('italic in a heading or the overview: ' + l.italic.join(', '));
  if (l.banned.length) w.push('banned opening elements: ' + l.banned.join(', '));
  return w;
};

// The length budget (2026-10-08, "any future reports need to be fucking shorter"): with every chapter open the page fits in about
// three 900 px screens before the appendix (fails above 3.3), at most five chapters, every caption 12 words or fewer (a Details link excluded).
export const lengthEval = () => {
  const ap = document.getElementById('appendix'); const end = ap || document.querySelector('footer') || document.body;
  const endY = ap ? ap.getBoundingClientRect().top + scrollY : end.getBoundingClientRect().bottom + scrollY;
  const words = c => { const k = c.cloneNode(true); k.querySelectorAll('.dlink').forEach(d => d.remove()); return k.textContent.trim().split(/\s+/).filter(Boolean).length; };
  return { tag: 'length', screens: +(endY / 900).toFixed(2), chapters: document.querySelectorAll('section.panel:not(#appendix):not(#prototypes)').length,
    longCaptions: [...document.querySelectorAll('figcaption')].filter(c => words(c) > 12).map(c => words(c) + ' words: ' + c.textContent.trim().slice(0, 40)).slice(0, 8) };
};
export const lengthFails = l => !!(l.screens > 3.3 || l.chapters > 5 || l.longCaptions.length);

// Glossary hover (2026-10-08): with a glossary, at least one term is wrapped and hover, focus and Escape work; without one, no glossary
// markup at all. Drives the page, so it takes the Playwright page; shotPath (optional) saves the hover screenshot.
export async function glossaryRun(page, theme, shotPath) {
  const st = await page.evaluate(() => ({ inPage: !!window.REPORT_GLOSSARY, source: window.REPORT_GLOSSARY ? window.REPORT_GLOSSARY.source : null,
    terms: document.querySelectorAll('.gl-term').length, markup: document.querySelectorAll('.gl-term,#gl-pop,.gl-src').length,
    footer: (document.querySelector('.gl-src') || {}).textContent || '' }));
  const r = { tag: 'glossary-' + theme, ...st };
  if (!st.inPage || !st.terms) return r;
  const shown = () => page.evaluate(() => { const p = document.getElementById('gl-pop'); return p && p.classList.contains('show') && getComputedStyle(p).fontStyle === 'normal' ? p.textContent : ''; });
  const t = page.locator('.gl-term').first(); await t.scrollIntoViewIfNeeded(); await t.hover(); await page.waitForTimeout(300);
  r.hoverShows = !!(await shown()); r.popText = (await shown()).slice(0, 80);
  if (shotPath) await page.screenshot({ path: shotPath });
  await page.mouse.move(2, 2); await page.waitForTimeout(250); r.leaveHides = !(await shown());
  await t.focus(); await page.waitForTimeout(150); r.focusShows = !!(await shown());
  await page.keyboard.press('Escape'); await page.waitForTimeout(150); r.escapeHides = !(await shown());
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); scrollTo(0, 0); }); await page.waitForTimeout(200);
  return r;
}
// declared: true when the project declares a glossary, false when it declares none, null when unknown (no --repo).
export const glossaryFails = (l, declared) => !!((l.inPage && (!l.terms || !l.hoverShows || !l.leaveHides || !l.focusShows || !l.escapeHides || !l.footer)) || (!l.inPage && l.markup) || (declared !== null && declared !== undefined && declared !== l.inPage));
