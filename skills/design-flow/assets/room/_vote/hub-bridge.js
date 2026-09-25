/* Hub bridge: lets the design room (../index.html) drive a design through postMessage.
   Include before the vote widget, as the last two lines before </body>:
     <script src="../_vote/hub-bridge.js"></script>
     <script src="../_vote/vote.js" data-design="d1" data-label="D1 Name"></script>
   Relies on the brief's hooks: [data-step="<id>"] on each step root, [data-action="continue|back"], [data-theme-toggle],
   [data-lang-toggle], and name="<field>" on any form the room fills (room.js "fill").
   Messages in:  {type:'design-room', steps:[...ids], langs:[...codes], fill:{step:{field:value}}, slow:[...ids],
                  theme?:'dark'|'light', lang?:'<code>', step?:'<id>'}
   Messages out: {type:'design-room-ack', design, theme, lang, step} */
(function () {
  if (window.parent === window) return;
  var ORDER = [], LANGS = [], FILL = {}, SLOW = [];
  var design = (document.querySelector('script[data-design]') || { dataset: {} }).dataset.design || location.pathname.split('/').slice(-2, -1)[0] || 'unknown';
  var busy = false;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var visible = function (el) { if (!el) return false; var r = el.getBoundingClientRect(); var cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && el.getAttribute('aria-hidden') !== 'true' && parseFloat(cs.opacity) > 0.05; };
  function domOrder() {
    var seen = [];
    Array.prototype.forEach.call(document.querySelectorAll('[data-step]'), function (el) { var id = el.getAttribute('data-step'); if (id && seen.indexOf(id) < 0) seen.push(id); });
    return seen;
  }
  function order() { return ORDER.length ? ORDER : domOrder(); }
  function currentTheme() {
    var h = document.documentElement, b = document.body;
    var a = h.getAttribute('data-theme') || b.getAttribute('data-theme') || h.dataset.mode || '';
    if (/light|dark/.test(a)) return /light/.test(a) ? 'light' : 'dark';
    if (h.classList.contains('light') || b.classList.contains('light')) return 'light';
    if (h.classList.contains('dark') || b.classList.contains('dark')) return 'dark';
    try { var k = Object.keys(localStorage).filter(function (k) { return /-theme$/.test(k); })[0]; if (k) { var v = localStorage.getItem(k) || ''; if (/light|dark/.test(v)) return /light/.test(v) ? 'light' : 'dark'; } } catch (e) {}
    var bg = getComputedStyle(b).backgroundColor.match(/\d+/g) || [0, 0, 0];
    return (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]) > 140 ? 'light' : 'dark';
  }
  function currentLang() {
    var l = (document.documentElement.lang || '').slice(0, 2).toLowerCase();
    if (l && (!LANGS.length || LANGS.indexOf(l) >= 0)) return l;
    var on = Array.prototype.filter.call(document.querySelectorAll('[data-lang-toggle] [aria-pressed="true"], [data-lang-toggle][aria-pressed="true"], [data-lang-toggle] [aria-checked="true"], [data-lang-toggle] .on, [data-lang-toggle] .active, [data-lang-toggle] [aria-current]'), visible)[0];
    if (on) { var t = on.textContent.trim().toLowerCase(); for (var i = 0; i < LANGS.length; i++) if (t.indexOf(LANGS[i]) === 0) return LANGS[i]; }
    return LANGS[0] || l || '';
  }
  function currentStep() {
    var ids = order();
    var roots = Array.prototype.filter.call(document.querySelectorAll('[data-step]'), function (el) { return ids.indexOf(el.getAttribute('data-step')) >= 0; });
    var vis = roots.filter(visible);
    var pick = vis.find(function (el) { return el.classList.contains('active') || el.classList.contains('is-active') || el.getAttribute('aria-current') === 'step' || el.getAttribute('aria-current') === 'page'; }) || vis[0];
    return pick ? pick.getAttribute('data-step') : null;
  }
  function click(sel) { var els = Array.prototype.filter.call(document.querySelectorAll(sel), visible); var el = els[0]; if (el && !el.disabled) { el.click(); return true; } return false; }
  async function clickWhenReady(sel, maxMs) {
    var t0 = Date.now();
    while (Date.now() - t0 < (maxMs || 2500)) { if (click(sel)) return true; await sleep(150); }
    return false;
  }
  function setVal(el, v) {
    if (!el) return;
    var proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var d = Object.getOwnPropertyDescriptor(proto, 'value'); if (d && d.set) d.set.call(el, v); else el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.dispatchEvent(new Event('blur', { bubbles: true }));
  }
  function selectByLabel(el, label) {
    var opt = Array.prototype.find.call(el.options, function (o) { return o.textContent.trim() === label || o.value === label; });
    if (!opt) return false; setVal(el, opt.value); return true;
  }
  function check(el, on) { if (el && !!el.checked !== !!on) el.click(); }
  /* Fills one step's form from room.js "fill": {field: value}. true or false ticks a checkbox, a select is picked by
     label or value, anything phone-like is tried as digits first (masked inputs), then as typed. */
  async function fillStep(map) {
    var names = Object.keys(map || {});
    for (var i = 0; i < names.length; i++) {
      var name = names[i], v = map[name];
      var el = document.querySelector('[name="' + name + '"]'); if (!el) continue;
      if (typeof v === 'boolean') { check(el, v); await sleep(80); continue; }
      if (el.tagName === 'SELECT') { selectByLabel(el, String(v)); await sleep(150); continue; }
      var s = String(v);
      if (/^[\d\s().+-]+$/.test(s) && s.replace(/\D/g, '').length >= 7) { setVal(el, s.replace(/\D/g, '')); if ((el.value || '').replace(/\D/g, '').length < 10) setVal(el, s); }
      else setVal(el, s);
      await sleep(60);
    }
    await sleep(150);
  }
  async function goTo(target) {
    var ids = order();
    if (ids.indexOf(target) < 0) return;
    for (var guard = 0; guard < 14; guard++) {
      var cur = currentStep(); if (cur === target || cur === null) return;
      var ci = ids.indexOf(cur), ti = ids.indexOf(target);
      if (ti < ci) { if (!(await clickWhenReady('[data-action="back"]'))) return; }
      else { if (FILL[cur]) await fillStep(FILL[cur]); if (!(await clickWhenReady('[data-action="continue"]'))) return; }
      await sleep(SLOW.indexOf(cur) >= 0 || SLOW.indexOf(target) >= 0 ? 1200 : 700);
    }
  }
  async function setTheme(t) {
    if (currentTheme() === t) return;
    if (!click('[data-theme-toggle]')) return; await sleep(500);
  }
  async function setLang(l) {
    if (currentLang() === l) return;
    var btns = Array.prototype.filter.call(document.querySelectorAll('[data-lang-toggle], [data-lang-toggle] button, [data-lang-toggle] [role="radio"], [data-lang-toggle] [role="tab"]'), visible);
    var exact = btns.find(function (b) { return b.textContent.trim().toLowerCase().indexOf(l) === 0 && b.children.length < 3; });
    if (exact) exact.click(); else if (btns[0]) btns[0].click();
    await sleep(300);
  }
  function ack() { try { window.parent.postMessage({ type: 'design-room-ack', design: design, theme: currentTheme(), lang: currentLang(), step: currentStep() }, '*'); } catch (e) {} }
  window.addEventListener('message', async function (e) {
    var m = e.data; if (!m || m.type !== 'design-room') return;
    if (Array.isArray(m.steps) && m.steps.length) ORDER = m.steps;
    if (Array.isArray(m.langs)) LANGS = m.langs;
    if (m.fill && typeof m.fill === 'object') FILL = m.fill;
    if (Array.isArray(m.slow)) SLOW = m.slow;
    if (busy) return; busy = true;
    try {
      if (m.theme) await setTheme(m.theme);
      if (m.lang) await setLang(m.lang);
      if (m.step) await goTo(m.step);
    } catch (err) {} finally { busy = false; ack(); }
  });
  window.addEventListener('load', function () { setTimeout(ack, 400); });
  if (document.readyState === 'complete') setTimeout(ack, 400);
})();
