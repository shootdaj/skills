/* Look navigator: the app. Views: map (home), look, try, compare, make, system. The whole state lives in the link
   (?look=ink&page=report&theme=light&vs=plum...), so any view can be sent to a phone. Never writes files: new looks leave as a
   ready-to-paste request for Claude. */
(function () {
'use strict';
const D = document, R = D.documentElement;
const Q = (s, r = D) => r.querySelector(s), QA = (s, r = D) => [...r.querySelectorAll(s)];
const E = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ic = (n, c) => `<svg class="i${c ? ' ' + c : ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const N = window.NavData, P = window.NavPages;
const DEMO_BASE = R.dataset.demoBase || '../directions/';
const store = { get(k) { try { return localStorage.getItem('look-nav:' + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem('look-nav:' + k, v); } catch (e) {} } };

/* ───────── state, in the link ───────── */
const VIEWS = ['map', 'look', 'try', 'compare', 'make', 'system'];
const S = { view: 'map', look: '', vs: '', page: 'report', theme: 'dark', layout: 'map', job: 'all', mode: 'blend', mix: 50, px: null, py: null, name: '', demo: false };
let data = { looks: [], meta: {} }, byId = new Map(), prevLook = '';
function resolve(q) {
  if (!q) return null; q = String(q).toLowerCase();
  return byId.get(q) || data.looks.find(l => l.id.startsWith(q)) || data.looks.find(l => l.name.toLowerCase().startsWith(q)) || data.looks.find(l => l.id.includes(q)) || null;
}
function readURL() {
  const q = new URLSearchParams(location.search), g = k => q.get(k);
  let view = g('view');
  if (!VIEWS.includes(view)) view = g('vs') ? 'compare' : g('page') ? 'try' : g('look') ? 'look' : 'map';
  Object.assign(S, {
    view, look: g('look') || '', vs: g('vs') || '', page: P.PAGES[g('page')] ? g('page') : 'report', layout: g('layout') === 'grid' ? 'grid' : 'map',
    job: g('job') || 'all', mode: g('mode') === 'pin' ? 'pin' : 'blend', mix: g('mix') != null ? Math.max(0, Math.min(100, +g('mix') || 0)) : 50,
    px: g('px') != null ? +g('px') : null, py: g('py') != null ? +g('py') : null, name: g('name') || '', demo: g('demo') === '1'
  });
  const t = g('theme'); S.theme = t === 'light' || t === 'dark' ? t : (store.get('theme') === 'light' ? 'light' : 'dark');
}
function writeURL(push) {
  const q = new URLSearchParams();
  if (S.view !== 'map') q.set('view', S.view);
  const needLook = ['look', 'try', 'compare'].includes(S.view) || (S.view === 'make' && S.mode === 'blend');
  if (needLook && S.look) q.set('look', S.look);
  if ((S.view === 'compare' || (S.view === 'make' && S.mode === 'blend')) && S.vs) q.set('vs', S.vs);
  if (S.view === 'try' || S.view === 'compare') q.set('page', S.page);
  if (S.view === 'map' && S.layout === 'grid') q.set('layout', 'grid');
  if (S.view === 'map' && S.job !== 'all') q.set('job', S.job);
  if (S.view === 'make') { q.set('mode', S.mode); if (S.mode === 'blend') q.set('mix', S.mix); else if (S.px != null) { q.set('px', S.px.toFixed(1)); q.set('py', S.py.toFixed(1)); } if (S.name) q.set('name', S.name); }
  if (S.view === 'look' && S.demo) q.set('demo', '1');
  q.set('theme', S.theme);
  const url = location.pathname + '?' + q.toString().replace(/%2C/g, ',');
  if (url !== location.pathname + location.search) history[push ? 'pushState' : 'replaceState'](null, '', url);
}
/* Fill gaps: a view that needs a look gets one (the last used, else the first). */
function settle() {
  const L = resolve(S.look) || resolve(store.get('last')) || data.looks[0];
  if (L) S.look = L.id;
  if (S.view === 'compare' || S.view === 'make') {
    let B = resolve(S.vs); if (!B || B.id === S.look) B = data.looks.find(l => l.id !== S.look && l.first !== (L && L.first)) || data.looks.find(l => l.id !== S.look);
    if (B) S.vs = B.id;
  }
}
const cur = () => byId.get(S.look) || data.looks[0];

/* ───────── helpers ───────── */
function toast(msg) { const t = Q('#toast'); t.innerHTML = ic('check') + '<span>' + E(msg) + '</span>'; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2600); }
window.__navToast = toast;
async function copy(text) {
  window.__lastCopy = text;
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (e) {}
  const ta = D.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;opacity:0'; D.body.appendChild(ta); ta.select();
  let ok = false; try { ok = D.execCommand('copy'); } catch (e) {} ta.remove(); return ok;
}
function flash(btn, label) {
  const old = btn.dataset.label || btn.innerHTML; btn.dataset.label = old;
  btn.innerHTML = ic('check') + '<span>' + E(label) + '</span>'; btn.classList.add('done');
  clearTimeout(btn._t); btn._t = setTimeout(() => { btn.innerHTML = old; btn.classList.remove('done'); delete btn.dataset.label; }, 1800);
}
async function useLook(L, btn) {
  const text = 'use ' + L.name; await copy(text);
  if (btn) flash(btn, 'Copied'); toast(`Copied "${text}". Paste it to Claude.`);
}
function vt(fn, kind) {
  if (!D.startViewTransition || still()) { fn(); return; }
  if (kind) R.dataset.dir = kind; else delete R.dataset.dir;
  const t = D.startViewTransition(fn); vt.cur = t;
  t.finished.finally(() => { if (vt.cur === t) vt.cur = null; delete R.dataset.dir; delete R.dataset.vt; QA('[data-vtn]').forEach(el => { el.style.viewTransitionName = ''; el.removeAttribute('data-vtn'); }); });
  return t;
}
const pal = (L, th) => L[th || S.theme] || L[L.first];
function tileVars(L, th) {
  const p = pal(L, th);
  return `--tbg:${p.bg};--ts1:${p.s1};--ttx:${p.txt};--tac:${p.accent};--tr:${Math.max(3, Math.round((L.radius ?? 12) * 0.75))}px;--tfd:${L.fonts.display ? `'${L.fonts.display}', ` : ''}var(--font)`;
}
const fontsDone = new Set();
function ensureFonts(looks) {
  for (const L of looks) {
    const g = L.fonts && L.fonts.google; if (!g || fontsDone.has(g)) continue; fontsDone.add(g);
    const l = D.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + g + '&display=swap'; D.head.appendChild(l);
  }
}
function segHTML(name, items, val, label) {
  return `<div class="seg" role="group" aria-label="${E(label)}" data-seg="${name}"><span class="thumb" aria-hidden="true"></span>${items.map(([v, t, icon]) => `<button type="button" data-v="${v}" aria-pressed="${v === val}">${icon ? ic(icon) : ''}<span>${E(t)}</span></button>`).join('')}</div>`;
}
function seatSegs(root) { QA('.seg', root).forEach(seat); }
function seat(seg) { const on = Q('button[aria-pressed="true"]', seg), th = Q('.thumb', seg); if (!on || !th) return; th.style.width = on.offsetWidth + 'px'; th.style.transform = `translateX(${on.offsetLeft}px)`; }
function setSeg(seg, v) { QA('button', seg).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v))); seat(seg); }
function lookOptions(sel) { return data.looks.map(l => `<option value="${l.id}"${l.id === sel ? ' selected' : ''}>${E(l.name)}</option>`).join(''); }
function selHTML(cls, val, label) { const L = byId.get(val); return `<label class="sel ${cls}"><span class="sw" style="background:${L ? pal(L).accent : 'transparent'}"></span><span class="sr">${E(label)}</span><select data-pick="${cls}" aria-label="${E(label)}">${lookOptions(val)}</select></label>`; }
const idx = id => data.looks.findIndex(l => l.id === id);
const step = (id, d) => { const n = data.looks.length; return data.looks[((idx(id) + d) % n + n) % n]; };
function contrastBadge(fg, bg, label, onFill) {
  const c = N.contrast(fg, bg); if (!c) return '';
  const k = c >= 4.5 ? 'good' : c >= 3 ? 'warn' : 'bad';
  return `<span class="badge ${k}" title="${E(label)} on ${onFill ? 'the accent fill' : 'the background'}: ${c.toFixed(1)} to 1 (4.5 or more reads easily)">${ic(k === 'good' ? 'check' : 'x')}${E(label)} ${c.toFixed(1)}:1</span>`;
}

/* ───────── views ───────── */
const V = {};
let mounted = null, radars = [];

/* MAP (home) */
V.map = {
  mount(root) {
    const counts = Object.fromEntries(N.JOBS.map(j => [j.id, data.looks.filter(l => l.jobs.includes(j.id)).length]));
    root.innerHTML = `
<div class="v-head"><div><h1>Your looks</h1><p class="sub">${data.looks.length} looks, placed by feel: <b>calm to bold</b> across, <b>serious to playful</b> down. Tap a look to open it. Tap an empty spot to start a new look there.</p></div></div>
<div class="toolbar">
 <div class="chips" role="group" aria-label="Filter by job"><button class="chip" type="button" data-job="all" aria-pressed="${S.job === 'all'}">All <span class="n">${data.looks.length}</span></button>${N.JOBS.filter(j => counts[j.id]).map(j => `<button class="chip" type="button" data-job="${j.id}" aria-pressed="${S.job === j.id}">${j.label} <span class="n">${counts[j.id]}</span></button>`).join('')}</div>
 <div class="tools">${segHTML('layout', [['map', 'Map', 'map'], ['grid', 'Grid', 'grid']], S.layout, 'Map or grid')}${segHTML('theme', [['dark', 'Dark', 'moon'], ['light', 'Light', 'sun']], S.theme, 'Tiles in dark or light')}</div>
</div>
<div class="board"></div>
<details class="how"><summary>${ic('spark')}How the map places each look</summary><div class="body">
 <p><b>Across, calm to bold:</b> half boldness, plus colourfulness, motion and contrast. <b>Down, serious to playful:</b> half playfulness, plus roundness and how informal it is.</p>
 <p>Colourfulness, contrast and roundness are measured from each look file. Boldness, playfulness, formality and motion are judged by Claude and kept in <code>navigator/judged.json</code>. A new look with no judged scores yet is placed from its measured ones and carries a dashed dot.</p>
</div></details>
<div class="map-foot"><span>Looks read from <code>design-flow/directions/</code>.</span><button class="linkish" type="button" data-go="system">${ic('net')}How the pieces fit together</button></div>`;
    this.root = root; this.board = Q('.board', root);
    this.draw();
    root.addEventListener('click', e => {
      const j = e.target.closest('[data-job]'); if (j) { S.job = j.dataset.job; QA('[data-job]', root).forEach(b => b.setAttribute('aria-pressed', String(b === j))); writeURL(false); this.filter(); return; }
      const sb = e.target.closest('[data-seg] button'); if (sb) {
        const seg = sb.closest('[data-seg]').dataset.seg;
        if (seg === 'layout' && S.layout !== sb.dataset.v) { setSeg(sb.parentElement, sb.dataset.v); vt(() => { S.layout = sb.dataset.v; writeURL(false); this.draw(); }); }
        if (seg === 'theme' && S.theme !== sb.dataset.v) setTheme(sb.dataset.v, sb);
      }
    });
  },
  update() { this.draw(); setSeg(Q('[data-seg="theme"]', this.root), S.theme); },
  draw() {
    const b = this.board; radars = [];
    if (S.layout === 'grid') {
      b.innerHTML = `<div class="lgrid">${data.looks.map(L => `<button type="button" class="gcard os-card" data-id="${L.id}" data-jobs="${L.jobs.join(' ')}" style="${tileVars(L)}" aria-label="${E(L.name)}: ${E(L.mood)}">
 <span class="gprev" data-vtn-hero><span class="gn">${E(L.name)}</span><span class="gm">${E(L.mood)}</span><span class="gs">${['accent', 's1', 'txt', 'ok', 'part'].map(k => `<i style="background:${pal(L)[k]}"></i>`).join('')}</span></span>
 <span class="gmeta"><span class="gr"></span><span class="tags">${L.best.slice(0, 2).map(x => `<span class="tag">${E(x)}</span>`).join('')}</span></span></button>`).join('')}</div>`;
      QA('.gcard', b).forEach(c => { const L = byId.get(c.dataset.id); const r = new Radar(Q('.gr', c), { size: 72, labels: false, compact: true, title: L.name + ' star graph' }); r.set([{ name: L.name, cls: 'a', attrs: L.attrs }]); radars.push(r); });
    } else {
      b.innerHTML = `<div class="map-card os-card"><div class="map" aria-label="Mood map: tap a look, or tap an empty spot to make a new look">
 <span class="axis x"></span><span class="axis y"></span>
 <span class="q l">Calm</span><span class="q r">Bold</span><span class="q t">Serious</span><span class="q b">Playful</span>
 ${data.looks.map(L => `<button type="button" class="tile" data-id="${L.id}" style="${tileVars(L)}" aria-label="${E(L.name)}: ${E(L.mood)}"><span class="tile-in"><span class="tile-top"><i class="bar"></i><span class="tile-d">${['ok', 'part', 'miss'].map(k => `<i style="background:${pal(L)[k]}"></i>`).join('')}</span></span><span class="tile-n">${E(L.name)}</span></span>${L.judged ? '' : '<span class="nojudge" title="No judged scores yet: placed from measured ones"></span>'}</button>`).join('')}
</div></div>`;
      this.map = Q('.map', b); this.layout(); this.bindMap();
    }
    b.onclick = e => { const t = e.target.closest('[data-id]'); if (!t) return; openLook(t.dataset.id, t.classList.contains('tile') ? Q('.tile-in', t) : Q('.gprev', t)); };
    this.filter();
  },
  layout() { placeTiles(this.map, data.looks, { pin: this.pin }); },
  filter() { QA('[data-id]', this.board).forEach(t => { const L = byId.get(t.dataset.id); const on = S.job === 'all' || L.jobs.includes(S.job); t.classList.toggle('dim', !on); if (S.layout === 'grid') t.style.display = on ? '' : 'none'; }); },
  bindMap() {
    const m = this.map; let down = null;
    m.addEventListener('pointerdown', e => { if (e.target.closest('.tile, .pin-card')) return; down = { x: e.clientX, y: e.clientY }; });
    m.addEventListener('pointerup', e => {
      if (!down || e.target.closest('.tile, .pin-card')) { down = null; return; }
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (moved > 10) return;
      const r = m.getBoundingClientRect(); dropPin(m, e.clientX - r.left, e.clientY - r.top, this);
    });
  },
  resize() { if (S.layout === 'map' && this.map) this.layout(); }
};
/* place tiles: each look aims for its mood position; looks far from the crowd keep theirs exactly, crowded ones take the
   nearest free spot. Nothing overlaps; the map grows a little only when a look finds no room. */
function placeTiles(map, looks, opts) {
  const mini = opts && opts.mini, W = map.clientWidth, small = W < 600 || mini;
  const tw = mini ? 86 : small ? 104 : 132, th = mini ? 48 : small ? 66 : 84, gap = mini ? 6 : 8;
  map.style.height = ''; let H = map.clientHeight;
  const xs = looks.map(l => l.mood_xy.x), ys = looks.map(l => l.mood_xy.y);
  const nx = { min: Math.min(...xs) - .3, max: Math.max(...xs) + .3 }, ny = { min: Math.min(...ys) - .3, max: Math.max(...ys) + .3 };
  const mX = mini ? 20 : small ? 22 : 28, mY = mini ? 20 : 26;
  let placed, toPx, fromPx;
  for (let grow = 0; grow < 10; grow++) {
    const padX = tw / 2 + mX, padY = th / 2 + mY;
    toPx = (x, y) => [padX + (x - nx.min) / (nx.max - nx.min) * (W - 2 * padX), padY + (y - ny.min) / (ny.max - ny.min) * (H - 2 * padY)];
    fromPx = (px, py) => [nx.min + (px - padX) / (W - 2 * padX) * (nx.max - nx.min), ny.min + (py - padY) / (H - 2 * padY) * (ny.max - ny.min)];
    const pts = looks.map(l => { const [x, y] = toPx(l.mood_xy.x, l.mood_xy.y); return { id: l.id, tx: x, ty: y }; });
    const cx = pts.reduce((a, p) => a + p.tx, 0) / pts.length, cy = pts.reduce((a, p) => a + p.ty, 0) / pts.length;
    pts.sort((a, b) => Math.hypot((b.tx - cx) / W, (b.ty - cy) / H) - Math.hypot((a.tx - cx) / W, (a.ty - cy) / H));
    const kx = small ? 2.4 : 1, ky = small ? 1 : 1.15;
    placed = []; let ok = true;
    const free = (x, y) => placed.every(p => Math.abs(p.x - x) >= tw + gap || Math.abs(p.y - y) >= th + gap);
    for (const p of pts) {
      let best = null, bd = Infinity;
      for (let y = padY; y <= H - padY + .1; y += 6) for (let x = padX; x <= W - padX + .1; x += 6) {
        const d = ((x - p.tx) * kx) ** 2 + ((y - p.ty) * ky) ** 2; if (d < bd && free(x, y)) { bd = d; best = [x, y]; }
      }
      if (!best) { ok = false; break; }
      placed.push({ id: p.id, x: best[0], y: best[1] });
    }
    if (ok) break;
    H += 40; map.style.height = H + 'px';
  }
  for (const p of placed) { const t = map.querySelector(`.tile[data-id="${p.id}"]`); if (!t) continue; t.style.setProperty('--tw', tw + 'px'); t.style.setProperty('--th', th + 'px'); t.style.setProperty('--x', (p.x - tw / 2) + 'px'); t.style.setProperty('--y', (p.y - th / 2) + 'px'); }
  map._toPx = toPx; map._fromPx = fromPx;
  if (opts && opts.pin) { const [x, y] = toPx(opts.pin.mx, opts.pin.my); QA('.pin, .pin-ring', map).forEach(el => { el.style.setProperty('--x', x + 'px'); el.style.setProperty('--y', y + 'px'); }); }
}
/* the two nearest looks to a spot on the map, with inverse-distance weights */
function nearest(mx, my) {
  const ds = data.looks.filter(l => l.judged || true).map(l => ({ L: l, d: Math.hypot(l.mood_xy.x - mx, (l.mood_xy.y - my)) })).sort((a, b) => a.d - b.d);
  const [a, b] = ds; const wa = 1 / Math.max(a.d, 0.05), wb = 1 / Math.max(b.d, 0.05);
  return { a: a.L, b: b.L, t: wb / (wa + wb) };
}
function dropPin(map, px, py, owner) {
  const [mx, my] = map._fromPx(px, py);
  QA('.pin, .pin-ring, .pin-card', map).forEach(el => el.remove());
  const n = nearest(mx, my);
  map.insertAdjacentHTML('beforeend', `<span class="pin-ring" style="--x:${px}px;--y:${py}px"></span><span class="pin" style="--x:${px}px;--y:${py}px">${ic('pin')}</span>`);
  if (owner && owner.mini) { owner.onPin(mx, my); return; }
  const cw = 248, x = Math.max(8, Math.min(map.clientWidth - cw - 8, px - cw / 2)), y = py + 14 + 150 > map.clientHeight ? py - 172 : py + 14;
  map.insertAdjacentHTML('beforeend', `<div class="pin-card os-card" style="--x:${x}px;--y:${y}px" role="dialog" aria-label="New look here">
 <b>A new look here</b><p>Between <b>${E(n.a.name)}</b> and <b>${E(n.b.name)}</b>: ${mx > 5 ? 'bolder' : 'calmer'}, ${my > 5 ? 'more playful' : 'more serious'}.</p>
 <div class="row"><button class="os-btn primary" type="button" data-make>${ic('spark')}<span>Make it</span></button><button class="os-btn ghost" type="button" data-unpin aria-label="Remove the pin">${ic('x')}</button></div></div>`);
  const card = Q('.pin-card', map);
  card.addEventListener('pointerdown', e => e.stopPropagation()); card.addEventListener('pointerup', e => e.stopPropagation());
  Q('[data-unpin]', card).onclick = e => { e.stopPropagation(); QA('.pin, .pin-ring, .pin-card', map).forEach(el => el.remove()); };
  Q('[data-make]', card).onclick = e => { e.stopPropagation(); go({ view: 'make', mode: 'pin', px: Math.round(mx * 10) / 10, py: Math.round(my * 10) / 10, name: '' }); };
  Q('[data-make]', card).focus({ preventScroll: true });
}
function openLook(id, fromEl) {
  if (fromEl && D.startViewTransition && !still()) { fromEl.style.viewTransitionName = 'hero'; fromEl.setAttribute('data-vtn', ''); }
  go({ view: 'look', look: id, demo: false }, { morph: true });
}

/* LOOK page */
V.look = {
  mount(root) {
    const L = cur(); this.root = root; this.id = L.id; store.set('last', L.id);
    const i = idx(L.id), p = pal(L), demo = hasDemo(L.id);
    const prose = (txt, hue) => txt ? `<ul class="prose-list" style="--hue:${hue}">${txt.replace(/\.$/, '').split(/;\s*/).map(x => `<li>${E(x.charAt(0).toUpperCase() + x.slice(1))}</li>`).join('')}</ul>` : '<p class="muted">Not written yet.</p>';
    const JOB = { bg: 'Background', s1: 'Card', s2: 'Raised', txt: 'Text', txt2: 'Muted text', accent: 'Accent', ok: 'Good', part: 'Partly', miss: 'Missing' };
    const swRow = th => { const q = L[th]; return `<div class="swrow"><span class="os-label">${th === 'dark' ? 'Dark' : 'Light'}${L.first === th ? ' · first' : ''}</span><div class="sws">${Object.keys(JOB).filter(k => q[k]).map(k => `<span class="sw-c"><i style="background:${q[k]}"></i>${JOB[k]}<code>${E(q[k])}</code></span>`).join('')}</div><div class="contrast-row">${contrastBadge(q.txt, q.bg, 'Text')}${contrastBadge(q.txt2, q.bg, 'Muted')}${contrastBadge(q.accentTxt || q.accent, q.bg, 'Accent text')}${contrastBadge(q.onAccent, q.accent, 'Button text', true)}</div></div>`; };
    root.innerHTML = `
<div class="crumbs"><button class="os-btn ghost" type="button" data-go="map">${ic('back')}<span>All looks</span></button><span class="pos">${i + 1} of ${data.looks.length}</span></div>
<div class="look-grid">
 <div class="col">
  <div class="hero-box" style="${tileVars(L)}" data-hero>
   <span class="hb-glow"></span>
   <button class="hn p" type="button" data-step="-1" aria-label="Previous look">${ic('left')}</button><button class="hn n" type="button" data-step="1" aria-label="Next look">${ic('right')}</button>
   <span class="hk">Look · ${L.first} first</span>
   <h1>${E(L.name)}</h1>
   <p class="hm">${E(L.mood.charAt(0).toUpperCase() + L.mood.slice(1))}.</p>
   <span class="hs">${['bg', 's1', 's2', 'accent', 'ok', 'part', 'miss'].map(k => `<i style="background:${p[k]}"></i>`).join('')}</span>
   <span class="hf">${E(L.fonts.display || 'system')} · radius ${L.radius ?? '?'} · ${E(L.density || 'regular')}</span>
  </div>
  <div class="actions">
   <button class="os-btn primary" type="button" data-use>${ic('copy')}<span>Use this look</span></button>
   <button class="os-btn" type="button" data-try>${ic('shirt')}<span>Try it on</span></button>
   <button class="os-btn" type="button" data-cmp>${ic('cols')}<span>Compare</span></button>
   <button class="os-btn" type="button" data-demo ${demo ? '' : 'disabled'}>${ic('play')}<span>${demo ? 'Full demo' : 'Demo coming'}</span></button>
  </div>
  <section class="os-card demo-card" aria-label="Full demo">${demo ? `<button class="demo-thumb" type="button" data-demo aria-label="Open the full demo of ${E(L.name)}"><iframe title="${E(L.name)} demo preview" src="${E(demoURL(L.id))}" loading="lazy" tabindex="-1" aria-hidden="true"></iframe><span class="play">${ic('play')}Open the full demo</span></button><div class="demo-body"><b>The full showcase</b><span class="muted">Every colour, control, chart and signature move of ${E(L.name)} on one page.</span></div>`
     : `<div class="demo-coming"><span>${ic('play')}</span><b>Demo coming</b><span>The full showcase page for ${E(L.name)} is still being built. Everything else here is live from its look file.</span></div>`}</section>
  <section class="os-card card"><h2>Good for</h2><div class="row" style="margin-top:8px">${L.best.map(x => `<span class="tag">${ic('check')}${E(x)}</span>`).join('') || '<span class="muted">Not listed</span>'}</div>
   <p class="subh">Avoid for</p><div class="row">${L.avoid.map(x => `<span class="tag avoid">${E(x)}</span>`).join('') || '<span class="muted">Nothing listed</span>'}</div>
   ${L.prose.note ? `<p class="subh">Note</p><p style="font-size:14px;color:var(--text-2)">${E(L.prose.note)}</p>` : ''}</section>
  <section class="os-card card"><h2>Colours</h2><p class="lead">Each colour by its job, both themes, with how well text reads.</p><div class="swatches">${swRow(L.first)}${swRow(L.first === 'dark' ? 'light' : 'dark')}</div></section>
 </div>
 <div class="col">
  <section class="os-card card"><h2>Character</h2><p class="lead">Its star graph: ten attributes, 0 to 10. Tap a label to see where a number comes from.</p><div class="rbox"></div>
   <div class="legend"><span><i class="lm"></i>measured from the file</span><span><i class="lj"></i>judged by Claude</span></div><div class="alist"></div></section>
  <section class="os-card card"><h2>Fonts</h2>${['display', 'body', 'mono'].map(k => L.fonts[k] ? `<div class="fontrow"><span class="fs" style="font-family:'${E(L.fonts[k])}', var(--font)${k === 'display' ? ';font-weight:700' : ''}">${k === 'mono' ? '0123 4567 89' : 'Every trip, one library'}</span><span class="fl">${k} · ${E(L.fonts[k])}</span></div>` : '').join('')}</section>
  <section class="os-card card"><h2>Motion and forms</h2>
   <p class="subh">Motion signature</p>${prose(L.prose.motion, 'var(--h-pink)')}
   <p class="subh">Forms</p>${prose(L.prose.forms, 'var(--h-teal)')}
   <p class="subh">3D</p>${prose(L.prose.three, 'var(--h-violet)')}</section>
  <p class="src"><span>From <code>directions/${E(L.file)}</code></span><a href="${E(L.github)}" target="_blank" rel="noopener">${ic('ext')}Open on GitHub</a></p>
 </div>
</div>`;
    const r = new Radar(Q('.rbox', root), { size: 340, title: L.name + ' star graph' }); r.set([{ name: L.name, cls: 'a', attrs: L.attrs }]); radars = [r];
    Q('.alist', root).innerHTML = attrList(L);
    root.onclick = e => {
      const s = e.target.closest('[data-step]'); if (s) { const n = step(this.id, +s.dataset.step); vt(() => go({ look: n.id }, { replace: true, quiet: true }), +s.dataset.step > 0 ? 'next' : 'prev'); return; }
      if (e.target.closest('[data-use]')) useLook(L, e.target.closest('[data-use]'));
      if (e.target.closest('[data-try]')) go({ view: 'try', look: L.id });
      if (e.target.closest('[data-cmp]')) go({ view: 'compare', look: L.id, vs: '' });
      if (e.target.closest('[data-demo]') && demo) openDemo(L);
    };
    swipe(Q('[data-hero]', root), { onCommit: d => { const n = step(this.id, d); go({ look: n.id }, { replace: true }); } });
    fitThumb(); if (S.demo && demo) openDemo(L);
  },
  update(prev) { if (prev.look !== S.look || prev.theme !== S.theme) this.mount(this.root); },
  resize() { fitThumb(); }
};
function attrList(L) {
  return N.ATTRS.map(a => { const v = L.attrs[a.k]; return `<div class="arow${v ? '' : ' none'}"><span class="an"><i class="${a.kind === 'measured' ? 'm' : 'j'}"></i>${E(a.label)}</span><span class="bar"><span class="${a.kind === 'judged' ? 'j' : ''}" style="--v:${v ? v.v : 0}"></span></span><span class="av">${v ? v.v.toFixed(1) : '–'}</span><span class="ab">${v ? E(v.basis) : a.kind === 'judged' ? 'Not judged yet' : 'Not in the file'}</span></div>`; }).join('');
}
function fitThumb() { QA('.demo-thumb').forEach(t => { const f = Q('iframe', t); if (f) f.style.transform = `scale(${t.clientWidth / 1280})`; }); }
const demos = () => new Set((window.NAV_SNAPSHOT && window.NAV_SNAPSHOT.demos) || []);
const hasDemo = id => demos().has(id);
const demoURL = id => DEMO_BASE + id + '/demo.html';
function openDemo(L) {
  const d = Q('#demo'); d.hidden = false; D.body.style.overflow = 'hidden';
  d.innerHTML = `<div class="dbar"><button class="os-btn ghost" type="button" data-close>${ic('back')}<span>Back</span></button><b>${E(L.name)} · full demo</b><a class="ib" href="${E(demoURL(L.id))}" target="_blank" rel="noopener" aria-label="Open the demo in a new tab">${ic('ext')}</a></div><iframe title="${E(L.name)} full demo" src="${E(demoURL(L.id))}"></iframe>`;
  const f = Q('iframe', d); f.addEventListener('load', () => { try { f.contentDocument.documentElement.setAttribute('data-theme', S.theme); } catch (e) {} });
  if (!S.demo) { S.demo = true; writeURL(true); }
  const close = () => { d.hidden = true; d.innerHTML = ''; D.body.style.overflow = ''; if (S.demo) { S.demo = false; writeURL(false); } D.removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); };
  Q('[data-close]', d).onclick = close; D.addEventListener('keydown', esc); Q('[data-close]', d).focus();
}

/* TRY IT ON MY PAGE */
V.try = {
  mount(root) {
    this.root = root;
    root.innerHTML = `
<div class="try-head"><div><span class="os-label">Trying on</span><h1 class="try-name"><span class="tn"></span><span class="pos"></span></h1><p class="try-mood"></p></div>
 ${segHTML('page', Object.entries(P.PAGES).map(([k, v]) => [k, v.label]), S.page, 'Page to try it on')}</div>
<div class="stage-wrap"><button class="ib side-arrow p" type="button" data-step="-1" aria-label="Previous look">${ic('left')}</button><button class="ib side-arrow n" type="button" data-step="1" aria-label="Next look">${ic('right')}</button>
 <div class="stage" data-stage><span class="hold-badge">${ic('hand')}<span class="hb-t">Previous look</span></span><div class="lk" data-box></div></div></div>
<p class="try-hint">${ic('hand')}<span>Swipe sideways for the next look. Press and hold to see the one before.</span></p>
<div class="strip-bar os-glass"><div class="chips strip" role="group" aria-label="Looks">${data.looks.map(L => `<button type="button" class="chip lchip" data-l="${L.id}" style="--cbg:${pal(L).bg};--cac:${pal(L).accent};--hue:${pal(L).accent}" aria-pressed="false"><span class="sq"></span>${E(L.name)}</button>`).join('')}</div>
 <button class="os-btn primary" type="button" data-use>${ic('copy')}<span>Use this look</span></button></div>`;
    this.box = Q('[data-box]', root); this.stage = Q('[data-stage]', root);
    this.paint(true);
    root.onclick = e => {
      const c = e.target.closest('[data-l]'); if (c && c.dataset.l !== S.look) { const d = idx(c.dataset.l) > idx(S.look) ? 'next' : 'prev'; this.change(c.dataset.l, d); return; }
      const s = e.target.closest('[data-step]'); if (s) { this.change(step(S.look, +s.dataset.step).id, +s.dataset.step > 0 ? 'next' : 'prev'); return; }
      const sb = e.target.closest('[data-seg] button'); if (sb && sb.dataset.v !== S.page) { setSeg(sb.parentElement, sb.dataset.v); vt(() => { S.page = sb.dataset.v; writeURL(false); this.paint(); }); return; }
      if (e.target.closest('[data-use]')) useLook(cur(), e.target.closest('[data-use]'));
    };
    stageGestures(this.stage, {
      onSwipe: d => this.change(step(S.look, d).id, d > 0 ? 'next' : 'prev', true),
      onHoldStart: () => { const p = byId.get(prevLook) || step(S.look, -1); Q('.hb-t', this.stage).textContent = 'Holding: ' + p.name; P.apply(this.box, p, S.theme); },
      onHoldEnd: () => P.apply(this.box, cur(), S.theme)
    });
  },
  change(id, dir, swiped) {
    if (id === S.look) return;
    prevLook = S.look;
    const apply = () => { S.look = id; store.set('last', id); writeURL(false); this.paint(); };
    if (swiped) { apply(); slideIn(this.box, dir); } else vt(apply, dir);
  },
  paint(first) {
    const L = cur(), i = idx(L.id);
    P.mount(this.box, L, S.theme, S.page); P.settle(this.box);
    Q('.tn', this.root).textContent = L.name; Q('.pos', this.root).textContent = `${i + 1} / ${data.looks.length}`;
    Q('.try-mood', this.root).textContent = L.mood.charAt(0).toUpperCase() + L.mood.slice(1) + '.';
    QA('[data-l]', this.root).forEach(c => { const on = c.dataset.l === L.id; c.setAttribute('aria-pressed', String(on)); if (on) c.scrollIntoView({ block: 'nearest', inline: 'center', behavior: first || still() ? 'auto' : 'smooth' }); });
    QA('[data-l]', this.root).forEach(c => { const X = byId.get(c.dataset.l); c.style.setProperty('--cbg', pal(X).bg); c.style.setProperty('--cac', pal(X).accent); c.style.setProperty('--hue', pal(X).accent); });
  },
  update(prev) { if (prev.page !== S.page) setSeg(Q('[data-seg="page"]', this.root), S.page); this.paint(); },
  resize() { P.settle(this.box); }
};
function slideIn(el, dir) {
  if (still()) { el.style.transform = ''; return; }
  el.style.transition = 'none'; el.style.transform = `translateX(${dir === 'next' ? 34 : -34}%)`; el.style.opacity = '0';
  void el.offsetWidth; el.style.transition = 'transform 460ms var(--ease-out), opacity 320ms var(--ease)'; el.style.transform = ''; el.style.opacity = '';
  setTimeout(() => { el.style.transition = ''; }, 480);
}
/* One finger on the stage: sideways drags the page 1:1 and flips to the next look past a third of the width (or a quick flick);
   holding still for a moment shows the previous look until you let go; up and down still scrolls the page. */
function stageGestures(stage, h) {
  const box = () => stage.querySelector('[data-box]');
  let st = null;
  const end = () => { if (!st) return; clearTimeout(st.t); const s = st; st = null; stage.classList.remove('dragging');
    if (s.mode === 'hold') { stage.classList.remove('holding'); h.onHoldEnd && h.onHoldEnd(); return; }
    if (s.mode === 'swipe') {
      const W = stage.clientWidth, dx = s.dx, v = s.v; const go2 = Math.abs(dx) > W / 3 || Math.abs(v) > 0.55;
      const b = box();
      if (go2) { const d = dx < 0 ? 1 : -1; b.style.transition = 'transform 200ms var(--ease-in), opacity 200ms'; b.style.transform = `translateX(${dx < 0 ? -60 : 60}%)`; b.style.opacity = '0'; setTimeout(() => { b.style.transition = 'none'; h.onSwipe(d); }, still() ? 0 : 190); }
      else { b.style.transition = 'transform 420ms var(--spring)'; b.style.transform = ''; setTimeout(() => { b.style.transition = ''; }, 440); }
    } };
  stage.addEventListener('pointerdown', e => {
    if (e.button > 0 || e.target.closest('button, a, input, select, .lk-tabs')) return;
    st = { x: e.clientX, y: e.clientY, t0: performance.now(), mode: null, dx: 0, v: 0, lx: e.clientX, lt: performance.now(), id: e.pointerId };
    st.t = setTimeout(() => { if (st && !st.mode) { st.mode = 'hold'; stage.classList.add('holding'); h.onHoldStart && h.onHoldStart(); } }, 260);
  });
  stage.addEventListener('pointermove', e => {
    if (!st || e.pointerId !== st.id) return; const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (!st.mode) { if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2 && h.onSwipe) { st.mode = 'swipe'; clearTimeout(st.t); stage.classList.add('dragging'); try { stage.setPointerCapture(e.pointerId); } catch (x) {} } else if (Math.abs(dy) > 10) { clearTimeout(st.t); st = null; return; } }
    if (st.mode === 'swipe') { const now = performance.now(); st.v = (e.clientX - st.lx) / Math.max(1, now - st.lt); st.lx = e.clientX; st.lt = now; st.dx = dx; box().style.transform = `translateX(${dx}px)`; box().style.opacity = String(1 - Math.min(.5, Math.abs(dx) / stage.clientWidth)); }
  });
  ['pointerup', 'pointercancel'].forEach(n => stage.addEventListener(n, end));
  /* a finger's first element holds an implicit capture; taking it for the stage makes that element fire lostpointercapture, which bubbles here and must not end the swipe */
  stage.addEventListener('lostpointercapture', e => { if (e.target === stage) end(); });
  stage.addEventListener('pointerleave', e => { if (st && st.mode !== 'swipe') end(); });
  stage.addEventListener('contextmenu', e => { if (st || stage.classList.contains('holding')) e.preventDefault(); });
}
function swipe(el, h) { if (!el) return; let s = null;
  el.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; s = { x: e.clientX, y: e.clientY }; });
  el.addEventListener('pointerup', e => { if (!s) return; const dx = e.clientX - s.x, dy = e.clientY - s.y; s = null; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) vt(() => h.onCommit(dx < 0 ? 1 : -1), dx < 0 ? 'next' : 'prev'); });
}

/* COMPARE */
V.compare = {
  mount(root) {
    this.root = root; this.d = 50;
    root.innerHTML = `
<div class="cmp-head"><div class="pickers">${selHTML('a', S.look, 'Look A')}<button class="ib" type="button" data-swap aria-label="Swap the two looks">${ic('swap')}</button>${selHTML('b', S.vs, 'Look B')}</div>
 ${segHTML('page', Object.entries(P.PAGES).map(([k, v]) => [k, v.label]), S.page, 'Page to compare on')}</div>
<div class="cmp-main">
 <div><div class="cmp-stage" data-axis="x"><span class="hold-badge">${ic('hand')}<span>Flipped</span></span>
   <div class="cmp-scroll"><div class="cmp-stack"><div class="lk" data-b></div><div class="lk top" data-a></div></div></div>
   <div class="cmp-handle" role="slider" tabindex="0" aria-label="Divider between the two looks" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><span class="line"></span><span class="lbl a"><i></i><span class="la"></span></span><span class="grip">${ic('swap')}</span><span class="lbl b"><i></i><span class="lb"></span></span></div></div>
  <div class="cmp-tools"><button class="os-btn hold-btn" type="button" data-hold>${ic('hand')}<span>Press and hold to flip</span></button><button class="os-btn" type="button" data-use="a">${ic('copy')}<span class="ua"></span></button><button class="os-btn" type="button" data-use="b">${ic('copy')}<span class="ub"></span></button></div></div>
 <aside class="cmp-side"><section class="os-card card"><h2>Both star graphs</h2><p class="lead">Solid blue is A, dashed pink is B. Tap a label for both numbers.</p><div class="rbox"></div><div class="legend"><span><i class="la"></i><span class="na"></span></span><span><i class="lb"></i><span class="nb"></span></span></div><div class="diffs"></div></section></aside>
</div>`;
    this.stage = Q('.cmp-stage', root); this.scroll = Q('.cmp-scroll', root); this.A = Q('[data-a]', root); this.B = Q('[data-b]', root); this.h = Q('.cmp-handle', root);
    this.radar = new Radar(Q('.rbox', root), { size: 320, title: 'Both star graphs' }); radars = [this.radar];
    this.axis(); this.paint();
    root.addEventListener('change', e => { const s = e.target.closest('select[data-pick]'); if (!s) return; if (s.dataset.pick === 'a') { if (s.value === S.vs) S.vs = S.look; S.look = s.value; } else { if (s.value === S.look) S.look = S.vs; S.vs = s.value; } writeURL(false); this.paint(); });
    root.onclick = e => {
      if (e.target.closest('[data-swap]')) { [S.look, S.vs] = [S.vs, S.look]; writeURL(false); this.paint(); return; }
      const sb = e.target.closest('[data-seg] button'); if (sb && sb.dataset.v !== S.page) { setSeg(sb.parentElement, sb.dataset.v); S.page = sb.dataset.v; writeURL(false); this.paint(); return; }
      const u = e.target.closest('[data-use]'); if (u) useLook(byId.get(u.dataset.use === 'a' ? S.look : S.vs), u);
    };
    this.bindDivider(); this.bindHold();
    this.scroll.addEventListener('scroll', () => this.clip(), { passive: true });
  },
  axis() { const y = innerWidth < 760; this.stage.dataset.axis = y ? 'y' : 'x'; Q('.grip use', this.h).setAttribute('href', y ? '#i-swap' : '#i-swap'); Q('.grip', this.h).style.transform = y ? 'rotate(90deg)' : ''; this.clip(); },
  paint() {
    const A = byId.get(S.look), B = byId.get(S.vs); if (!A || !B) return;
    const flip = this.stage.classList.contains('holding');
    P.mount(this.A, flip ? B : A, S.theme, S.page); P.mount(this.B, flip ? A : B, S.theme, S.page); P.settle(this.root);
    QA('select[data-pick]', this.root).forEach(s => { s.innerHTML = lookOptions(s.dataset.pick === 'a' ? S.look : S.vs); s.previousElementSibling.previousElementSibling.style.background = pal(s.dataset.pick === 'a' ? A : B).accent; });
    Q('.la', this.root).textContent = A.name; Q('.lb', this.root).textContent = B.name; Q('.na', this.root).textContent = 'A · ' + A.name; Q('.nb', this.root).textContent = 'B · ' + B.name;
    Q('.ua', this.root).textContent = 'Use ' + A.name; Q('.ub', this.root).textContent = 'Use ' + B.name;
    this.radar.set([{ name: A.name, cls: 'a', attrs: A.attrs }, { name: B.name, cls: 'b', attrs: B.attrs }]);
    Q('.diffs', this.root).innerHTML = diffs(A, B);
    this.clip();
  },
  clip() {
    const d = this.d; this.stage.style.setProperty('--d', d + '%'); this.h.setAttribute('aria-valuenow', String(Math.round(d)));
    if (this.stage.dataset.axis === 'x') this.A.style.clipPath = `inset(0 ${100 - d}% 0 0)`;
    else { const H = this.stage.clientHeight, cut = this.scroll.scrollTop + H * d / 100; this.A.style.clipPath = `inset(0 0 calc(100% - ${cut}px) 0)`; }
  },
  bindDivider() {
    const h = this.h; let drag = false;
    const at = e => { const r = this.stage.getBoundingClientRect(); const x = this.stage.dataset.axis === 'x' ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height; this.d = Math.max(4, Math.min(96, x * 100)); this.clip(); };
    h.addEventListener('pointerdown', e => { drag = true; h.classList.add('drag'); h.setPointerCapture(e.pointerId); at(e); e.preventDefault(); });
    h.addEventListener('pointermove', e => { if (drag) at(e); });
    ['pointerup', 'pointercancel'].forEach(n => h.addEventListener(n, () => { drag = false; h.classList.remove('drag'); }));
    h.addEventListener('keydown', e => { const k = { ArrowLeft: -5, ArrowUp: -5, ArrowRight: 5, ArrowDown: 5, Home: -100, End: 100 }[e.key]; if (k == null) return; e.preventDefault(); this.d = Math.max(4, Math.min(96, this.d + k)); this.clip(); });
  },
  bindHold() {
    const on = () => { if (this.stage.classList.contains('holding')) return; this.stage.classList.add('holding'); Q('[data-hold]', this.root).classList.add('on'); this.paint(); };
    const off = () => { if (!this.stage.classList.contains('holding')) return; this.stage.classList.remove('holding'); Q('[data-hold]', this.root).classList.remove('on'); this.paint(); };
    const b = Q('[data-hold]', this.root);
    b.addEventListener('pointerdown', e => { e.preventDefault(); on(); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(n => b.addEventListener(n, off));
    b.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); on(); } }); b.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') off(); });
    b.addEventListener('contextmenu', e => e.preventDefault());
    let t = null, sx = 0, sy = 0;
    this.scroll.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; sx = e.clientX; sy = e.clientY; t = setTimeout(on, 280); });
    this.scroll.addEventListener('pointermove', e => { if (t && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) { clearTimeout(t); t = null; } });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => this.scroll.addEventListener(n, () => { clearTimeout(t); t = null; off(); }));
    this.scroll.addEventListener('contextmenu', e => { if (this.stage.classList.contains('holding')) e.preventDefault(); });
  },
  update(prev) { if (prev.page !== S.page) setSeg(Q('[data-seg="page"]', this.root), S.page); this.paint(); },
  resize() { this.axis(); P.settle(this.root); }
};
function diffs(A, B) {
  const rows = N.ATTRS.map(a => ({ a, x: A.attrs[a.k], y: B.attrs[a.k] })).filter(r => r.x && r.y).map(r => Object.assign(r, { d: r.y.v - r.x.v })).sort((p, q) => Math.abs(q.d) - Math.abs(p.d)).slice(0, 4);
  const more = { darkness: 'darker', contrast: 'higher contrast', colour: 'more colourful', warmth: 'warmer', roundness: 'rounder', density: 'denser', boldness: 'bolder', playfulness: 'more playful', formality: 'more formal', motion: 'moves more' };
  if (!rows.length) return '';
  return `<p class="subh">Biggest differences</p>` + rows.map(r => { const w = r.d > 0 ? B : A; return `<div class="diff"><span><b>${E(w.name)}</b> ${more[r.a.k]}</span><span class="badge ${r.a.kind === 'judged' ? 'warn' : 'good'}">${Math.abs(r.d).toFixed(1)}</span><span class="dw">${E(r.a.label)}: ${E(A.name)} ${r.x.v.toFixed(1)}, ${E(B.name)} ${r.y.v.toFixed(1)} · ${r.a.kind}</span></div>`; }).join('');
}

/* MAKE A NEW LOOK: blend two, or drop a pin */
V.make = {
  mount(root) {
    this.root = root;
    root.innerHTML = `
<div class="v-head"><div><h1>Make a new look</h1><p class="sub">Blend two looks, or drop a pin on an empty spot of the map. You get a ready-to-paste request for Claude with the new look file in it. Nothing is saved until Claude adds it.</p></div>
 ${segHTML('mode', [['blend', 'Blend two', 'blend'], ['pin', 'Drop a pin', 'pin']], S.mode, 'How to make it')}</div>
<div class="make-body"></div>`;
    this.body = Q('.make-body', root);
    root.addEventListener('click', e => { const sb = e.target.closest('[data-seg="mode"] button'); if (sb && sb.dataset.v !== S.mode) { setSeg(sb.parentElement, sb.dataset.v); vt(() => { S.mode = sb.dataset.v; S.name = ''; writeURL(false); this.draw(); }); } });
    this.draw();
  },
  draw() {
    const b = this.body; radars = [];
    const common = `<div class="preview"><div class="lk" data-box></div></div>`;
    const graph = `<section class="os-card card graph"><h2>Its star graph</h2><p class="lead">The new look (amber) over the looks it came from.</p><div class="rbox"></div><div class="legend"><span><i class="la" style="background:var(--h-amber);box-shadow:0 0 6px var(--h-amber)"></i>New look</span><span><i class="la"></i><span class="na"></span></span><span><i class="lb"></i><span class="nb"></span></span></div></section>`;
    const right = `<section class="os-card card out"><h2>Request for Claude</h2><p class="lead">Copy it and paste it to Claude. It holds the proposed look file in the shape of <code>directions/_template.md</code>.</p>
 <label class="field"><span>Name</span><input type="text" data-name maxlength="40" autocomplete="off" spellcheck="false"></label>
 <div class="row" style="margin-top:10px"><button class="os-btn primary" type="button" data-copyreq>${ic('copy')}<span>Copy request for Claude</span></button></div><pre data-req></pre></section>`;
    if (S.mode === 'blend') {
      b.innerHTML = `<div class="make-grid"><div class="col">
<section class="os-card card mix"><div class="pickers">${selHTML('a', S.look, 'First look')}<button class="ib" type="button" data-swap aria-label="Swap">${ic('swap')}</button>${selHTML('b', S.vs, 'Second look')}</div>
 <div class="mix-ends"><span class="ea"></span><span class="eb"></span></div>
 <div class="range"><span class="track"></span><span class="mid" title="Fonts and density swap here"></span><input type="range" min="0" max="100" step="1" value="${S.mix}" aria-label="Blend amount" data-mix></div>
 <div class="mix-read"><span><b class="pct"></b> toward <span class="tb"></span></span><span>Fonts from <b class="fnt"></b></span></div>
 <p class="subh">Blended colours (${S.theme})</p><div class="tokens"></div>
 <p class="subh">Can you read it?</p><div class="checks"></div></section>
 ${graph}</div><div class="col">${common}${right}</div></div>`;
      const A0 = byId.get(S.look), B0 = byId.get(S.vs);
      b.onchange = e => { const s = e.target.closest('select[data-pick]'); if (!s) return; if (s.dataset.pick === 'a') S.look = s.value; else S.vs = s.value; if (S.look === S.vs) S.vs = step(S.look, 1).id; S.name = ''; writeURL(false); this.draw(); };
      b.onclick = e => { if (e.target.closest('[data-swap]')) { [S.look, S.vs] = [S.vs, S.look]; S.mix = 100 - S.mix; S.name = ''; writeURL(false); this.draw(); } if (e.target.closest('[data-copyreq]')) this.copyReq(e.target.closest('[data-copyreq]')); };
      Q('[data-mix]', b).addEventListener('input', e => { S.mix = +e.target.value; this.blend(); });
      Q('[data-mix]', b).addEventListener('change', () => writeURL(false));
      void A0; void B0;
    } else {
      b.innerHTML = `<div class="make-grid"><div class="col">
<section class="os-card card mini-map"><h2>Where on the map</h2><p class="lead">Tap any spot. Calm to bold across, serious to playful down.</p><div class="map-card" style="border-radius:var(--r-l);overflow:hidden;border:1px solid var(--line)"><div class="map"><span class="axis x"></span><span class="axis y"></span><span class="q l">Calm</span><span class="q r">Bold</span><span class="q t">Serious</span><span class="q b">Playful</span>
 ${data.looks.map(L => `<span class="tile" data-id="${L.id}" style="${tileVars(L)}"><span class="tile-in"><span class="tile-n">${E(L.name)}</span></span></span>`).join('')}</div></div>
 <p class="subh">Made from the nearest looks</p><div class="near"></div></section>
 ${graph}</div><div class="col">${common}${right}</div></div>`;
      const map = Q('.map', b);
      if (S.px == null) { S.px = 5; S.py = 5; }
      placeTiles(map, data.looks, { mini: true });
      const [x, y] = map._toPx(S.px, S.py);
      map.insertAdjacentHTML('beforeend', `<span class="pin-ring" style="--x:${x}px;--y:${y}px"></span><span class="pin" style="--x:${x}px;--y:${y}px">${ic('pin')}</span>`);
      map.addEventListener('pointerup', e => { const r = map.getBoundingClientRect(); dropPin(map, e.clientX - r.left, e.clientY - r.top, { mini: true, onPin: (mx, my) => { S.px = Math.round(mx * 10) / 10; S.py = Math.round(my * 10) / 10; S.name = ''; writeURL(false); this.blend(); } }); });
      this.map = map;
      b.onclick = e => { if (e.target.closest('[data-copyreq]')) this.copyReq(e.target.closest('[data-copyreq]')); };
    }
    Q('[data-name]', b).addEventListener('input', e => { S.name = e.target.value; this.blend(true); });
    Q('[data-name]', b).addEventListener('change', () => writeURL(false));
    this.radar = new Radar(Q('.rbox', b), { size: 320, title: 'New look star graph' }); radars = [this.radar];
    this.box = Q('[data-box]', b);
    this.blend(false, true);
  },
  /* the proposed look for the current controls */
  proposal() {
    if (S.mode === 'blend') {
      const A = byId.get(S.look), B = byId.get(S.vs), t = S.mix / 100;
      return { A, B, t, L: N.blendLooks(A, B, t, S.name ? { name: S.name, id: slug(S.name) } : null) };
    }
    const n = nearest(S.px, S.py), A = n.a, B = n.b, t = n.t;
    const L = N.blendLooks(A, B, t, null);
    const calm = S.px < 4.6 ? 'calm' : S.px > 6.4 ? 'bold' : 'balanced', play = S.py < 3.6 ? 'serious' : S.py > 6 ? 'playful' : 'friendly';
    L.name = S.name || `${calm.charAt(0).toUpperCase() + calm.slice(1)} ${play} ${A.name.split(' ')[0]}`; L.id = slug(L.name);
    L.mood = `${calm}, ${play}, between ${A.name.toLowerCase()} and ${B.name.toLowerCase()}`;
    L.source = `look navigator: pin at calm-bold ${S.px.toFixed(1)}, serious-playful ${S.py.toFixed(1)}; blended from ${A.id} and ${B.id}`;
    const col = (L.attrs.colour || { v: 5 }).v, con = (L.attrs.contrast || { v: 5 }).v, mot = (L.attrs.motion || { v: 5 }).v, rnd = (L.attrs.roundness || { v: 5 }).v, frm = (L.attrs.formality || { v: 5 }).v;
    const bold = N.clamp((S.px - 0.2 * col - 0.2 * mot - 0.1 * con) / 0.5, 0, 10), playv = N.clamp((S.py - 0.25 * rnd - 0.25 * (10 - frm)) / 0.5, 0, 10);
    L.attrs.boldness = { v: Math.round(bold * 10) / 10, basis: 'from where the pin sits, across' }; L.attrs.playfulness = { v: Math.round(playv * 10) / 10, basis: 'from where the pin sits, down' };
    return { A, B, t, L };
  },
  blend(nameOnly, first) {
    const { A, B, t, L } = this.proposal(); this.cur = { A, B, t, L };
    const req = request(L, A, B, t);
    Q('[data-req]', this.body).textContent = req;
    const nm = Q('[data-name]', this.body); if (!nameOnly) { nm.value = S.name; nm.placeholder = L.name; }
    if (nameOnly) return;
    ensureFonts([L]);
    P.mount(this.box, L, S.theme, 'report', { still: !first });
    this.radar.set([{ name: A.name, cls: 'a', ghost: true, attrs: A.attrs }, { name: B.name, cls: 'b', ghost: true, attrs: B.attrs }, { name: L.name, cls: 'c', attrs: L.attrs }]);
    Q('.na', this.body).textContent = A.name; Q('.nb', this.body).textContent = B.name;
    if (S.mode === 'blend') {
      const p = L[S.theme], r = Q('.range', this.body);
      r.style.setProperty('--ga', pal(A).accent); r.style.setProperty('--gb', pal(B).accent); r.style.setProperty('--gm', N.mix(pal(A).accent, pal(B).accent, .5));
      Q('.ea', this.body).innerHTML = `<i class="dotc" style="width:10px;height:10px;border-radius:50%;background:${pal(A).accent}"></i>${E(A.name)}`;
      Q('.eb', this.body).innerHTML = `${E(B.name)}<i class="dotc" style="width:10px;height:10px;border-radius:50%;background:${pal(B).accent}"></i>`;
      Q('.pct', this.body).textContent = S.mix + '%'; Q('.tb', this.body).textContent = B.name; Q('.fnt', this.body).textContent = (t < .5 ? A : B).name;
      const JOB = { bg: 'Background', s1: 'Card', txt: 'Text', txt2: 'Muted', accent: 'Accent', ok: 'Good', part: 'Partly', miss: 'Missing' };
      Q('.tokens', this.body).innerHTML = Object.keys(JOB).map(k => `<span class="tok"><i style="background:${p[k]}"></i>${JOB[k]}</span>`).join('');
      Q('.checks', this.body).innerHTML = ['dark', 'light'].map(th => { const q = L[th]; return `<div class="check"><span>${th === 'dark' ? 'Dark' : 'Light'}</span><span class="row">${contrastBadge(q.txt, q.bg, 'Text')}${contrastBadge(q.txt2, q.bg, 'Muted')}${contrastBadge(q.accentTxt, q.bg, 'Accent')}${contrastBadge(q.onAccent, q.accent, 'Button', true)}</span></div>`; }).join('');
    } else {
      Q('.near', this.body).innerHTML = [[A, 1 - t], [B, t]].map(([X, w]) => `<div class="nr"><i style="background:${pal(X).accent}"></i><span>${E(X.name)}</span><span class="w">${Math.round(w * 100)}%</span><span class="wbar"><span style="--w:${Math.round(w * 100)}%"></span></span></div>`).join('')
        + `<div class="checks" style="margin-top:6px">${['dark', 'light'].map(th => { const q = L[th]; return `<div class="check"><span>${th === 'dark' ? 'Dark' : 'Light'}</span><span class="row">${contrastBadge(q.txt, q.bg, 'Text')}${contrastBadge(q.txt2, q.bg, 'Muted')}${contrastBadge(q.onAccent, q.accent, 'Button', true)}</span></div>`; }).join('')}</div>`;
    }
  },
  async copyReq(btn) { const txt = Q('[data-req]', this.body).textContent; await copy(txt); flash(btn, 'Copied'); toast('Copied the request. Paste it to Claude.'); },
  update(prev) { if (prev.mode !== S.mode || prev.theme !== S.theme || prev.look !== S.look || prev.vs !== S.vs) this.draw(); },
  resize() { if (S.mode === 'pin' && this.map) { placeTiles(this.map, data.looks, { mini: true }); const [x, y] = this.map._toPx(S.px, S.py); QA('.pin, .pin-ring', this.map).forEach(el => { el.style.setProperty('--x', x + 'px'); el.style.setProperty('--y', y + 'px'); }); } }
};
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'new-look';
function request(L, A, B, t) {
  const how = L.blend && S.mode === 'blend' ? `I blended ${A.name} and ${B.name} in the look navigator, ${Math.round(t * 100)}% of the way to ${B.name} (colours mixed in OKLCH, radius in between, fonts and density from ${(t < .5 ? A : B).name}).`
    : `I dropped a pin on the look navigator's mood map at calm-to-bold ${S.px.toFixed(1)}, serious-to-playful ${S.py.toFixed(1)}. The nearest looks are ${A.name} and ${B.name}, so this starts as a blend of the two.`;
  const warn = ['dark', 'light'].flatMap(th => { const q = L[th]; const o = []; const c1 = N.contrast(q.txt, q.bg), c2 = N.contrast(q.txt2, q.bg); if (c1 < 4.5) o.push(`${th} text is ${c1.toFixed(1)}:1`); if (c2 < 4.5) o.push(`${th} muted text is ${c2.toFixed(1)}:1`); const c3 = N.contrast(q.onAccent, q.accent); if (c3 < 4.5) o.push(`${th} button text on the accent is ${c3.toFixed(1)}:1`); return o; });
  return `Add a new look to design-flow: directions/${L.id}.md.

${how}${warn.length ? `\n\nContrast to fix before saving: ${warn.join('; ')} (needs 4.5:1 or more).` : ''}

Please check both themes read well (text and muted text at 4.5:1 or more on the background), tune any colour that looks muddy, keep it upright (no italic), write a motion signature, forms and 3D line that fit, then save it with the _template.md shape and open a PR in the skills repo.

Proposed file:

${N.lookFile(L, `made in the look navigator from ${A.name} and ${B.name}.`)}`;
}

/* HOW IT FITS TOGETHER */
V.system = {
  mount(root) {
    this.root = root;
    const recipes = (data.meta.recipes && data.meta.recipes.length ? data.meta.recipes : ['report', 'bakeoff', 'flow3d']);
    const INFO = {
      door: { t: 'Door: anshul-design', l: ['Says who the work is for: your personal profile.', 'Publishes to here.now, dark first, quick questions, never italic.', 'Reports follow your report rules: plain title, lead statement, highlighted bullets.', 'A second door, helix-design-anshul, does the same for AyaHelix work.'] },
      engine: { t: 'Engine: design-flow', l: ['Reads what it can, asks the rest at quick, medium or detailed level.', 'Offers an inspiration picker you can skip in one tap.', 'Builds one design, or opens the design room for two or more.', 'Checks it with Playwright, then publishes the way the door says.'] },
      looks: { t: `Looks: ${data.looks.length} in directions/`, l: ['How a page looks: colours for dark and light, fonts, corner radius, density.', 'Plus a motion signature, the forms it uses and any 3D.', '"best" and "avoid" decide which looks get offered for a page.', 'This navigator reads them live, so a new look file shows up here by itself.'], go: ['map', 'See them on the map'] },
      recipes: { t: `Recipes: ${recipes.length}`, l: recipes.map(r => ({ report: 'report: what a report is made of (title, lead statement, Your call, bullets, figures, Ask panel)', bakeoff: 'bakeoff: build several variants and pick elements across them', flow3d: 'flow3d: a 3D figure for things that move between places, with a flat fallback' }[r] || r + ': a page kind\'s skeleton')) },
      mech: { t: 'UI standards: anshul-ui-standards-v2', l: ['How every page behaves, whatever the look.', '44 px touch targets, visible focus, press feedback, state layers.', 'Dark and light toggle, springs, reduced motion respected.', 'Screenshots in both themes before anything is shown to you.'] },
      room: { t: 'Design room', l: ['Compares two or more built designs.', 'Device frames, grid, pair and duel views, blind mode.', 'Votes, pins and notes per element, and New design requests.'] },
      nav: { t: 'This navigator', l: ['Map, star graphs, try-on, compare and make: all from the look files.', 'Reads them from GitHub at load, falls back to a saved copy.', 'New looks leave as a request for Claude; it never writes files.'], go: ['map', 'Back to the map'] }
    };
    this.INFO = INFO;
    root.innerHTML = `
<div class="v-head"><div><h1>How it fits together</h1><p class="sub">One door, one engine, three kinds of parts. A finished page is a look, a recipe and the UI standards together. Tap any box.</p></div></div>
<section class="os-card card"><div class="sys">
 <svg class="wires" aria-hidden="true"></svg>
 <div class="tier"><button class="node" type="button" data-n="door" style="--hue:var(--h-amber)"><span class="nk">Door</span><b>anshul-design</b><span class="nd">Who it's for: your profile and house rules</span></button></div>
 <div class="tier"><button class="node" type="button" data-n="engine" style="--hue:var(--h-blue)"><span class="nk">Engine</span><b>design-flow</b><span class="nd">Infer, ask, inspire, build, verify, publish</span></button></div>
 <div class="tier three">
  <button class="node" type="button" data-n="looks" style="--hue:var(--h-pink)"><span class="nk">Looks</span><span class="cnt">${data.looks.length}</span><b>The skin</b><span class="nd">Colours, fonts, shape, motion</span></button>
  <button class="node" type="button" data-n="recipes" style="--hue:var(--h-teal)"><span class="nk">Recipes</span><span class="cnt">${recipes.length}</span><b>The skeleton</b><span class="nd">What a page kind is made of</span></button>
  <button class="node" type="button" data-n="mech" style="--hue:var(--h-violet)"><span class="nk">Standards</span><b>The feel</b><span class="nd">How everything behaves</span></button>
 </div>
 <div class="eq">Finished page <span>=</span> look <span>×</span> recipe <span>×</span> standards</div>
 <div class="tier"><button class="node ghost" type="button" data-n="room" style="--hue:var(--h-lime)"><span class="nk">Compare built designs</span><b>Design room</b></button><button class="node ghost" type="button" data-n="nav" style="--hue:var(--h-cyan)"><span class="nk">Browse the looks</span><b>This navigator</b></button></div>
</div>
<div class="node-info" hidden></div></section>`;
    root.onclick = e => {
      const n = e.target.closest('[data-n]'); if (!n) return; const k = n.dataset.n, inf = INFO[k], box = Q('.node-info', root);
      const open = n.getAttribute('aria-expanded') !== 'true';
      QA('[data-n]', root).forEach(x => x.setAttribute('aria-expanded', 'false'));
      if (!open) { box.hidden = true; return; }
      n.setAttribute('aria-expanded', 'true');
      box.innerHTML = `<h2>${E(inf.t)}</h2><ul>${inf.l.map(x => `<li>${E(x)}</li>`).join('')}</ul>${inf.go ? `<div class="row"><button class="os-btn primary" type="button" data-go="${inf.go[0]}">${ic('map')}<span>${E(inf.go[1])}</span></button></div>` : ''}`;
      box.hidden = false; box.classList.remove('view-in'); void box.offsetWidth; box.classList.add('view-in');
    };
    requestAnimationFrame(() => this.wires());
  },
  wires() {
    const sys = Q('.sys', this.root), svg = Q('svg.wires', sys); if (!sys) return; const b = sys.getBoundingClientRect();
    const box = k => { const r = Q(`[data-n="${k}"]`, sys).getBoundingClientRect(); return { cx: r.left - b.left + r.width / 2, top: r.top - b.top, bot: r.bottom - b.top }; };
    const eq = Q('.eq', sys).getBoundingClientRect(), eqTop = eq.top - b.top, eqBot = eq.bottom - b.top, eqC = eq.left - b.left + eq.width / 2;
    const d = box('door'), en = box('engine'), lo = box('looks'), re = box('recipes'), me = box('mech'), ro = box('room'), na = box('nav');
    const c = (x1, y1, x2, y2) => { const m = (y1 + y2) / 2; return `M${x1},${y1} C${x1},${m} ${x2},${m} ${x2},${y2}`; };
    const paths = [c(d.cx, d.bot, en.cx, en.top), c(en.cx, en.bot, lo.cx, lo.top), c(en.cx, en.bot, re.cx, re.top), c(en.cx, en.bot, me.cx, me.top), c(lo.cx, lo.bot, eqC, eqTop), c(re.cx, re.bot, eqC, eqTop), c(me.cx, me.bot, eqC, eqTop), c(eqC, eqBot, ro.cx, ro.top), c(eqC, eqBot, na.cx, na.top)];
    svg.setAttribute('viewBox', `0 0 ${b.width} ${b.height}`);
    svg.innerHTML = paths.map((p, i) => `<path d="${p}" style="--i:${i}"/>`).join('') + `<path class="flow" d="${paths[0]}"/><path class="flow" d="${paths[1]}"/>`;
    QA('path:not(.flow)', svg).forEach(p => p.style.setProperty('--len', Math.ceil(p.getTotalLength())));
  },
  update() {}, resize() { this.wires(); }
};

/* ───────── routing ───────── */
function go(patch, o) {
  o = o || {};
  const prev = Object.assign({}, S);
  Object.assign(S, patch); settle();
  writeURL(!o.replace && (prev.view !== S.view || prev.look !== S.look));
  const run = () => render(prev);
  if (o.quiet) return run();
  if (prev.view !== S.view) { if (o.morph) vt(run); else vt(run); } else run();
}
window.__navGo = go;
function render(prev) {
  const root = Q('#view');
  D.body.dataset.view = S.view;
  QA('[data-go]').forEach(b => { const on = b.dataset.go === S.view || (b.dataset.go === 'map' && S.view === 'look'); if (b.classList.contains('nav-b') || b.classList.contains('tab')) { if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); } });
  seatNav();
  if (!data.looks.length) { root.innerHTML = `<div class="os-card card" style="margin-top:20px"><h2>No looks loaded</h2><p class="lead">The look files could not be read from GitHub and there is no saved copy in this browser. Check the connection and reload.</p></div>`; return; }
  if (!prev || prev.view !== S.view || !mounted || prev.dataVer !== dataVer) {
    root.classList.remove('view-in'); mounted = V[S.view]; mounted.mount(root);
    seatSegs(root); requestAnimationFrame(() => { seatSegs(root); });
    if (!prev || prev.view !== S.view) { root.classList.add('view-in'); QA(':scope > *', root).forEach((el, i) => el.style.setProperty('--i', Math.min(i, 6))); scrollTo({ top: 0 }); }
  } else mounted.update(prev);
  S.dataVer = dataVer;
  D.title = S.view === 'look' ? cur().name + ' · Look Navigator' : 'Look Navigator';
  R.dataset.theme = S.theme;
}
function seatNav() { const nav = Q('.nav'), on = Q('.nav-b[aria-current="page"]', nav), pill = Q('.nav-pill', nav); if (!on) { pill.style.width = '0'; return; } pill.style.width = on.offsetWidth + 'px'; pill.style.transform = `translateX(${on.offsetLeft}px)`; }

