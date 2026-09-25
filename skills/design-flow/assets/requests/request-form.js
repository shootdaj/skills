/* design-flow "New design" request form. Drop into any design room:
   <script src="request-form.js" data-api="http://127.0.0.1:7333" data-room="My room"
           data-bases="d1:Hearth,d2:Tidewater" data-screens="welcome:Welcome,path:Path"></script>
   Mounts into an element with [data-new-design] if the page has one, else shows a floating button.
   Claude Code only: sends the request to the room's local queue (POST /requests); the Claude Code session watching the room builds it.
   Picks up room colours from CSS variables --bg --s1 --s2 --line --txt --txt2 --acc --on-acc when present. */
(function () {
  const me = document.currentScript || { dataset: {} };
  const API = me.dataset.api || 'http://127.0.0.1:7333';
  const ROOM = me.dataset.room || document.title;
  const parse = s => (s || '').split(',').map(x => x.trim()).filter(Boolean).map(x => { const [id, ...r] = x.split(':'); return [id, r.join(':') || id]; });
  const BASES = parse(me.dataset.bases), SCREENS = parse(me.dataset.screens);
  const MOODS = ['Calm and bold', 'Playful', 'Editorial', 'Technical', 'Warm', 'Clinical', 'Premium', 'Friendly'];
  const DRAFT = 'design-request-draft:' + ROOM;
  let online = false, list = [];

  const css = `
  .dr-btn{min-height:44px;padding:0 16px;border-radius:999px;border:1px dashed var(--line2,rgba(255,255,255,.25));background:transparent;color:var(--txt,#eee);font:600 14px/1 inherit;display:inline-flex;align-items:center;gap:8px;cursor:pointer;width:100%;justify-content:center;transition:transform .25s cubic-bezier(.34,1.56,.64,1),border-color .15s,background .15s}
  .dr-btn:hover{transform:translateY(-2px);border-color:var(--acc,#FFD400);background:color-mix(in srgb,var(--acc,#FFD400) 8%,transparent)}
  .dr-btn:active{transform:scale(.97)}
  .dr-fab{position:fixed;left:16px;bottom:16px;z-index:2147482000;width:auto;border-style:solid;background:var(--acc,#FFD400);color:var(--on-acc,#141518);border-color:transparent;box-shadow:0 12px 30px -12px rgba(0,0,0,.6)}
  .dr-plus{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;background:var(--acc,#FFD400);color:var(--on-acc,#141518);font:700 15px/1 system-ui}
  .dr-fab .dr-plus{background:rgba(0,0,0,.12);color:inherit}
  .dr-list{display:grid;gap:6px;margin-top:8px}
  .dr-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:var(--s2,#1d2025);border:1px solid var(--line,rgba(255,255,255,.1));font:500 13px/1.3 inherit;color:var(--txt,#eee)}
  .dr-item b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
  .dr-item a{color:var(--acc,#FFD400);font-weight:600;text-decoration:none;min-height:32px;display:inline-flex;align-items:center}
  .dr-st{font:600 11.5px/1 ui-monospace,monospace;letter-spacing:.04em;text-transform:uppercase;padding:4px 7px;border-radius:999px;border:1px solid currentColor}
  .dr-st.pending{color:var(--txt2,#aaa)} .dr-st.building{color:#FFB347;animation:dr-pulse 1.6s ease-in-out infinite} .dr-st.done{color:#5CD68A} .dr-st.failed{color:#FF6B6B}
  @keyframes dr-pulse{50%{opacity:.45}}
  .dr-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(6,6,8,.72);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:18px}
  .dr-ov.show{display:flex;animation:dr-fade .18s}@keyframes dr-fade{from{opacity:0}}
  .dr-dlg{width:min(640px,100%);max-height:calc(100vh - 36px);overflow:auto;background:var(--s1,#16181c);color:var(--txt,#eee);border:1px solid var(--line2,rgba(255,255,255,.18));border-radius:18px;box-shadow:0 30px 80px -30px rgba(0,0,0,.8);animation:dr-rise .3s cubic-bezier(.2,.7,.1,1)}
  @keyframes dr-rise{from{opacity:0;transform:translateY(14px) scale(.98)}}
  .dr-hd{display:flex;align-items:center;gap:12px;padding:18px 20px 6px}.dr-dlg .dr-hd h2{margin:0;font:700 21px/1.2 inherit;flex:1;text-transform:none;letter-spacing:0;color:inherit}
  .dr-x{width:44px;height:44px;border-radius:50%;border:1px solid var(--line2,rgba(255,255,255,.18));background:transparent;color:inherit;cursor:pointer;font-size:18px}
  .dr-sub{padding:0 20px;color:var(--txt2,#aaa);font-size:13.5px}
  .dr-bd{padding:12px 20px 4px;display:grid;gap:14px}
  .dr-f label{display:block;font:600 12.5px/1.2 inherit;letter-spacing:.04em;text-transform:uppercase;color:var(--txt2,#aaa);margin-bottom:6px}
  .dr-f input[type=text],.dr-f textarea,.dr-f select{width:100%;min-height:44px;border-radius:12px;border:1px solid var(--line2,rgba(255,255,255,.18));background:var(--s2,#1d2025);color:var(--txt,#eee);padding:10px 12px;font:inherit;font-size:14px}
  .dr-f textarea{min-height:76px;resize:vertical}
  .dr-f input:focus,.dr-f textarea:focus,.dr-f select:focus{outline:2px solid var(--acc,#FFD400);outline-offset:1px}
  .dr-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .dr-chips{display:flex;flex-wrap:wrap;gap:6px}
  .dr-chip{min-height:38px;padding:0 13px;border-radius:999px;border:1px solid var(--line2,rgba(255,255,255,.18));background:transparent;color:inherit;cursor:pointer;font:500 13px inherit;transition:transform .2s cubic-bezier(.34,1.56,.64,1),background .15s}
  .dr-chip:hover{transform:translateY(-2px)}.dr-chip[aria-pressed=true]{background:var(--acc,#FFD400);color:var(--on-acc,#141518);border-color:transparent}
  .dr-ft{position:sticky;bottom:0;display:flex;align-items:center;gap:10px;padding:14px 20px 18px;flex-wrap:wrap;background:var(--s1,#16181c);border-top:1px solid var(--line,rgba(255,255,255,.1))}.dr-ft .sp{flex:1}
  .dr-ft small{color:var(--txt2,#aaa);font-size:12.5px}
  .dr-go{min-height:44px;padding:0 18px;border-radius:999px;border:0;background:var(--acc,#FFD400);color:var(--on-acc,#141518);font:700 14px inherit;cursor:pointer;transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
  .dr-go:hover{transform:translateY(-2px)}.dr-go:active{transform:scale(.96)}.dr-go[disabled]{opacity:.5;cursor:not-allowed;transform:none}
  .dr-ghost{min-height:44px;padding:0 16px;border-radius:999px;border:1px solid var(--line2,rgba(255,255,255,.18));background:transparent;color:inherit;font:600 14px inherit;cursor:pointer}
  .dr-done{padding:18px 20px;display:grid;gap:10px}.dr-done code{display:block;padding:10px 12px;border-radius:10px;background:var(--s2,#1d2025);font:500 12.5px/1.5 ui-monospace,monospace;white-space:pre-wrap;word-break:break-all}
  @media (max-width:560px){.dr-row{grid-template-columns:1fr}}
  @media (prefers-reduced-motion:reduce){.dr-ov,.dr-dlg,.dr-btn,.dr-chip,.dr-go{animation:none!important;transition:none!important}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const el = (t, a, kids) => { const e = document.createElement(t); for (const k in (a || {})) { if (k === 'text') e.textContent = a[k]; else if (k.startsWith('on')) e.addEventListener(k.slice(2), a[k]); else e.setAttribute(k, a[k]); } (kids || []).forEach(c => c && e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)); return e; };

  // entry point
  const mount = document.querySelector('[data-new-design]');
  const btn = el('button', { class: 'dr-btn' + (mount ? '' : ' dr-fab'), type: 'button', 'aria-haspopup': 'dialog' }, [el('span', { class: 'dr-plus', text: '+' }), 'New design']);
  const listBox = el('div', { class: 'dr-list', 'aria-live': 'polite' });
  if (mount) { mount.appendChild(btn); mount.appendChild(listBox); } else document.body.appendChild(btn);

  // dialog
  const ov = el('div', { class: 'dr-ov', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'New design request' });
  const dlg = el('div', { class: 'dr-dlg' }); ov.appendChild(dlg); document.body.appendChild(ov);
  let draft = {}; try { draft = JSON.parse(localStorage.getItem(DRAFT) || '{}'); } catch (e) {}
  const saveDraft = () => { try { localStorage.setItem(DRAFT, JSON.stringify(draft)); } catch (e) {} };

  function chipGroup(key, options, multi) {
    const box = el('div', { class: 'dr-chips', role: multi ? 'group' : 'radiogroup' });
    const cur = () => [].concat(draft[key] || []);
    options.forEach(([id, label]) => {
      const b = el('button', { class: 'dr-chip', type: 'button', 'aria-pressed': String(cur().includes(id)), text: label });
      b.addEventListener('click', () => {
        let v = cur(); if (multi) v = v.includes(id) ? v.filter(x => x !== id) : [...v, id]; else v = v.includes(id) ? [] : [id];
        draft[key] = multi ? v : (v[0] || ''); saveDraft(); [...box.children].forEach((c, i) => c.setAttribute('aria-pressed', String([].concat(draft[key] || []).includes(options[i][0]))));
      });
      box.appendChild(b);
    });
    return box;
  }
  function field(label, node) { return el('div', { class: 'dr-f' }, [el('label', { text: label }), node]); }
  function input(key, ph, area) {
    const n = el(area ? 'textarea' : 'input', area ? { placeholder: ph } : { type: 'text', placeholder: ph });
    n.value = draft[key] || ''; n.addEventListener('input', () => { draft[key] = n.value; saveDraft(); }); return n;
  }
  function inspirationPicks() {
    const picks = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!k.startsWith('inspire:')) continue; const s = JSON.parse(localStorage.getItem(k)); Object.keys(s.liked || {}).forEach(id => picks.push({ id, note: (s.notes || {})[id] || '', tags: (s.tags || {})[id] || [] })); } } catch (e) {}
    return picks;
  }
  let go;
  function form() {
    dlg.replaceChildren();
    const base = el('select'); base.appendChild(el('option', { value: '', text: 'Start fresh' })); BASES.forEach(([id, l]) => { const o = el('option', { value: id, text: `Start from ${id.toUpperCase()} ${l}` }); if (draft.base === id) o.selected = true; base.appendChild(o); });
    base.addEventListener('change', () => { draft.base = base.value; saveDraft(); });
    const picks = inspirationPicks();
    go = el('button', { class: 'dr-go', type: 'button', text: 'Send to Claude' }); go.addEventListener('click', submit);
    dlg.append(
      el('div', { class: 'dr-hd' }, [el('h2', { text: 'New design' }), el('button', { class: 'dr-x', type: 'button', 'aria-label': 'Close', text: '×', onclick: close })]),
      el('p', { class: 'dr-sub', text: 'Give your input, then send it. Claude builds it into this room and it appears here when ready.' }),
      el('div', { class: 'dr-bd' }, [
        el('div', { class: 'dr-row' }, [field('Starting point', base), field('Theme', chipGroup('theme', [['dark', 'Dark, light accents'], ['light', 'Light first'], ['both', 'Both']], false))]),
        field('Mood (pick any)', chipGroup('mood', MOODS.map(m => [m, m]), true)),
        field('Colours or references', input('palette', 'e.g. near black with one hot yellow; like Linear; hex codes welcome')),
        el('div', { class: 'dr-row' }, [field('Keep', input('keep', 'What to keep from the other designs', true)), field('Avoid', input('avoid', 'What to stay away from', true))]),
        SCREENS.length ? field('Screens (pick any, none means all)', chipGroup('screens', SCREENS, true)) : null,
        field('Anything else', input('notes', 'Copy, motion, one thing that must feel right', true)),
        picks.length ? el('p', { class: 'dr-sub', text: `${picks.length} inspiration pick${picks.length > 1 ? 's' : ''} from this browser will be attached.` }) : null,
      ].filter(Boolean)),
      el('div', { class: 'dr-ft' }, [el('small', { text: online ? 'Claude Code queue connected' : 'Room server not running. Ask Claude Code to start the room.' }), el('span', { class: 'sp' }), el('button', { class: 'dr-ghost', type: 'button', text: 'Clear', onclick: () => { draft = {}; saveDraft(); form(); } }), go]),
    );
    setTimeout(() => { const f = dlg.querySelector('select,input,textarea'); f && f.focus(); }, 40);
  }
  async function submit() {
    const body = { ...draft, inspiration: inspirationPicks(), room: ROOM };
    go.disabled = true; go.textContent = 'Sending…';
    let saved = null;
    try { const r = await fetch(API + '/requests', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); if (r.ok) saved = await r.json(); } catch (e) {}
    dlg.replaceChildren(el('div', { class: 'dr-hd' }, [el('h2', { text: saved ? 'Sent' : 'Request file saved' }), el('button', { class: 'dr-x', type: 'button', 'aria-label': 'Close', text: '×', onclick: close })]));
    if (saved) {
      dlg.appendChild(el('div', { class: 'dr-done' }, [el('p', { text: 'Queued. Claude Code picks it up within a few seconds, names it, and it shows up in the room when it is ready.' })]));
      draft = {}; saveDraft(); refresh();
    } else {
      dlg.appendChild(el('div', { class: 'dr-done' }, [el('p', { text: 'The room\'s local server is not running, so the request was not sent. Ask Claude Code to start the room and watch for requests, then send again.' })]));
      go.disabled = false;
    }
  }
  function open() { form(); ov.classList.add('show'); }
  function close() { ov.classList.remove('show'); btn.focus(); }
  btn.addEventListener('click', open);
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && ov.classList.contains('show')) close(); });

  // status list
  function renderList() {
    const recent = list.slice(-6).reverse();
    listBox.replaceChildren(...recent.map(r => el('div', { class: 'dr-item' }, [el('span', { class: 'dr-st ' + r.status, text: r.status }), el('b', { text: r.name || 'New design', title: r.name || 'New design' }), r.status === 'done' && r.result && r.result.dir ? el('a', { href: r.result.dir + '/index.html', target: '_blank', rel: 'noopener', text: 'Open' }) : null].filter(Boolean))));
  }
  async function refresh() {
    try { const r = await fetch(API + '/requests', { cache: 'no-store' }); if (!r.ok) throw 0; online = true; list = (await r.json()).requests || []; } catch (e) { online = false; }
    if (mount) renderList();
    if (list.some(r => r.status === 'done' && !r._seen)) document.dispatchEvent(new CustomEvent('design-requests', { detail: list }));
  }
  refresh(); setInterval(refresh, 5000);
})();
