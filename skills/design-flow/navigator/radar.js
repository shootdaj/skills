/* Look navigator: the star graph ("spiky graph"). Plain SVG, one or two looks at a time, spikes grow and morph between looks.
   Each axis label says whether the attribute is measured from the look file (filled dot) or judged (ring). Tap a label or a spike for its basis. */
(function () {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const E = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = t => 1 - Math.pow(1 - t, 4);

class Radar {
  constructor(host, opts) {
    this.host = host; this.o = Object.assign({ size: 320, labels: true, compact: false, title: 'Star graph' }, opts || {});
    this.A = window.NavData.ATTRS; this.n = this.A.length; this.cur = []; this.series = [];
    const s = this.o.size, m = this.o.labels ? 58 : 4; this.R = s / 2 - m; this.W = s;
    host.classList.add('radar'); host.style.setProperty('--rs', s + 'px');
    host.innerHTML = `<svg viewBox="${-s / 2} ${-s / 2} ${s} ${s}" role="img" aria-label="${E(this.o.title)}"><g class="rg"></g><g class="rp"></g><g class="rl"></g></svg>${this.o.labels ? '<div class="rtip" role="status" aria-live="polite"></div>' : ''}`;
    this.svg = host.querySelector('svg'); this.tip = host.querySelector('.rtip');
    this.grid(); if (this.o.labels) this.labels();
    if (this.tip) { host.addEventListener('pointerleave', () => this.hide()); host.addEventListener('keydown', e => { if (e.key === 'Escape') this.hide(); }); }
  }
  ang(i) { return i * 2 * Math.PI / this.n - Math.PI / 2; }
  pt(i, v) { const r = this.R * Math.max(0.03, Math.min(10, v) / 10); return [Math.cos(this.ang(i)) * r, Math.sin(this.ang(i)) * r]; }
  grid() {
    const g = this.svg.querySelector('.rg'); let h = '';
    for (const lv of [2.5, 5, 7.5, 10]) h += `<polygon class="ring${lv === 10 ? ' out' : ''}" points="${this.A.map((a, i) => this.pt(i, lv).join(',')).join(' ')}"/>`;
    this.A.forEach((a, i) => { const [x, y] = this.pt(i, 10); h += `<line class="spoke${a.kind === 'judged' ? ' j' : ''}" x1="0" y1="0" x2="${x}" y2="${y}"/>`; });
    g.innerHTML = h;
  }
  labels() {
    const g = this.svg.querySelector('.rl'); let h = '';
    this.A.forEach((a, i) => {
      const c = Math.cos(this.ang(i)), s = Math.sin(this.ang(i)), r = this.R + 12;
      const x = c * r, y = s * r + (s > 0.5 ? 10 : s < -0.5 ? -4 : 4);
      const anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
      const dx = anchor === 'start' ? 9 : anchor === 'end' ? -9 : 0, mx = anchor === 'middle' ? -(a.short.length * 3.4 + 8) : 0;
      h += `<g class="ax ${a.kind}" data-i="${i}" tabindex="0" role="button" aria-label="${E(a.label)}, ${a.kind}"><rect class="hit" x="${x + (anchor === 'end' ? -78 : anchor === 'start' ? -6 : -40)}" y="${y - 16}" width="84" height="26" rx="6"/>` +
        `<circle class="km" cx="${x + mx + (anchor === 'end' ? 4 : anchor === 'start' ? 0 : 0)}" cy="${y - 4}" r="3.2"/><text x="${x + dx + (anchor === 'middle' ? 5 : 0)}" y="${y}" text-anchor="${anchor}">${E(a.short)}</text></g>`;
    });
    g.innerHTML = h;
    g.querySelectorAll('.ax').forEach(el => {
      const i = +el.dataset.i; const show = () => this.show(i, el);
      el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') show(); });
      el.addEventListener('click', show); el.addEventListener('focus', show); el.addEventListener('blur', () => this.hide());
    });
  }
  /* series: [{name, cls ('a' | 'b' | 'c'), attrs: {k: {v, basis}}}] */
  set(series) {
    this.series = series;
    const target = series.map(s => this.A.map(a => s.attrs[a.k] ? s.attrs[a.k].v : null));
    const from = target.map((t, si) => t.map((v, i) => { const c = this.cur[si] && this.cur[si][i]; return c == null ? 0 : c; }));
    const p = this.svg.querySelector('.rp');
    if (p.children.length !== series.length * 2) {
      p.innerHTML = series.map((s, si) => `<polygon class="shape ${s.cls || 'a'}${s.ghost ? ' ghost' : ''}"/><g class="dots ${s.cls || 'a'}${s.ghost ? ' ghost' : ''}"></g>`).join('');
    } else series.forEach((s, si) => { p.children[si * 2].setAttribute('class', `shape ${s.cls || 'a'}${s.ghost ? ' ghost' : ''}`); p.children[si * 2 + 1].setAttribute('class', `dots ${s.cls || 'a'}${s.ghost ? ' ghost' : ''}`); });
    cancelAnimationFrame(this.raf);
    const t0 = performance.now(), dur = still() ? 0 : 620;
    const step = now => {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = ease(k);
      this.cur = target.map((t, si) => t.map((v, i) => v == null ? null : from[si][i] + (v - from[si][i]) * e));
      this.draw(); if (k < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
    if (this.o.labels) this.svg.querySelectorAll('.ax').forEach((el, i) => el.classList.toggle('none', series.every(s => !s.attrs[this.A[i].k])));
  }
  draw() {
    const p = this.svg.querySelector('.rp');
    this.cur.forEach((vals, si) => {
      const pts = vals.map((v, i) => v == null ? null : this.pt(i, v)).filter(Boolean);
      p.children[si * 2].setAttribute('points', pts.map(q => q.map(n => n.toFixed(1)).join(',')).join(' '));
      if (!this.o.compact) p.children[si * 2 + 1].innerHTML = vals.map((v, i) => v == null ? '' : `<circle cx="${this.pt(i, v)[0].toFixed(1)}" cy="${this.pt(i, v)[1].toFixed(1)}" r="${this.A[i].kind === 'judged' ? 3.4 : 3}" class="${this.A[i].kind}"/>`).join('');
    });
  }
  show(i, el) {
    if (!this.tip) return; const a = this.A[i];
    const rows = this.series.filter(s => !s.ghost || this.series.length < 3).map(s => {
      const v = s.attrs[a.k];
      return `<div class="tr ${s.cls || 'a'}"><span class="sw"></span><b>${E(s.name)}</b><span class="tv">${v ? v.v.toFixed(1) : 'not scored yet'}</span>${v ? `<span class="tb">${E(v.basis)}</span>` : ''}</div>`;
    }).join('');
    this.tip.innerHTML = `<div class="th"><b>${E(a.label)}</b><span class="kind ${a.kind}">${a.kind === 'measured' ? 'measured' : 'judged'}</span></div><p>${E(a.what)}</p>${rows}`;
    this.tip.classList.add('on');
    const hb = this.host.getBoundingClientRect(), eb = el.getBoundingClientRect();
    const tw = Math.min(260, hb.width - 8); this.tip.style.width = tw + 'px';
    let x = eb.left - hb.left + eb.width / 2 - tw / 2; x = Math.max(4, Math.min(hb.width - tw - 4, x));
    const below = eb.top - hb.top < hb.height / 2;
    this.tip.style.left = x + 'px'; this.tip.style.top = below ? (eb.bottom - hb.top + 6) + 'px' : ''; this.tip.style.bottom = below ? '' : (hb.bottom - eb.top + 6) + 'px';
    this.svg.querySelectorAll('.ax').forEach((g, j) => g.classList.toggle('sel', j === i));
  }
  hide() { if (this.tip) { this.tip.classList.remove('on'); this.svg.querySelectorAll('.ax.sel').forEach(g => g.classList.remove('sel')); } }
}
window.Radar = Radar;
})();
