/* flow3d.js · 3D flow figures for design-flow pages. Recipe: recipes/flow3d/RECIPE.md.
   One include, one config:  Flow3D.mount('#fig', { places, paths, zones, tour, ... })
   Video (HyperFrames):     Flow3D.video('#stage', config).then(v => addEventListener('hf-seek', e => v.renderAt(e.detail.time)))
   It injects its own CSS, lazy-loads Three.js r134 from cdnjs when the figure nears the screen, pauses when off screen,
   reads the page's CSS colour tokens (dark defaults when a page has none) and redraws on theme change. It shows a flat
   SVG of the same config when WebGL is missing, the figure is narrower than minWidth (phones) or Three.js fails to load.
   Reduced motion: no auto-turn, no drifting particles, camera cuts instead of glides, no autoplay. */
(function () {
  'use strict';
  if (window.Flow3D) return;
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
  const root = document.documentElement;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEF = { '--bg': '#0B0D12', '--s1': '#12151C', '--s2': '#181C25', '--s3': '#20252F', '--txt': '#ECEEF2', '--txt2': '#A7ADB9',
    '--txt3': '#858C99', '--red': '#4C7DFF', '--ok': '#3DDC97', '--c1': '#5DD3FF', '--c2': '#9BE15D', '--c3': '#A597FF', '--c4': '#FFD93D', '--c5': '#FF6B6B' };
  const tok = n => getComputedStyle(root).getPropertyValue(n).trim() || DEF[n] || '#888888';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const hueVar = h => !h ? 'var(--f3-txt2)' : h.startsWith('--') ? `var(${h})` : h;
  const rand = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /* any CSS colour (token name, hex, rgb, oklch, color-mix) to [r,g,b] in 0..1, read back from a canvas pixel */
  const px = el('canvas').getContext('2d', { willReadFrequently: true }), memo = new Map();
  function rgb(c) {
    const v = c.startsWith('--') ? tok(c) : c;
    if (!memo.has(v)) { px.clearRect(0, 0, 1, 1); px.fillStyle = '#888'; px.fillStyle = v; px.fillRect(0, 0, 1, 1);
      const d = px.getImageData(0, 0, 1, 1).data; memo.set(v, [d[0] / 255, d[1] / 255, d[2] / 255]); }
    return memo.get(v);
  }
  const isLight = () => { const [r, g, b] = rgb('--bg'); return .2126 * r + .7152 * g + .0722 * b > .5; };

  let gl = null, threeP = null;
  function webgl() {
    if (gl === null) { try { const c = el('canvas'), x = c.getContext('webgl2') || c.getContext('webgl'); gl = !!x;
      const lose = x && x.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); } catch (e) { gl = false; } }
    return gl;
  }
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    return threeP || (threeP = new Promise((res, rej) => {
      const s = el('script'); s.src = THREE_URL; s.crossOrigin = 'anonymous';
      s.onload = () => window.THREE ? res(window.THREE) : rej(new Error('three missing'));
      s.onerror = () => rej(new Error('three failed to load')); document.head.appendChild(s);
      setTimeout(() => rej(new Error('three timeout')), 15000);
    }));
  }

  /* ───────── config prep: geo to scene units, defaults, lookups ───────── */
  function geo(lat, lon, map) {
    const [la0, lo0] = map.center, k = map.scale || 1.6;
    return [(lon - lo0) * Math.cos(la0 * Math.PI / 180) * k, 0, -(lat - la0) * k];
  }
  function prep(cfg) {
    if (cfg._prepped) return cfg; cfg._prepped = true;
    cfg.places = cfg.places || []; cfg.paths = cfg.paths || []; cfg.zones = cfg.zones || []; cfg.marks = cfg.marks || [];
    const at = p => p.geo && cfg.map ? geo(p.geo[0], p.geo[1], cfg.map) : (p.at || [0, 0, 0]);
    cfg.places.forEach(p => { p.at = at(p); p.hue = p.hue || '--c1'; });
    cfg.marks.forEach(m => { m.at = at(m); });
    cfg.byId = Object.fromEntries(cfg.places.map(p => [p.id, p]));
    cfg.paths.forEach(p => { p.via = (p.via || []).map(v => v.length === 2 && cfg.map ? geo(v[0], v[1], cfg.map) : v);
      p.a = cfg.byId[p.from] ? cfg.byId[p.from].at : p.from; p.b = cfg.byId[p.to] ? cfg.byId[p.to].at : p.to;
      p.hue = p.hue || (cfg.byId[p.to] || {}).hue || '--c1'; });
    if (cfg.map && cfg.map.grid) { /* graticule labels and bounds, in degrees */
      const ll = cfg.places.filter(p => p.geo).map(p => p.geo), st = cfg.map.grid, pad = st * .6;
      const la = ll.map(g => g[0]), lo = ll.map(g => g[1]);
      cfg.map._b = [Math.min(...la) - pad, Math.max(...la) + pad, Math.min(...lo) - pad, Math.max(...lo) + pad];
    }
    return cfg;
  }
  const label = p => [p.label, p.sub].filter(Boolean).join(' · ');

  /* ───────── the stage: renderer, orbit camera, labels, picking, visibility-driven loop ───────── */
  function Stage(host, cfg, opt) {
    const T = window.THREE, S = this;
    Object.assign(S, { T, host, cfg, ext: opt.clock === 'external', light: isLight(), labels: [], picks: [], ups: [], places: {},
      time: 0, vis: false, raf: 0, dead: false, last: 0, prev: 0, tourT0: 0, amb: [], heroes: [] });
    const w = opt.width || host.clientWidth || 800, h = opt.height || host.clientHeight || 480;
    const r = S.r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: S.ext });
    r.setPixelRatio(opt.pixelRatio || Math.min(window.devicePixelRatio || 1, 2)); r.setSize(w, h, false); r.setClearColor(0, 0);
    r.domElement.setAttribute('aria-hidden', 'true'); if (S.ext) r.domElement.setAttribute('data-layout-allow-overflow', ''); /* full-bleed in video */
    host.insertBefore(r.domElement, host.firstChild);
    S.layer = host.querySelector('.f3d-layer'); S.tip = host.querySelector('.f3d-tip');
    S.scene = new T.Scene(); S.cam = new T.PerspectiveCamera(cfg.fov || 36, w / h, .1, 600);
    S.home = Object.assign({ az: .5, el: .5, dist: 22, tx: 0, ty: 0, tz: 0 }, cfg.camera);
    S.orb = Object.assign({}, S.home, opt.orb || {});
    const fog = cfg.fog || [S.home.dist * 1.5, S.home.dist * 3.6];
    S.scene.fog = new T.Fog(S.color('--bg'), fog[0], fog[1]);
    S.scene.add(new T.HemisphereLight(0xffffff, S.color('--bg'), S.light ? .95 : .6));
    const d = new T.DirectionalLight(0xffffff, S.light ? .65 : .9); d.position.set(8, 14, 10); S.scene.add(d);
    S.scene.add(new T.AmbientLight(0xffffff, S.light ? .35 : .16));
    S.auto = !S.ext && !REDUCED && cfg.autoTurn !== false;
    if (!S.ext) S.bind();
    S.applyCam();
  }
  const P = Stage.prototype;
  P.color = function (h) { const [r, g, b] = rgb(h); return new this.T.Color(r, g, b); };
  P.mat = function (hue, ei) { return new this.T.MeshStandardMaterial({ color: this.color('--s3').lerp(this.color(hue), .35), roughness: .5,
    metalness: .18, emissive: this.color(hue), emissiveIntensity: ei == null ? .18 : ei }); };
  P.glow = function (hue, op) { return new this.T.MeshBasicMaterial({ color: this.color(hue), transparent: true, opacity: op == null ? .9 : op }); };
  P.bind = function () {
    const S = this, c = S.r.domElement; let down = null;
    c.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, az: S.orb.az, el: S.orb.el, moved: false };
      try { c.setPointerCapture(e.pointerId); } catch (_) {} S.last = performance.now(); S.kick(); });
    c.addEventListener('pointermove', e => {
      if (!down) { S.hover(e); return; }
      const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.abs(dx) + Math.abs(dy) > 4) down.moved = true;
      if (down.moved && S.tourT0) S.endTour(false);
      S.orb.az = down.az - dx * .0065; S.orb.el = clamp(down.el + dy * .0045, .06, 1.35); S.last = performance.now(); S.kick();
    });
    c.addEventListener('pointerup', e => { if (down && !down.moved) S.click(e); down = null; S.last = performance.now(); });
    c.addEventListener('pointercancel', () => { down = null; });
    c.addEventListener('pointerleave', () => S.hover(null));
    S.io = new IntersectionObserver(es => { S.vis = es.some(x => x.isIntersecting); if (S.vis) S.kick(); }, { threshold: .02 });
    S.io.observe(S.host); S.ro = new ResizeObserver(() => S.resize()); S.ro.observe(S.host);
  };
  P.resize = function () { const w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return;
    this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); this.kick(); };
  P.applyCam = function () { const o = this.orb, c = this.cam, ce = Math.cos(o.el);
    c.position.set(o.tx + o.dist * ce * Math.sin(o.az), o.ty + o.dist * Math.sin(o.el), o.tz + o.dist * ce * Math.cos(o.az)); c.lookAt(o.tx, o.ty, o.tz); };
  P.kick = function () { if (this.dead || this.raf || !this.vis || this.ext) return; this.prev = performance.now(); this.raf = requestAnimationFrame(t => this.loop(t)); };
  P.loop = function (now) {
    this.raf = 0; if (this.dead) return;
    const dt = Math.min(64, now - this.prev); this.prev = now; if (!REDUCED) this.time += dt;
    if (this.tourT0) { const t = (now - this.tourT0) / 1000; this.applyTour(t); if (t >= this.tour.dur) this.endTour(true); }
    else if (this.auto && now - this.last > 2600) this.orb.az += dt * .000045;
    this.frame(dt);
    if (this.vis && !document.hidden) this.kick();
  };
  P.frame = function (dt) { this.ups.forEach(f => f(dt, this.time)); this.applyCam(); this.r.render(this.scene, this.cam); this.placeLabels(); };
  /* frame-deterministic render for video: everything is a function of t (seconds), never of wall-clock */
  P.renderAt = function (t) {
    t = Math.max(0, +t || 0); this.time = t * 1000;
    if (this.tour) this.applyTour(t); else this.orb.az = this.home.az + t * (this.cfg.videoTurn == null ? .05 : this.cfg.videoTurn);
    this.frame(1e9);
  };
  P.label = function (text, sub, pos, o) {
    o = o || {}; const e = el('div', 'f3d-l ' + (o.cls || '')); e.textContent = text;
    if (sub) { const s = el('small'); s.textContent = sub; e.appendChild(s); }
    if (o.hue) e.style.setProperty('--lc', hueVar(o.hue)); this.layer.appendChild(e);
    const L = { e, pos: new this.T.Vector3(pos[0], pos[1], pos[2]), dy: o.dy == null ? -100 : o.dy, show: true }; this.labels.push(L); return L;
  };
  P.placeLabels = function () {
    const w = this.host.clientWidth, h = this.host.clientHeight, v = this._v || (this._v = new this.T.Vector3());
    const vis = [];
    this.labels.forEach(L => {
      if (!L.show) { L.e.classList.add('hide'); return; }
      v.copy(L.pos).project(this.cam); const off = v.z > 1 || Math.abs(v.x) > 1.15 || Math.abs(v.y) > 1.15;
      if (off) { L.e.classList.add('hide'); return; }
      L.x = (v.x * .5 + .5) * w; L.y = (-v.y * .5 + .5) * h; L.z = v.z; vis.push(L);
      L.e.style.transform = `translate(${L.x.toFixed(1)}px,${L.y.toFixed(1)}px) translate(-50%,${L.dy}%)`;
    });
    /* declutter: active labels first, then nearer ones; a label that would overlap one already shown fades out */
    const rank = L => (L.e.classList.contains('on') ? 0 : L.e.classList.contains('zone') ? 2 : 1), kept = [];
    vis.sort((a, b) => rank(a) - rank(b) || a.z - b.z).forEach(L => {
      if (!L.w) { L.w = L.e.offsetWidth; L.h = L.e.offsetHeight; }
      const x0 = L.x - L.w / 2, y0 = L.y + L.h * L.dy / 100, r = [x0, y0, x0 + L.w, y0 + L.h];
      const hit = this.cfg.declutter !== false && kept.some(k => r[0] < k[2] + 4 && r[2] > k[0] - 4 && r[1] < k[3] + 2 && r[3] > k[1] - 2);
      L.e.classList.toggle('hide', hit); if (!hit) kept.push(r);
    });
  };
  P.ray = function (e) { const b = this.r.domElement.getBoundingClientRect(), T = this.T, rc = this._rc || (this._rc = new T.Raycaster());
    rc.setFromCamera(new T.Vector2((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1), this.cam); return rc; };
  P.pickAt = function (e) {
    if (!this.picks.length) return null; const hits = this.ray(e).intersectObjects(this.picks.map(p => p.obj), true); if (!hits.length) return null;
    for (let o = hits[0].object; o; o = o.parent) { const p = this.picks.find(x => x.obj === o); if (p) return p.id; } return null;
  };
  P.click = function (e) { const id = this.pickAt(e); if (id && this.onPick) this.onPick(id); };
  P.hover = function (e) {
    const S = this, c = S.r.domElement; let id = null, tip = null;
    if (e) { id = S.pickAt(e);
      if (!id && S.cloudPts) { const rc = S.ray(e); rc.params.Points = { threshold: S.cfg.cloud.pick || .3 };
        const hit = rc.intersectObject(S.cloudPts)[0]; if (hit && S.cfg.cloud.points[hit.index]) tip = S.cfg.cloud.points[hit.index]; } }
    Object.entries(S.places).forEach(([k, p]) => { p.hot = k === id; });
    c.style.cursor = id || tip ? 'pointer' : '';
    if (S.tip) { S.tip.hidden = !tip; if (tip) { const b = S.host.getBoundingClientRect(); S.tip.textContent = tip.label || '';
      S.tip.style.transform = `translate(${e.clientX - b.left + 12}px,${e.clientY - b.top + 12}px)`; } }
    S.kick();
  };
  P.dispose = function () {
    this.dead = true; cancelAnimationFrame(this.raf); if (this.io) this.io.disconnect(); if (this.ro) this.ro.disconnect();
    this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
    this.r.dispose(); this.r.domElement.remove(); this.labels.forEach(L => L.e.remove());
  };

  /* ───────── builders ───────── */
  const SHAPES = { /* each returns [object, label height]; hue drives every colour */
    box(S, h) { const T = S.T, g = new T.Group(), b = new T.Mesh(new T.BoxGeometry(1.4, 1.2, 1.1), S.mat(h, .12)); b.position.y = .1; g.add(b);
      for (let i = 0; i < 3; i++) { const s = new T.Mesh(new T.BoxGeometry(1, .07, .02), S.glow(h, .95)); s.position.set(0, -.25 + i * .3, .56); g.add(s); } return [g, 1.35]; },
    discs(S, h) { const T = S.T, g = new T.Group(); for (let i = 0; i < 3; i++) { const c = new T.Mesh(new T.CylinderGeometry(.8, .8, .24, 40), S.mat(h, .3));
      c.position.y = -.42 + i * .34; const r = new T.Mesh(new T.TorusGeometry(.81, .018, 6, 48), S.glow(h)); r.rotation.x = Math.PI / 2; r.position.y = c.position.y + .12; g.add(c, r); } return [g, 1.2]; },
    gem(S, h) { const T = S.T, g = new T.Group(), geo = new T.IcosahedronGeometry(.8, 0), s = new T.Group();
      const e = new T.LineSegments(new T.EdgesGeometry(geo), new T.LineBasicMaterial({ color: S.color(h) })); e.scale.setScalar(1.02);
      s.add(new T.Mesh(geo, Object.assign(S.mat(h, .45), { flatShading: true })), e); s.position.y = .5; g.add(s); g.userData.spin = s; return [g, 1.7]; },
    slab(S, h) { const T = S.T, g = new T.Group(), b = new T.Mesh(new T.BoxGeometry(1.2, .1, 1.5), S.mat(h, .35)); b.position.y = -.45;
      const s = new T.Mesh(new T.BoxGeometry(.85, .02, .5), S.glow(h, .8)); s.position.set(0, -.39, -.35); g.add(b, s); return [g, .4]; },
    pillar(S, h) { const T = S.T, g = new T.Group(), b = new T.Mesh(new T.BoxGeometry(.9, 2.2, .9), S.mat(h, .2)); b.position.y = .55;
      const t = new T.Mesh(new T.BoxGeometry(.92, .06, .92), S.glow(h)); t.position.y = 1.66; g.add(b, t); return [g, 2.1]; },
    orb(S, h) { const T = S.T, g = new T.Group(), s = new T.Mesh(new T.SphereGeometry(.55, 32, 20), S.mat(h, .5)); s.position.y = .1;
      const r = new T.Mesh(new T.RingGeometry(.75, .82, 48), S.glow(h, .7)); r.rotation.x = -Math.PI / 2; r.position.y = -.55; g.add(s, r); return [g, 1]; },
    pin(S, h) { const T = S.T, g = new T.Group(), c = new T.Mesh(new T.ConeGeometry(.28, .9, 20), S.mat(h, .4)); c.rotation.x = Math.PI; c.position.y = -.15;
      const b = new T.Mesh(new T.SphereGeometry(.32, 24, 16), S.mat(h, .55)); b.position.y = .4;
      const r = new T.Mesh(new T.RingGeometry(.35, .45, 40), S.glow(h, .8)); r.rotation.x = -Math.PI / 2; r.position.y = -.6; g.add(c, b, r); return [g, 1.05]; }
  };
  P.ground = function () {
    const S = this, T = S.T, cfg = S.cfg, pts = cfg.places.map(p => p.at);
    const span = Math.max(20, ...pts.map(p => Math.abs(p[0]) * 2.4), ...pts.map(p => Math.abs(p[2]) * 2.4));
    if (!cfg.map) { const n = Math.round(span / 2) * 2, gr = new T.GridHelper(n, n / 2, S.color('--txt3'), S.color('--txt3'));
      gr.material.transparent = true; gr.material.opacity = S.light ? .16 : .09; gr.position.y = -.7; S.scene.add(gr); }
    if (cfg.map && cfg.map._b) { /* graticule: a line every map.grid degrees, labelled */
      const [la0, la1, lo0, lo1] = cfg.map._b, st = cfg.map.grid, m = new T.LineBasicMaterial({ color: S.color('--txt2'), transparent: true, opacity: S.light ? .35 : .22 });
      const line = (a, b) => S.scene.add(new T.Line(new T.BufferGeometry().setFromPoints([a, b].map(p => new T.Vector3(p[0], -.66, p[2]))), m));
      for (let la = Math.ceil(la0 / st) * st; la <= la1; la += st) { line(geo(la, lo0, cfg.map), geo(la, lo1, cfg.map));
        S.label(Math.abs(la) + '°' + (la >= 0 ? 'N' : 'S'), null, geo(la, lo0, cfg.map), { cls: 'zone', dy: -50 }); }
      for (let lo = Math.ceil(lo0 / st) * st; lo <= lo1; lo += st) { line(geo(la0, lo, cfg.map), geo(la1, lo, cfg.map));
        S.label(Math.abs(lo) + '°' + (lo >= 0 ? 'E' : 'W'), null, geo(la0, lo, cfg.map), { cls: 'zone', dy: 0 }); }
    }
  };
  P.zone = function (z) {
    const S = this, T = S.T, w = z.x[1] - z.x[0], d = z.z[1] - z.z[0], g = new T.Group(), geoB = new T.BoxGeometry(w, .08, d);
    g.add(new T.Mesh(geoB, new T.MeshStandardMaterial({ color: S.color(z.hue || '--c1'), transparent: true, opacity: S.light ? .1 : .06, roughness: .9, depthWrite: false })),
      new T.LineSegments(new T.EdgesGeometry(geoB), new T.LineBasicMaterial({ color: S.color(z.hue || '--c1'), transparent: true, opacity: .45 })));
    g.position.set((z.x[0] + z.x[1]) / 2, -.62, (z.z[0] + z.z[1]) / 2); S.scene.add(g);
    if (z.label) S.label(z.label, null, [z.x[0] + .4, -.5, z.z[1] - .1], { cls: 'zone', dy: 0 });
  };
  P.place = function (p) {
    const S = this, mk = typeof p.shape === 'function' ? p.shape : SHAPES[p.shape || 'orb'] || SHAPES.orb, [g, lh] = mk(S, p.hue);
    g.position.set(p.at[0], p.at[1], p.at[2]); const s = p.size || 1; g.scale.setScalar(s); S.scene.add(g); S.picks.push({ obj: g, id: p.id });
    const L = p.label ? S.label(p.label, p.sub, [p.at[0], p.at[1] + lh * s + .1, p.at[2]], { hue: p.hue }) : null;
    S.places[p.id] = { g, L, s, k: 0, on: false, hot: false, pulse: 0 };
  };
  P.curve = function (a, b, via, lift) {
    const T = this.T, A = new T.Vector3(a[0], a[1] + .25, a[2]), B = new T.Vector3(b[0], b[1] + .25, b[2]);
    if (via && via.length) return new T.CatmullRomCurve3([A, ...via.map(v => new T.Vector3(v[0], (v[1] || 0) + .25, v[2])), B], false, 'centripetal');
    const h = (lift == null ? (this.cfg.map ? .5 : .9) : lift) + A.distanceTo(B) * (this.cfg.map ? .16 : .06), m1 = A.clone().lerp(B, .33), m2 = A.clone().lerp(B, .67);
    m1.y += h; m2.y += h; return new T.CatmullRomCurve3([A, m1, m2, B], false, 'centripetal');
  };
  P.path = function (p) {
    const S = this, T = S.T, w = p.weight == null ? .5 : clamp(p.weight), c = S.curve(p.a, p.b, p.via, p.lift);
    S.scene.add(new T.Mesh(new T.TubeGeometry(c, 64, .016 + .04 * w, 6, false), S.glow(p.hue, p.opacity == null ? .24 : p.opacity)));
    return { from: p.from, to: p.to, curve: c, hue: p.hue, w, flow: p.flow };
  };
  /* soft round points: one draw call for every comet or cloud point */
  P.points = function (n) {
    const S = this, T = S.T, g = new T.BufferGeometry(), A = (k, s) => g.setAttribute(k, new T.BufferAttribute(new Float32Array(n * s), s));
    A('position', 3); A('pcolor', 3); A('size', 1); A('alpha', 1);
    const m = new T.ShaderMaterial({ uniforms: { uScale: { value: 1 } }, transparent: true, depthWrite: false, blending: S.light ? T.NormalBlending : T.AdditiveBlending,
      vertexShader: 'attribute float size;attribute float alpha;attribute vec3 pcolor;varying vec3 vC;varying float vA;uniform float uScale;void main(){vC=pcolor;vA=alpha;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=max(1.0,size*uScale/-mv.z);gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'varying vec3 vC;varying float vA;void main(){vec2 d=gl_PointCoord-vec2(0.5);float r=length(d)*2.0;if(r>1.0)discard;float a=pow(1.0-r,1.35)+0.6*smoothstep(0.42,0.0,r);gl_FragColor=vec4(vC,min(1.0,a)*vA);}' });
    const pts = new T.Points(g, m); pts.frustumCulled = false; S.scene.add(pts);
    S.ups.push(() => { m.uniforms.uScale.value = S.r.domElement.height * .5; });
    return pts;
  };
  /* comets along curves. def: {curve, hue, comets, trail, size, speed, level, manual, u}. level eases toward target */
  P.flows = function (defs, seed) {
    const S = this, T = S.T, R = rand(seed || 7); let n = 0;
    defs.forEach(d => { d.comets = d.comets || 3; d.trail = d.trail || 10; d.off = n; n += d.comets * d.trail; if (d.level == null) d.level = .6;
      d.target = d.level; d.u = d.u || 0; d.seed = R(); d.col = S.color(d.hue); });
    const pts = S.points(Math.max(1, n)), g = pts.geometry, pos = g.attributes.position.array, col = g.attributes.pcolor.array,
      sz = g.attributes.size.array, al = g.attributes.alpha.array, v = new T.Vector3(), sp = S.cfg.flowSpeed || 1;
    S.ups.push((dt, t) => {
      defs.forEach(d => { d.level += (d.target - d.level) * Math.min(1, dt * .005);
        for (let k = 0; k < d.comets; k++) { const base = d.manual ? d.u : (t * .00011 * (d.speed || 1) * sp + k / d.comets + d.seed) % 1;
          for (let j = 0; j < d.trail; j++) { const i = d.off + k * d.trail + j; let u = base - j * (d.gap || .012);
            const vis = d.manual ? u >= 0 && d.level > .01 && d.curve : true; if (u < 0) u = d.manual ? 0 : u + 1;
            if (d.curve) d.curve.getPointAt(clamp(u), v); pos.set([v.x, v.y, v.z], i * 3); col.set([d.col.r, d.col.g, d.col.b], i * 3);
            const f = 1 - j / d.trail; sz[i] = (d.size || .6) * (.35 + .65 * f);
            al[i] = vis ? d.level * f * (d.manual ? 1 : Math.pow(Math.sin(Math.PI * u), .6)) : 0; } } });
      ['position', 'pcolor', 'size', 'alpha'].forEach(k => { g.attributes[k].needsUpdate = true; });
    });
    return defs;
  };
  P.cloud = function (c) {
    const S = this, pts = S.points(c.points.length), g = pts.geometry; S.cloudPts = pts;
    c.points.forEach((p, i) => { const cl = S.color(p.hue || c.hue || '--c2'); g.attributes.position.array.set(p.p, i * 3);
      g.attributes.pcolor.array.set([cl.r, cl.g, cl.b], i * 3); g.attributes.size.array[i] = p.size || c.size || .5; g.attributes.alpha.array[i] = p.alpha == null ? .85 : p.alpha; });
    g.computeBoundingSphere();
  };
  function buildScene(S, cfg) {
    if (cfg.ground !== false) S.ground();
    cfg.zones.forEach(z => S.zone(z)); cfg.places.forEach(p => S.place(p));
    cfg.marks.forEach(m => S.label(m.text, m.sub, m.at, { cls: 'zone', dy: 0 }));
    S.paths = cfg.paths.map(p => S.path(p));
    S.amb = S.flows(S.paths.filter(p => p.flow !== false).map(p => Object.assign({ curve: p.curve, hue: p.hue, comets: Math.round(2 + 4 * p.w), size: .5 + .3 * p.w }, p.flow || {})), 11);
    if (cfg.cloud) S.cloud(cfg.cloud);
    if (cfg.tour) { S.heroes = S.flows([0, 1, 2, 3].map(() => ({ hue: cfg.tourHue || '--red', comets: 1, trail: 24, size: 1.5, level: 0, manual: true, gap: .007 })), 5);
      S.tour = S.compileTour(cfg.tour); }
    S.ups.push((dt, t) => { Object.values(S.places).forEach(p => { /* scale and label state; spin is a pure function of time */
      const want = p.on || p.hot || performance.now() < p.pulse ? 1 : 0; p.k += (want - p.k) * Math.min(1, dt * .012);
      p.g.scale.setScalar(p.s * (1 + .14 * p.k)); if (p.L) p.L.e.classList.toggle('on', want > 0);
      if (p.g.userData.spin) { p.g.userData.spin.rotation.y = t * .0006; p.g.userData.spin.rotation.x = Math.sin(t * .0004) * .2; } }); });
    if (cfg.build) cfg.build(S, window.THREE);
  }

  /* ───────── the tour: scripted camera shots, a pure function of time so Play and the video match ───────── */
  P.compileTour = function (steps) {
    const S = this, keys = []; let t = .3, from = Object.assign({}, S.home), prev = null;
    steps.forEach(st => {
      const ids = [].concat(st.to || []).filter(id => S.cfg.byId[id]), pts = ids.map(id => S.cfg.byId[id].at);
      const c = st.at || (pts.length ? [0, 1, 2].map(i => pts.reduce((a, p) => a + p[i], 0) / pts.length) : [S.home.tx, S.home.ty, S.home.tz]);
      const cam = { tx: c[0], ty: c[1] + .4, tz: c[2], dist: st.dist || (ids.length > 1 ? 15 : 10), el: st.el == null ? .42 : st.el, az: st.az == null ? S.home.az : st.az };
      const move = st.move == null ? 1.1 : st.move, hold = st.hold == null ? .9 : st.hold;
      const heroes = prev ? S.paths.filter(p => prev.includes(p.from) && ids.includes(p.to)).slice(0, 4) : [];
      keys.push({ t0: t, t1: t + move, t2: t + move + hold, from, cam, ids, heroes, say: st.say }); t += move + hold; from = cam; prev = ids;
    });
    keys.push({ t0: t, t1: t + 1.6, t2: t + 1.6, from, cam: Object.assign({}, S.home), ids: [], heroes: [], say: S.cfg.tourEnd || 'Done. Drag to turn, or click a place.', end: true });
    return { keys, dur: t + 1.6 };
  };
  P.applyTour = function (t) {
    const S = this, K = S.tour.keys, k = K.find(x => t < x.t2) || K[K.length - 1];
    const m = clamp((t - k.t0) / Math.max(.001, k.t1 - k.t0)), e = REDUCED && !S.ext ? (m > 0 ? 1 : 0) : ease(m);
    ['tx', 'ty', 'tz', 'dist', 'el'].forEach(n => { S.orb[n] = lerp(k.from[n], k.cam[n], e); });
    let d = (k.cam.az - k.from.az) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; S.orb.az = k.from.az + d * e;
    S.heroes.forEach((h, i) => { const p = k.heroes[i], on = p && t >= k.t0 && m < 1; h.curve = on ? p.curve : h.curve; h.u = on ? ease(m) : 0; h.level = h.target = on ? 1 : 0; });
    const arrived = m >= 1; Object.entries(S.places).forEach(([id, p]) => { p.on = arrived && k.ids.includes(id); });
    S.amb.forEach(f => { f.target = k.end ? lerp(.15, .6, e) : .15; });
    const say = arrived || k.end ? (k.say || (k.ids.length ? k.ids.map(id => label(S.cfg.byId[id])).join(' + ') : '')) : null;
    if (say != null && say !== S._said) { S._said = say; if (S.onSay) S.onSay(say); }
  };
  P.play = function () {
    if (!this.tour) return; this.tour.keys[0].from = Object.assign({}, this.orb); this._said = null;
    this.tourT0 = performance.now(); this.auto = false; if (this.onTour) this.onTour('play'); this.kick();
  };
  P.endTour = function (done) {
    this.tourT0 = 0; this.heroes.forEach(h => { h.level = h.target = 0; }); this.amb.forEach(f => { f.target = .6; });
    Object.values(this.places).forEach(p => { p.on = false; }); this.auto = !REDUCED && this.cfg.autoTurn !== false; this.last = performance.now();
    if (this.onTour) this.onTour(done ? 'end' : 'stop');
  };

  /* ───────── the flat figure: a top-down SVG of the same config (tall on phones) ───────── */
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, a) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
  function drawFlat(box, cfg, onPick) {
    box.textContent = ''; const W = Math.max(280, box.clientWidth || 600), rot = W < 600 && !cfg.map && cfg.flatRotate !== false;
    const all = cfg.places.map(p => p.at).concat(...cfg.paths.map(p => p.via), ...cfg.zones.map(z => [[z.x[0], 0, z.z[0]], [z.x[1], 0, z.z[1]]]),
      cfg.cloud ? cfg.cloud.points.map(p => p.p) : []);
    if (cfg.map && cfg.map._b) { const b = cfg.map._b; all.push(geo(b[0], b[2], cfg.map), geo(b[1], b[3], cfg.map)); }
    const xs = all.map(p => p[0]), zs = all.map(p => p[2]), x0 = Math.min(...xs), z0 = Math.min(...zs);
    const sx = Math.max(.5, Math.max(...xs) - x0), sz = Math.max(.5, Math.max(...zs) - z0);
    let map, H; const pos = {};
    if (rot) { /* phones: the main axis runs down the page, labels sit under their dots. Rows keep their real spacing
      where it fits; a row with more places than fit side by side stacks them in sub-rows (the one on the axis first) */
      const pad = Math.min(80, W * .22), per = Math.max(1, Math.floor((W - 16) / 160)), zc = z0 + sz / 2, SUB = 92;
      const zx = z => sz < .6 ? W / 2 : pad + (z - z0) * (W - 2 * pad) / sz, rows = [];
      [...cfg.places].sort((a, b) => a.at[0] - b.at[0]).forEach(p => { const r = rows[rows.length - 1]; if (r && p.at[0] - r.x < .3) r.ps.push(p); else rows.push({ x: p.at[0], ps: [p] }); });
      const gap = Math.min(sx, ...rows.slice(1).map((r, i) => r.x - rows[i].x)), ky = Math.min(130 / gap, 1900 / sx); let floor = 40;
      rows.forEach(r => {
        let subs = [r.ps.map(p => [p, zx(p.at[2])])];
        if (r.ps.length > per) { const ps = [...r.ps].sort((a, b) => Math.abs(a.at[2] - zc) - Math.abs(b.at[2] - zc)), mid = Math.abs(ps[0].at[2] - zc) < .5 ? [ps.shift()] : [];
          ps.sort((a, b) => a.at[2] - b.at[2]); subs = mid.length ? [[[mid[0], W / 2]]] : [];
          for (let i = 0; i < ps.length; i += per) { const g = ps.slice(i, i + per); subs.push(g.map((p, j) => [p, g.length === 1 ? zx(p.at[2]) : pad + j * (W - 2 * pad) / (g.length - 1)])); } }
        r.y = Math.max(40 + (r.x - x0) * ky, floor); subs.forEach((g, j) => g.forEach(([p, x]) => { pos[p.id] = [x, r.y + j * SUB]; }));
        floor = r.y + (subs.length - 1) * SUB + 120; r.end = r.y + (subs.length - 1) * SUB;
      });
      const rowY = x => { const i = rows.findIndex(r => r.x > x); if (i === 0 || !rows.length) return 40 + (x - x0) * ky;
        if (i < 0) { const r = rows[rows.length - 1]; return r.end + (x - r.x) * ky; } const a = rows[i - 1], b = rows[i]; return lerp(a.end, b.y, (x - a.x) / (b.x - a.x)); };
      H = rows.length ? rows[rows.length - 1].end + 90 : 200; map = (x, z) => [zx(z), rowY(x)];
    } else {
      const pad = Math.min(90, W * .12); let kx = (W - 2 * pad) / sx, kz = Math.min(kx, 320 / sz), ox = (W - sx * kx) / 2;
      if (cfg.map) { const room = W - 76; kx = kz = Math.min(room / sx, 560 / sz); ox = 56 + (room - sx * kx) / 2; } /* room on the left for latitude labels */
      H = 44 + sz * kz + 70; map = (x, z) => [ox + (x - x0) * kx, 44 + (z - z0) * kz];
    }
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': cfg.title || 'Flat view of the figure' });
    const layer = el('div', 'f3d-layer'); box.append(svg, layer);
    const lab = (text, sub, x, y, o) => { const e = el(o.tag || 'div', 'f3d-l ' + (o.cls || '')); e.textContent = text;
      if (sub) { const s = el('small'); s.textContent = sub; e.appendChild(s); } if (o.hue) e.style.setProperty('--lc', hueVar(o.hue));
      if (o.w) e.style.maxWidth = o.w + 'px'; layer.appendChild(e);
      if (!o.tf || o.clamp) { const hw = e.offsetWidth / 2 + 4; x = clamp(x, hw, W - hw); } /* keep place labels inside the figure */
      e.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) ${o.tf || 'translate(-50%,12px)'}`; return e; };
    cfg.zones.forEach(z => { const a = map(z.x[0], z.z[0]), b = map(z.x[1], z.z[1]), x = rot ? 6 : Math.min(a[0], b[0]), y = Math.min(a[1], b[1]); /* phones: zones become full-width bands */
      svg.appendChild(sv('rect', { x, y, width: rot ? W - 12 : Math.abs(b[0] - a[0]), height: Math.abs(b[1] - a[1]), rx: 12, fill: `color-mix(in srgb, ${hueVar(z.hue || '--c1')} 7%, transparent)`,
        stroke: `color-mix(in srgb, ${hueVar(z.hue || '--c1')} 45%, transparent)` }));
      if (z.label) lab(z.label, null, x + 10, y + 8, { cls: 'zone', tf: 'translate(0,0)' }); });
    if (cfg.map && cfg.map._b) { /* graticule; latitude labels left of the grid, longitude labels under it, thinned so they never touch */
      const [la0, la1, lo0, lo1] = cfg.map._b, st = cfg.map.grid; let ly = -1e9, lx = -1e9;
      const gl = (a, b) => { const p = map(a[0], a[2]), q = map(b[0], b[2]); svg.appendChild(sv('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: 'grat' })); return p; };
      for (let la = Math.ceil(la0 / st) * st; la <= la1; la += st) { const p = gl(geo(la, lo0, cfg.map), geo(la, lo1, cfg.map));
        if (Math.abs(p[1] - ly) >= 22) { ly = p[1]; lab(Math.abs(la) + (la >= 0 ? '°N' : '°S'), null, p[0] - 8, p[1], { cls: 'zone', tf: 'translate(-100%,-50%)' }); } }
      for (let lo = Math.ceil(lo0 / st) * st; lo <= lo1; lo += st) { const p = gl(geo(la1, lo, cfg.map), geo(la0, lo, cfg.map));
        if (p[0] - lx >= 56) { lx = p[0]; lab(Math.abs(lo) + (lo >= 0 ? '°E' : '°W'), null, p[0], p[1] - 8, { cls: 'zone', tf: 'translate(-50%,-100%)' }); } } }
    cfg.paths.forEach(p => { /* sample the path, bow arcs a little, arrow at the middle shows direction */
      const A = pos[p.from] || map(p.a[0], p.a[2]), B = pos[p.to] || map(p.b[0], p.b[2]); let s = [A, ...p.via.map(v => map(v[0], v[2])), B];
      if (!p.via.length) { const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, bow = cfg.map ? .14 : .06, c = [(A[0] + B[0]) / 2 - dy / L * L * bow, (A[1] + B[1]) / 2 + dx / L * L * bow];
        s = Array.from({ length: 17 }, (_, i) => { const u = i / 16, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u; return [a * A[0] + b * c[0] + d * B[0], a * A[1] + b * c[1] + d * B[1]]; }); }
      const d = 'M' + s.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L'), w = p.weight == null ? .5 : clamp(p.weight), hue = hueVar(p.hue);
      svg.appendChild(sv('path', { d, class: 'base', stroke: hue, 'stroke-width': 1.5 + 3 * w }));
      if (p.flow !== false) svg.appendChild(sv('path', { d, class: 'fl', stroke: hue }));
      const len = [0]; for (let i = 1; i < s.length; i++) len.push(len[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
      const half = len[len.length - 1] / 2, i = Math.max(1, len.findIndex(v => v >= half)), q = s[i], r = s[i - 1], an = Math.atan2(q[1] - r[1], q[0] - r[0]) * 180 / Math.PI;
      svg.appendChild(sv('path', { d: 'M-5,-4.5L5,0L-5,4.5Z', fill: hue, transform: `translate(${((q[0] + r[0]) / 2).toFixed(1)},${((q[1] + r[1]) / 2).toFixed(1)}) rotate(${an.toFixed(1)})` }));
    });
    if (cfg.cloud) { /* an active query (cloud.query) dims the rest and adds its marker, links to its matches and rank badges 1 to 3 */
      const Q = cfg.cloud.query, rk = new Map(Q ? Q.matches.map(m => [m.id, m.rank]) : []), mh = hueVar(Q && Q.hue || '--c1'), q0 = Q && map(Q.p[0], Q.p[2]);
      const pts = cfg.cloud.points.map(p => ({ p, q: map(p.p[0], p.p[2]), r: rk.get(p.id) })).sort((a, b) => (a.r ? 1e3 - a.r : 0) - (b.r ? 1e3 - b.r : 0));
      if (Q) pts.forEach(o => { if (o.r) svg.appendChild(sv('line', { x1: q0[0], y1: q0[1], x2: o.q[0], y2: o.q[1], class: 'ql', stroke: o.r <= 3 ? 'var(--f3-acc)' : mh })); });
      pts.forEach(o => svg.appendChild(sv('circle', o.r ? { cx: o.q[0], cy: o.q[1], r: o.r <= 3 ? 6 : 4.5, fill: o.r <= 3 ? 'var(--f3-acc)' : mh, stroke: 'var(--f3-bg)', 'stroke-width': 1.5 }
        : { cx: o.q[0], cy: o.q[1], r: 3, fill: hueVar(o.p.hue || cfg.cloud.hue || '--c2'), opacity: Q ? .45 : .7 })));
      if (Q) { svg.appendChild(sv('circle', { cx: q0[0], cy: q0[1], r: 9, fill: 'none', stroke: 'var(--f3-txt)', 'stroke-width': 2.5, 'data-query-marker': '' }));
        let top = q0[1] - 10; pts.filter(o => o.r <= 3).forEach(o => { const dx = o.q[0] - q0[0], dy = o.q[1] - q0[1], L = Math.hypot(dx, dy), u = L > .5 ? [dx / L, dy / L] : [0, -1]; /* badge sits just past the point, away from the query */
          const bx = o.q[0] + u[0] * 16, by = o.q[1] + u[1] * 16, g = sv('g', { 'data-rank': o.r, transform: `translate(${bx.toFixed(1)},${by.toFixed(1)})` }); top = Math.min(top, by - 9, o.q[1] - 6);
          g.append(sv('rect', { x: -9, y: -9, width: 18, height: 18, rx: 6 }), Object.assign(sv('text', { y: 4, 'text-anchor': 'middle' }), { textContent: o.r })); svg.appendChild(g); });
        lab(Q.label, null, q0[0], top - 4, { cls: 'on', hue: '--red', tf: 'translate(-50%,-100%)', clamp: true }); /* above the marker and its badges */
        svg.setAttribute('aria-label', `${cfg.title || 'Flat view of the figure'}. ${Q.label}: ` + pts.filter(o => o.r <= 3).sort((a, b) => a.r - b.r).map(o => `${o.r}, ${o.p.label || o.p.id}`).join('; ')); } }
    cfg.marks.forEach(m => { const q = map(m.at[0], m.at[2]); lab(m.text, m.sub, q[0], q[1], { cls: 'zone', tf: 'translate(-50%,6px)' }); });
    cfg.places.forEach(p => { const q = pos[p.id] || map(p.at[0], p.at[2]);
      svg.appendChild(sv('circle', { cx: q[0], cy: q[1], r: 8, fill: hueVar(p.hue), stroke: 'var(--f3-bg)', 'stroke-width': 2.5 }));
      if (!p.label) return; const b = lab(p.label, p.sub, q[0], q[1], { tag: 'button', hue: p.hue, w: rot ? Math.min(170, W * .42) : 170 });
      b.type = 'button'; b.dataset.id = p.id; b.addEventListener('click', () => onPick(p.id)); });
  }

  /* ───────── mount: page figure with Play, 3D or Flat, a status line, lazy load and fallbacks ───────── */
  const CSS = `.f3d{--f3-bg:var(--bg,#0B0D12);--f3-s1:var(--s1,#12151C);--f3-s2:var(--s2,#181C25);--f3-s3:var(--s3,#20252F);--f3-line:var(--line,rgba(255,255,255,.1));
--f3-line2:var(--line2,rgba(255,255,255,.18));--f3-txt:var(--txt,#ECEEF2);--f3-txt2:var(--txt2,#A7ADB9);--f3-acc:var(--red,#4C7DFF);--f3-f:var(--f,'Manrope',system-ui,sans-serif);
--f3-mono:var(--mono,'Martian Mono',ui-monospace,monospace);position:relative;font-family:var(--f3-f);color:var(--f3-txt)}
.f3d-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:0 0 10px}
.f3d-bar[hidden],.f3d-seg[hidden],.f3d-btn[hidden],.f3d-stage[hidden],.f3d-flat[hidden],.f3d-tip[hidden]{display:none}
.f3d-btn{min-height:44px;min-width:44px;padding:0 16px;border-radius:10px;border:1px solid var(--f3-line2);background:var(--f3-s2);color:var(--f3-txt);font:600 14px/1 var(--f3-f);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:background .2s,border-color .2s,transform .12s}
.f3d-btn:hover{background:var(--f3-s3)}.f3d-btn:active{transform:scale(.97)}
.f3d-btn:focus-visible,.f3d-stage:focus-visible,.f3d-flat button.f3d-l:focus-visible{outline:2px solid var(--f3-acc);outline-offset:2px}
.f3d-btn[aria-pressed="true"]{border-color:var(--f3-acc);background:color-mix(in srgb,var(--f3-acc) 20%,var(--f3-s2))}
.f3d-btn svg{width:16px;height:16px}.f3d-seg{display:inline-flex;gap:4px}
.f3d-say{flex:1 1 220px;margin:0;font:500 14px/1.45 var(--f3-f);color:var(--f3-txt)}
.f3d-stage{position:relative;height:480px;border-radius:12px;overflow:hidden;border:1px solid var(--f3-line);background:radial-gradient(120% 90% at 50% 0%,color-mix(in srgb,var(--f3-acc) 7%,var(--f3-bg)),var(--f3-bg) 70%);touch-action:pan-y;cursor:grab;contain:layout paint}
.f3d-stage:active{cursor:grabbing}
.f3d-stage canvas{display:block;width:100%!important;height:100%!important;opacity:0;transition:opacity .8s}
.f3d-stage.ready canvas{opacity:1}
.f3d-stage::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 30%,color-mix(in srgb,var(--f3-txt) 5%,transparent) 50%,transparent 70%);background-size:220% 100%;animation:f3dShim 1.4s linear infinite}
.f3d-stage.ready::after{display:none}
@keyframes f3dShim{from{background-position:120% 0}to{background-position:-120% 0}}
.f3d-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.f3d-l{position:absolute;left:0;top:0;white-space:nowrap;padding:4px 9px 5px;border-radius:9px;background:color-mix(in srgb,var(--f3-s1) 84%,transparent);border:1px solid color-mix(in srgb,var(--lc,var(--f3-line2)) 55%,transparent);font:600 13px/1.25 var(--f3-f);color:var(--f3-txt);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);transition:opacity .35s,border-color .35s,box-shadow .35s;will-change:transform;text-align:left}
.f3d-l small{display:block;font:500 12px/1.3 var(--f3-f);color:var(--f3-txt2)}
.f3d-l.on{border-color:var(--lc,var(--f3-acc));box-shadow:0 0 0 1px var(--lc,var(--f3-acc)),0 8px 26px -10px var(--lc,var(--f3-acc))}
.f3d-l.zone{background:transparent;border:0;-webkit-backdrop-filter:none;backdrop-filter:none;padding:0;font:600 12px var(--f3-mono);letter-spacing:.06em;color:var(--f3-txt2);text-transform:uppercase}
.f3d-l.hide{opacity:0}
.f3d-tip{position:absolute;left:0;top:0;z-index:2;pointer-events:none;max-width:260px;padding:6px 10px;border-radius:8px;background:var(--f3-txt);color:var(--f3-bg);font:600 13px/1.35 var(--f3-f)}
.f3d-hint{position:absolute;right:12px;bottom:10px;font:500 12px var(--f3-f);color:var(--f3-txt2);pointer-events:none}
.f3d-flat{position:relative;border-radius:12px;border:1px solid var(--f3-line);background:var(--f3-bg);overflow:hidden}
.f3d-flat svg{display:block}.f3d-flat .f3d-layer{overflow:visible}
.f3d-flat button.f3d-l{pointer-events:auto;cursor:pointer;white-space:normal;text-align:center;min-height:32px}
.f3d-flat button.f3d-l:hover{border-color:var(--lc,var(--f3-acc))}
.f3d-flat path.base{fill:none;opacity:.35}.f3d-flat path.fl{fill:none;stroke-width:2;stroke-dasharray:3 9;animation:f3dDash 1.2s linear infinite}
.f3d-flat line.grat{stroke:var(--f3-txt2);stroke-opacity:.18}
@keyframes f3dDash{to{stroke-dashoffset:-24}}
.f3d-flat line.ql{stroke-width:1.2;opacity:.55;animation:f3dIn .5s both}
.f3d-flat [data-rank]{animation:f3dIn .4s .45s both}.f3d-flat [data-rank] rect{fill:var(--f3-s1);stroke:var(--f3-acc);stroke-width:1.5}
.f3d-flat [data-rank] text{font:700 11px var(--f3-mono);fill:var(--f3-txt)}
@keyframes f3dIn{from{opacity:0}}
@media (prefers-reduced-motion:reduce){.f3d-flat path.fl,.f3d-flat line.ql,.f3d-flat [data-rank]{animation:none}.f3d-stage::after{animation:none}}
.f3d[data-video] .f3d-stage{border:0;border-radius:0;background:transparent}
.f3d[data-video] .f3d-l{font-size:22px;padding:8px 16px 9px;border-radius:14px}.f3d[data-video] .f3d-l small{font-size:19px}
.f3d[data-video] .f3d-l.zone{font-size:19px;padding:0}`;
  function injectCSS() { if (document.getElementById('flow3d-css')) return; const s = el('style'); s.id = 'flow3d-css'; s.textContent = CSS; document.head.appendChild(s); }
  const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';
  const STOP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';

  function mount(target, cfg, opt) {
    opt = opt || {}; const host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) { console.warn('flow3d: no element for', target); return null; }
    injectCSS(); prep(cfg); host.classList.add('f3d'); host.textContent = '';
    const bar = el('div', 'f3d-bar'), play = el('button', 'f3d-btn'), seg = el('div', 'f3d-seg'), b3 = el('button', 'f3d-btn'), bF = el('button', 'f3d-btn'), say = el('p', 'f3d-say');
    [play, b3, bF].forEach(b => { b.type = 'button'; }); b3.textContent = '3D'; bF.textContent = 'Flat';
    seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'View'); seg.append(b3, bF);
    say.setAttribute('aria-live', 'polite');
    bar.append(play, seg, say);
    const stage = el('div', 'f3d-stage'), layer = el('div', 'f3d-layer'), tip = el('div', 'f3d-tip'), hint = el('span', 'f3d-hint');
    tip.hidden = true; hint.textContent = 'Drag to turn'; stage.append(layer, tip, hint); stage.tabIndex = 0;
    stage.setAttribute('role', 'img'); stage.setAttribute('aria-label', (cfg.title || '3D figure') + '. Arrow keys turn it.');
    if (cfg.height) stage.style.height = cfg.height + 'px';
    const flat = el('div', 'f3d-flat'); host.append(bar, stage, flat);
    const C = { host, cfg, S: null, mode: '', userFlat: false, failed: false, near: false, played: false, w: 0 };
    const setPlay = st => { const on = st === 'play'; play.innerHTML = (on ? STOP : PLAY) + `<span>${on ? 'Stop' : st === 'idle' ? 'Play' : 'Replay'}</span>`; };
    const sayText = t => { say.textContent = t; };
    const pick = id => { const p = cfg.byId[id]; if (!p) return; sayText(p.say || label(p));
      if (C.S && C.S.places[id]) C.S.places[id].pulse = performance.now() + 900; if (cfg.onPick) cfg.onPick(id, p); };
    const can = () => !C.failed && webgl() && host.clientWidth >= (cfg.minWidth || 600);
    function stop3d() { if (C.S) { C.orb = Object.assign({}, C.S.orb); C.S.dispose(); C.S = null; } stage.classList.remove('ready'); setPlay('idle'); }
    function fail(e) { console.warn('flow3d: showing the flat figure,', e && e.message); C.loading = false; C.failed = true; setMode('flat'); }
    function start3d() {
      if (C.mode !== '3d' || !C.near || C.S || C.loading) return; C.loading = true;
      loadThree().then(() => { C.loading = false; if (C.mode !== '3d' || C.S) return;
        try { const S = C.S = new Stage(stage, cfg, { orb: C.orb }); S.onSay = sayText; S.onPick = pick;
          S.onTour = st => setPlay(st); buildScene(S, cfg); requestAnimationFrame(() => stage.classList.add('ready')); autoplay(); }
        catch (e) { if (C.S) { C.S.dispose(); C.S = null; } fail(e); } }).catch(fail);
    }
    const HINTS = ['', 'Press play, drag to turn, or click a place.', 'Drag to turn, or click a place.', 'Click a place to read about it.'];
    function setMode(m) {
      say.textContent = m === 'flat' ? cfg.flatHint || HINTS[3] : cfg.hint || (cfg.tour ? HINTS[1] : HINTS[2]);
      C.mode = m; stage.hidden = m !== '3d'; flat.hidden = m !== 'flat'; seg.hidden = !can(); play.hidden = m !== '3d' || !cfg.tour;
      b3.setAttribute('aria-pressed', String(m === '3d')); bF.setAttribute('aria-pressed', String(m === 'flat'));
      if (m === 'flat') { stop3d(); drawFlat(flat, cfg, pick); C.w = host.clientWidth; } else start3d();
    }
    function autoplay() { if (C.played || REDUCED || !cfg.tour || cfg.autoplay === false) return;
      const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting) && C.S && !C.played) { C.played = true; io.disconnect(); setTimeout(() => C.S && C.S.play(), 350); } }, { threshold: .35 });
      io.observe(stage); }
    setPlay('idle');
    play.addEventListener('click', () => { if (!C.S) return; C.played = true; if (C.S.tourT0) C.S.endTour(false); else C.S.play(); });
    b3.addEventListener('click', () => { C.userFlat = false; setMode('3d'); });
    bF.addEventListener('click', () => { C.userFlat = true; setMode('flat'); });
    stage.addEventListener('keydown', e => { const S = C.S, k = { ArrowLeft: [-.15, 0], ArrowRight: [.15, 0], ArrowUp: [0, .08], ArrowDown: [0, -.08] }[e.key];
      if (!S || !k) return; e.preventDefault(); if (S.tourT0) S.endTour(false); S.orb.az += k[0]; S.orb.el = clamp(S.orb.el + k[1], .06, 1.35); S.last = performance.now(); S.kick(); });
    new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { C.near = true; start3d(); } }, { rootMargin: '300px' }).observe(host);
    let rz = 0; new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(() => {
      if (C.mode === '3d' && !can()) setMode('flat'); else if (C.mode === 'flat' && !C.userFlat && can()) setMode('3d');
      else if (C.mode === 'flat' && host.clientWidth !== C.w) setMode('flat'); seg.hidden = !can(); }, 160); }).observe(host);
    const look = () => ['--bg', '--txt', '--c1', '--red'].map(tok).join(); let th = 0, was = look();
    new MutationObserver(() => { clearTimeout(th); th = setTimeout(() => { if (look() === was) return; was = look();
      if (C.mode === 'flat') drawFlat(flat, cfg, pick); else if (C.S) { stop3d(); start3d(); } }, 120); })
      .observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-palette', 'class', 'style'] });
    document.addEventListener('visibilitychange', () => { if (C.S) C.S.kick(); });
    setMode(can() ? '3d' : 'flat');
    C.play = () => C.S && C.S.play(); C.flat = on => { C.userFlat = !!on; setMode(on ? 'flat' : '3d'); };
    C.redraw = () => { if (C.mode === 'flat') drawFlat(flat, cfg, pick); }; /* after the page changes cfg (e.g. cloud.query) */
    return C;
  }

  /* video: same config, fixed frame size, no loop, no controls; render with renderAt(t) from HyperFrames' hf-seek */
  function video(target, cfg, opt) {
    opt = Object.assign({ width: 1920, height: 1080, pixelRatio: 1 }, opt || {}); const host = typeof target === 'string' ? document.querySelector(target) : target;
    injectCSS(); prep(cfg); host.classList.add('f3d'); host.dataset.video = ''; host.textContent = '';
    const stage = el('div', 'f3d-stage ready'), layer = el('div', 'f3d-layer'); layer.setAttribute('data-layout-ignore', '');
    stage.style.cssText = `width:${opt.width}px;height:${opt.height}px`; stage.append(layer); host.append(stage);
    return loadThree().then(() => { const S = new Stage(stage, cfg, Object.assign({ clock: 'external' }, opt)); buildScene(S, cfg);
      return { stage: S, duration: S.tour ? S.tour.dur : null, renderAt: t => S.renderAt(t) }; });
  }

  window.Flow3D = { mount, video, geo, loadThree, version: '1.0.0' };
})();
