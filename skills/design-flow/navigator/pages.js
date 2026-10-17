/* Look navigator: the sample pages a look is tried on (report opening, site hero, two-option comparison).
   One markup for every look; a look only changes the CSS variables and a few traits (glass, hard shadows, hairlines...) on the box.
   No ids inside, so two copies can sit on one page (Compare). Sample content is neutral, never real personal data. */
(function () {
'use strict';
const I = {
  check: '<path d="M20 6 9 17l-5-5"/>', half: '<path d="M5 12h14"/>', x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>'
};
const ic = n => `<svg class="lk-i" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const st = (k, w) => `<span class="lk-st ${k}">${ic(k === 'ok' ? 'check' : k === 'part' ? 'half' : 'x')}${w}</span>`;
const BAR = (label, pct, k, word) => `<div class="lk-bar"><span class="lk-bar-l">${label}</span><span class="lk-bar-t"><span class="lk-bar-f ${k}" style="--w:${pct}%"></span></span><span class="lk-bar-v mono">${pct}%</span><span class="lk-bar-w">${word}</span></div>`;

const PAGES = {
  report: { label: 'Report opening', html: () => `
<div class="lk-page lk-report">
 <div class="lk-mast rv"><span class="lk-logo disp">Field notes</span><span class="lk-meta mono">Report · 17 Oct</span></div>
 <h1 class="lk-title rv">Is the new photo search ready to launch?</h1>
 <div class="lk-lead-wrap">
  <div class="lk-lead rv">
   <p>We rebuilt search for the <b class="hl">trip footage library</b> so you can type what you remember, like "sunset over the harbour", and get the right clip back. The old search only matched file names.</p>
   <p>We ran <b class="hl">500 real searches</b> from last month on both versions. The new one put the right clip in the first row <b class="hl">4 times in 5</b> (measured), up from 1 in 3. On old drives it is slower, <b class="hl">about 2 seconds</b>.</p>
  </div>
  <aside class="lk-card lk-how rv"><h3>How we checked</h3><ol><li>Took 500 searches from last month's log.</li><li>Ran each on the old and the new search.</li><li>Counted when the right clip was in the first row.</li></ol></aside>
 </div>
 <div class="lk-call rv"><span class="lk-call-k mono">Your call</span><span class="lk-call-q">Launch on Friday, or wait a week to speed up old drives?</span><span class="lk-call-b"><button class="lk-btn pri" type="button" data-pick>Launch Friday</button><button class="lk-btn" type="button" data-pick>Wait a week</button></span></div>
 <ul class="lk-bul">
  <li class="rv"><span class="lk-dot"></span><span><b class="hl">4 in 5</b> searches find the right clip in the first row, up from 1 in 3.</span></li>
  <li class="rv"><span class="lk-dot"></span><span><b class="hl">Under 1 second</b> on new drives, about 2 seconds on old ones.</span></li>
  <li class="rv"><span class="lk-dot"></span><span><b class="hl">No new cost</b>: it runs on the computer you already have.</span></li>
  <li class="rv"><span class="lk-dot"></span><span><b class="hl">12 searches</b> still miss; all of them are people's names.</span></li>
 </ul>
 <figure class="lk-card lk-fig rv">
  <figcaption><span class="lk-fno disp">Fig 1</span><span>Right clip in the first row, 500 searches</span></figcaption>
  ${BAR('Old search', 33, 'miss', 'misses')}${BAR('New search, old drive', 74, 'part', 'close')}${BAR('New search', 80, 'ok', 'good')}
 </figure>
</div>` },
  site: { label: 'Site hero', html: () => `
<div class="lk-page lk-site">
 <nav class="lk-nav rv"><span class="lk-logo disp">Wayfarer</span><span class="lk-links"><span>Features</span><span>Pricing</span><span>Stories</span></span><button class="lk-btn pri sm" type="button" data-pick>Start free</button></nav>
 <div class="lk-hero">
  <div class="lk-hero-t">
   <span class="lk-pill rv"><span class="lk-pdot"></span>New: search by what you remember</span>
   <h1 class="disp lk-h1 rv">Every trip, one tidy library.</h1>
   <p class="lk-sub rv">Drop in clips from every camera. Wayfarer sorts them by place and day, and finds any moment in a second.</p>
   <div class="lk-ctas rv"><button class="lk-btn pri" type="button" data-pick>Start free</button><button class="lk-btn" type="button" data-pick>${ic('play')}Watch the tour</button></div>
   <p class="lk-proof rv"><b class="mono">2,400</b> travel creators<span class="lk-sep"></span><b class="mono">4.8</b> average rating</p>
  </div>
  <div class="lk-card lk-app rv">
   <div class="lk-search">${ic('search')}<span>sunset over the harbour</span><span class="lk-kbd mono">6 clips</span></div>
   <div class="lk-tiles">
    <div class="lk-tile t1 best"><span class="lk-tl mono">18:42</span><span class="lk-best">Best</span></div>
    <div class="lk-tile t2"><span class="lk-tl mono">18:10</span></div>
    <div class="lk-tile t3"><span class="lk-tl mono">17:55</span></div>
    <div class="lk-tile t4"><span class="lk-tl mono">18:31</span></div>
    <div class="lk-tile t5"><span class="lk-tl mono">18:47</span></div>
    <div class="lk-tile t6"><span class="lk-tl mono">18:20</span></div>
   </div>
  </div>
 </div>
 <div class="lk-feats">
  <div class="lk-card lk-feat rv"><span class="lk-fi">${ic('pin')}</span><h3>Sorted by place</h3><p>Every clip lands on the map, grouped by day.</p></div>
  <div class="lk-card lk-feat rv"><span class="lk-fi">${ic('zap')}</span><h3>Find any moment</h3><p>Type what you remember; get the second it happened.</p></div>
  <div class="lk-card lk-feat rv"><span class="lk-fi">${ic('shield')}</span><h3>Backed up twice</h3><p>Checked copies on two drives before you wipe a card.</p></div>
 </div>
</div>` },
  compare: { label: 'Comparison tabs', html: () => `
<div class="lk-page lk-cmp">
 <div class="lk-mast rv"><span class="lk-logo disp">Trip planner</span><span class="lk-meta mono">Decision · 2 options</span></div>
 <h1 class="lk-title rv">Which camera bag for the Vietnam trip?</h1>
 <div class="lk-tabs rv" role="tablist" aria-label="Options"><span class="lk-tab-pill" aria-hidden="true"></span><button class="lk-tab" role="tab" type="button" aria-selected="true" data-t="both">Side by side</button><button class="lk-tab" role="tab" type="button" aria-selected="false" data-t="a">Peak 20L</button><button class="lk-tab" role="tab" type="button" aria-selected="false" data-t="b">Trail sling</button></div>
 <div class="lk-opts" data-show="both">
  <article class="lk-card lk-opt rv" data-o="a">
   <header><h3 class="disp">Peak 20L</h3><span class="lk-price mono">$189</span></header>
   <span class="lk-badge">Our pick</span>
   <ul class="lk-crit"><li><span>Drone and 2 lenses</span>${st('ok', 'Fits')}</li><li><span>Carry-on size</span>${st('ok', 'Yes')}</li><li><span>Rain</span>${st('ok', 'Sealed')}</li><li><span>Weight</span>${st('part', '1.6 kg')}</li></ul>
   <button class="lk-btn pri" type="button" data-pick>Pick Peak 20L</button>
  </article>
  <article class="lk-card lk-opt rv" data-o="b">
   <header><h3 class="disp">Trail sling</h3><span class="lk-price mono">$119</span></header>
   <span class="lk-badge ghost">Lighter</span>
   <ul class="lk-crit"><li><span>Drone and 2 lenses</span>${st('part', 'Drone only')}</li><li><span>Carry-on size</span>${st('ok', 'Yes')}</li><li><span>Rain</span>${st('miss', 'No cover')}</li><li><span>Weight</span>${st('ok', '0.7 kg')}</li></ul>
   <button class="lk-btn" type="button" data-pick>Pick Trail sling</button>
  </article>
 </div>
 <div class="lk-call rv"><span class="lk-call-k mono">Your call</span><span class="lk-call-q">Peak 20L carries everything and survives rain. Trail sling saves 0.9 kg.</span></div>
</div>` }
};
const KINDS = Object.keys(PAGES);

const DENS = { airy: 1.18, regular: 1, dense: 0.84 };
const font = (f, fb) => f ? `"${f}", ${fb}` : fb;
function vars(look, theme) {
  const p = look[theme] || look[look.first];
  const mo = look.attrs && look.attrs.motion ? look.attrs.motion.v / 10 : 0.5;
  const ex = Object.values(look.extra || look.candy || (look.hues && look.hues[theme]) || {});
  return {
    '--bg': p.bg, '--s1': p.s1, '--s2': p.s2, '--line': p.line, '--txt': p.txt, '--txt2': p.txt2,
    '--ac': p.accent, '--acT': p.accentTxt || p.accent, '--onAc': p.onAccent || '#fff', '--ok': p.ok, '--part': p.part, '--miss': p.miss,
    '--x1': ex[0] || p.part, '--x2': ex[1] || p.ok,
    '--r': (look.radius ?? 12) + 'px', '--sp': DENS[String(look.density || 'regular').toLowerCase()] || 1, '--mo': mo.toFixed(2),
    '--fd': font(look.fonts.display, 'ui-sans-serif, system-ui, sans-serif'), '--fb': font(look.fonts.body, 'ui-sans-serif, system-ui, sans-serif'), '--fm': font(look.fonts.mono, 'ui-monospace, Menlo, monospace')
  };
}
function apply(box, look, theme) {
  const v = vars(look, theme); for (const k in v) box.style.setProperty(k, v[k]);
  box.className = 'lk ' + (look.flavor || []).map(f => 'f-' + f).join(' ') + (theme === 'light' ? ' is-light' : ' is-dark');
  box.dataset.look = look.id;
}
/* Fill a box with a page in a look. kind changes rebuild the markup; look changes only restyle it, then replay the entrance. */
function mount(box, look, theme, kind, opts) {
  kind = PAGES[kind] ? kind : 'report';
  if (box.dataset.kind !== kind || !box.querySelector('.lk-page')) {
    box.innerHTML = '<div class="lk-bg" aria-hidden="true"></div>' + PAGES[kind].html();
    box.dataset.kind = kind;
    box.querySelectorAll('.rv').forEach((el, i) => el.style.setProperty('--i', i));
  }
  apply(box, look, theme);
  if (!(opts && opts.still)) replay(box);
}
function replay(box) { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; box.classList.remove('play'); void box.offsetWidth; box.classList.add('play'); }

/* The sample pages' own controls work: tabs switch, pick buttons toggle, a spotlight follows the pointer on spotlight looks. */
document.addEventListener('click', e => {
  const tab = e.target.closest('.lk .lk-tab');
  if (tab) { const box = tab.closest('.lk-page'); box.querySelectorAll('.lk-tab').forEach(t => t.setAttribute('aria-selected', String(t === tab))); box.querySelector('.lk-opts').dataset.show = tab.dataset.t; movePill(tab); return; }
  const pick = e.target.closest('.lk [data-pick]');
  if (pick) { const grp = pick.parentElement; grp.querySelectorAll('[data-pick]').forEach(b => b.classList.toggle('on', b === pick && !b.classList.contains('on'))); }
});
function movePill(tab) { const bar = tab.parentElement, pill = bar.querySelector('.lk-tab-pill'); if (!pill) return; pill.style.width = tab.offsetWidth + 'px'; pill.style.transform = `translateX(${tab.offsetLeft - 4}px)`; }
function settle(root) { (root || document).querySelectorAll('.lk-tab[aria-selected="true"]').forEach(movePill); }
addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return; const c = e.target.closest && e.target.closest('.lk.f-spotlight .lk-card'); if (!c) return;
  const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, { passive: true });

window.NavPages = { PAGES, KINDS, vars, apply, mount, replay, settle };
})();