/* theme: an iris opens from the button that was pressed */
function setTheme(t, from) {
  if (t === S.theme) return;
  const r = from ? from.getBoundingClientRect() : Q('#themeBtn').getBoundingClientRect();
  R.style.setProperty('--ix', (r.left + r.width / 2) + 'px'); R.style.setProperty('--iy', (r.top + r.height / 2) + 'px');
  const apply = () => { S.theme = t; R.dataset.theme = t; store.set('theme', t); writeURL(false); Q('#themeBtn').setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); QA('[data-seg="theme"]').forEach(s => setSeg(s, t)); if (mounted) mounted.update(Object.assign({}, S, { theme: t === 'dark' ? 'light' : 'dark' })); Q('meta[name="theme-color"]').content = t === 'dark' ? '#08090C' : '#F7F8FA'; };
  if (D.startViewTransition && !still()) { R.dataset.vt = 'iris'; vt(apply); } else apply();
}
window.__navTheme = setTheme;

/* sync pill: where the looks came from */
function ago(iso) { if (!iso) return ''; const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000); return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' d ago'; }
function syncUI() {
  const m = data.meta || {}, b = Q('#sync'); b.dataset.s = m.source || 'snapshot';
  Q('.st', b).textContent = m.source === 'live' ? 'Live' : m.source === 'saved' ? 'Saved copy' : 'Built-in copy';
  const p = Q('#syncPop');
  p.innerHTML = `<h3>${m.source === 'live' ? 'Live from GitHub' : m.source === 'saved' ? 'Saved copy in this browser' : 'Built-in copy'}</h3>
<p class="muted" style="font-size:13px">${m.source === 'live' ? `Read ${ago(m.at)} from shootdaj/skills (master) via ${E(m.via || 'GitHub')}. A pushed look file shows up here within about five minutes.` : m.source === 'saved' ? `From ${ago(m.at)}. ${m.offline ? 'GitHub could not be reached just now (' + E(m.offline) + ').' : 'Checking GitHub for changes.'}` : `Made with the navigator on ${E((m.at || '').slice(0, 10))}. ${location.protocol === 'file:' ? 'Opened as a file, so it does not read GitHub.' : (m.offline ? 'GitHub could not be reached (' + E(m.offline) + ').' : 'Checking GitHub.')}`}</p>
<ul><li>${data.looks.length} looks</li><li>${data.looks.filter(l => l.judged).length} with judged scores${data.looks.some(l => !l.judged) ? ', ' + data.looks.filter(l => !l.judged).map(l => E(l.name)).join(', ') + ' measured only' : ''}</li><li>${demos().size} demo pages in this copy</li>${(data.errors || []).map(x => `<li style="color:var(--miss)">Could not read ${E(x)}</li>`).join('')}</ul>
<div class="row"><button class="os-btn" type="button" data-refresh>${ic('refresh')}<span>Check again</span></button></div>`;
  Q('[data-refresh]', p).onclick = () => { p.hidden = true; boot(true); };
}
Q('#sync').addEventListener('click', e => { const p = Q('#syncPop'); p.hidden = !p.hidden; e.stopPropagation(); });
D.addEventListener('click', e => { const p = Q('#syncPop'); if (!p.hidden && !e.target.closest('#syncPop')) p.hidden = true; });

/* ───────── global wiring ───────── */
/* the browser takes no input while a view transition plays; a touch ends it at once so a quick swipe or tap is never lost */
addEventListener('pointerdown', () => { if (vt.cur) { try { vt.cur.skipTransition(); } catch (e) {} } }, true);
D.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (!g) return; e.preventDefault();
  const v = g.dataset.go; if (v === S.view && v !== 'map') return;
  go({ view: v, demo: false });
});
Q('#themeBtn').addEventListener('click', e => setTheme(S.theme === 'dark' ? 'light' : 'dark', e.currentTarget));
addEventListener('popstate', () => { const prev = Object.assign({}, S); readURL(); settle(); render(prev); if (!S.demo && !Q('#demo').hidden) { Q('#demo').hidden = true; Q('#demo').innerHTML = ''; D.body.style.overflow = ''; } });
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { seatNav(); seatSegs(D); if (mounted && mounted.resize) mounted.resize(); }, 120); });
addEventListener('keydown', e => {
  if (e.target.closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
  if ((S.view === 'try' || S.view === 'look') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !e.target.closest('.cmp-handle, .seg, .chips, .lk-tabs')) {
    const d = e.key === 'ArrowRight' ? 1 : -1; if (S.view === 'try') V.try.change(step(S.look, d).id, d > 0 ? 'next' : 'prev'); else vt(() => go({ look: step(S.look, d).id }, { replace: true, quiet: true }), d > 0 ? 'next' : 'prev');
  }
});

let dataVer = 0, sig = '';
function onData(d) {
  const s = d.looks.map(l => l.id + ':' + l.hash + ':' + JSON.stringify(l.attrs)).join('|');
  data = d; byId = new Map(d.looks.map(l => [l.id, l])); ensureFonts(d.looks);
  if (s !== sig) { sig = s; dataVer++; settle(); writeURL(false); const prev = Object.assign({}, S, { dataVer: -1 }); render(prev); }
  syncUI();
}
function boot(force) { N.load(onData); }
readURL();
R.dataset.theme = S.theme; Q('#themeBtn').setAttribute('aria-label', S.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
boot();
window.NavApp = { S, get data() { return data; }, go, cur, resolve };
})();
