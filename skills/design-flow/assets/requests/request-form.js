/* design-flow "New design" request form. Drop into any design room:
   <script src="request-form.js" data-api="http://127.0.0.1:7333" data-room="My room"
           data-bases="d1:Hearth,d2:Tidewater" data-screens="welcome:Welcome,path:Path"></script>
   Mounts into an element with [data-new-design] if the page has one, else shows a floating button.
   Claude Code only: saves the request in this page's localStorage (key design-requests). The Claude Code session that opened this
   window with browser-watch.mjs reads it from the page and writes status back. No server, no network calls.
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
  .dr-btn{min-height:44px;padding:0 16px;border-radius:999px;border:1px dashed var(--line2,rgba(255,255,255,.25));background:transparent;color:var(--txt,#eee);font-weight:600;font-size:14px;line-height:1;display:inline-flex;align-items:center;gap:8px;cursor:pointer;width:100%;justify-content:center;transition:transform .25s cubic-bezier(.34,1.56,.64,1),border-color .15s,background .15s}
  .dr-btn:hover{transform:translateY(-2px);border-color:var(--acc,#FFD400);background:color-mix(in srgb,var(--acc,#FFD400) 8%,transparent)}
  .dr-btn:active{transform:scale(.97)}
  .dr-fab{position:fixed;left:16px;bottom:16px;z-index:2147482000;width:auto;border-style:solid;background:var(--acc,#FFD400);color:var(--on-acc,#141518);border-color:transparent;box-shadow:0 12px 30px -12px rgba(0,0,0,.6)}
  .dr-plus{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;background:var(--acc,#FFD400);color:var(--on-acc,#141518);font:700 15px/1 system-ui}
  .dr-fab .dr-plus{background:rgba(0,0,0,.12);color:inherit}
  .dr-list{display:grid;gap:6px;margin-top:8px}
  .dr-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:var(--s2,#1d2025);border:1px solid var(--line,rgba(255,255,255,.1));font-weight:500;font-size:13px;line-height:1.3;color:var(--txt,#eee)}
  .dr-item b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
  .dr-item a{color:var(--acc,#FFD400);font-weight:600;text-decoration:none;min-height:32px;display:inline-flex;align-items:center}
  .dr-item{flex-wrap:wrap;cursor:pointer;transition:border-color .15s}.dr-item:hover{border-color:var(--line2,rgba(255,255,255,.25))}
  .dr-item .dr-pl{flex-basis:100%;font-size:12.5px;color:var(--txt2,#aaa);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .dr-bar{flex-basis:100%;height:4px;border-radius:9px;background:var(--s3,rgba(255,255,255,.08));overflow:hidden}.dr-bar i{display:block;height:100%;background:var(--acc,#FFD400);border-radius:9px;transition:width .6s cubic-bezier(.2,.7,.1,1)}
  .dr-log{list-style:none;margin:0;padding:0 20px 18px;display:grid;gap:10px}.dr-log li{display:grid;grid-template-columns:64px 1fr;gap:10px;font-size:14px}.dr-log time{font:500 12px/1.6 ui-monospace,monospace;color:var(--txt2,#aaa)}
  .dr-st{font:600 11.5px/1 ui-monospace,monospace;letter-spacing:.04em;text-transform:uppercase;padding:4px 7px;border-radius:999px;border:1px solid currentColor}
  .dr-st.pending{color:var(--txt2,#aaa)} .dr-st.building{color:#FFB347;animation:dr-pulse 1.6s ease-in-out infinite} .dr-st.done{color:#5CD68A} .dr-st.failed{color:#FF6B6B}
  @keyframes dr-pulse{50%{opacity:.45}}
  .dr-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(6,6,8,.72);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:18px}
  .dr-ov.show{display:flex;animation:dr-fade .18s}@keyframes dr-fade{from{opacity:0}}
  .dr-dlg{width:min(640px,100%);max-height:calc(100vh - 36px);overflow:auto;background:var(--s1,#16181c);color:var(--txt,#eee);border:1px solid var(--line2,rgba(255,255,255,.18));border-radius:18px;box-shadow:0 30px 80px -30px rgba(0,0,0,.8);animation:dr-rise .3s cubic-bezier(.2,.7,.1,1)}
  @keyframes dr-rise{from{opacity:0;transform:translateY(14px) scale(.98)}}
  .dr-hd{display:flex;align-items:center;gap:12px;padding:18px 20px 6px}.dr-dlg .dr-hd h2{margin:0;font-weight:700;font-size:21px;line-height:1.2;flex:1;text-transform:none;letter-spacing:0;color:inherit}
  .dr-x{width:44px;height:44px;border-radius:50%;border:1px solid var(--line2,rgba(255,255,255,.18));background:transparent;color:inherit;cursor:pointer;font-size:18px}
  .dr-sub{padding:0 20px;color:var(--txt2,#aaa);font-size:13.5px}
  .dr-bd{padding:12px 20px 4px;display:grid;gap:14px}
  .dr-f label{display:block;font-weight:600;font-size:12.5px;line-height:1.2;letter-spacing:.04em;text-transform:uppercase;color:var(--txt2,#aaa);margin-bottom:6px}
  .dr-f input[type=text],.dr-f textarea,.dr-f select{width:100%;min-height:44px;border-radius:12px;border:1px solid var(--line2,rgba(255,255,255,.18));background:var(--s2,#1d2025);color:var(--txt,#eee);padding:10px 12px;font:inherit;font-size:14px}
  .dr-f textarea{min-height:76px;resize:vertical}
  .dr-f input:focus,.dr-f textarea:focus,.dr-f select:focus{outline:2px solid var(--acc,#FFD400);outline-offset:1px}
  .dr-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .dr-chips{display:flex;flex-wrap:wrap;gap:6px}
  .dr-chip{min-height:38px;padding:0 13px;border-radius:999px;border:1px solid var(--line2,rgba(255,255,255,.18));background:transparent;color:inherit;cursor:pointer;font-weight:500;font-size:13px;transition:transform .2s cubic-bezier(.34,1.56,.64,1),background .15s}
  .dr-chip:hover{transform:translateY(-2px)}.dr-chip[aria-pressed=true]{background:var(--acc,#FFD400);color:var(--on-acc,#141518);border-color:transparent}
  .dr-mode{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 20px 0}
  .dr-mode button{min-height:64px;border-radius:14px;border:1px solid var(--line2,rgba(255,255,255,.18));background:var(--s2,#1d2025);color:inherit;cursor:pointer;text-align:left;padding:10px 14px;display:grid;gap:2px;transition:transform .25s cubic-bezier(.34,1.56,.64,1),border-color .15s}
  .dr-mode button b{font-weight:700;font-size:15px}.dr-mode button span{font-size:12.5px;color:var(--txt2,#aaa)}
  .dr-mode button:hover{transform:translateY(-2px)}.dr-mode button[aria-pressed=true]{border-color:var(--acc,#FFD400);box-shadow:0 0 0 1px var(--acc,#FFD400) inset}
  .dr-auto{padding:16px 20px 4px;display:grid;gap:10px;color:var(--txt2,#aaa);font-size:14px}
  .dr-ft{position:sticky;bottom:0;display:flex;align-items:center;gap:10px;padding:14px 20px 18px;flex-wrap:wrap;background:var(--s1,#16181c);border-top:1px solid var(--line,rgba(255,255,255,.1))}.dr-ft .sp{flex:1}
  .dr-ft small{color:var(--txt2,#aaa);font-size:12.5px}
  .dr-go{min-height:44px;padding:0 18px;border-radius:999px;border:0;background:var(--acc,#FFD400);color:var(--on-acc,#141518);font-weight:700;font-size:14px;cursor:pointer;transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
  .dr-go:hover{transform:translateY(-2px)}.dr-go:active{transform:scale(.96)}.dr-go[disabled]{opacity:.5;cursor:not-allowed;transform:none}
  .dr-ghost{min-height:44px;padding:0 16px;border-radius:999px;border:1px solid var(--line2,rgba(255,255,255,.18));background:transparent;color:inherit;font-weight:600;font-size:14px;cursor:pointer}
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
    const mode = draft.mode || 'auto';
    const modeBtn = (id, t, d) => el('button', { type: 'button', 'aria-pressed': String(mode === id), onclick: () => { draft.mode = id; saveDraft(); form(); } }, [el('b', { text: t }), el('span', { text: d })]);
    const header = [
      el('div', { class: 'dr-hd' }, [el('h2', { text: 'New design' }), el('button', { class: 'dr-x', type: 'button', 'aria-label': 'Close', text: '×', onclick: close })]),
      el('div', { class: 'dr-mode', role: 'group', 'aria-label': 'How to make it' }, [modeBtn('auto', 'Auto', 'Claude picks a direction unlike the others'), modeBtn('guided', 'Guided', 'You give the input first')]),
    ];
    if (mode === 'auto') {
      const theme = chipGroup('theme', [['dark', 'Dark, light accents'], ['light', 'Light first'], ['both', 'Either']], false);
      go.textContent = 'Surprise me';
      dlg.append(...header,
        el('div', { class: 'dr-auto' }, [el('p', { text: 'Claude looks at every design already in this room and builds one that shares nothing with them: new palette, type, layout and motion.' }), field('Theme (optional)', theme), picks.length ? el('p', { text: `${picks.length} inspiration pick${picks.length > 1 ? 's' : ''} from this browser will be used as a nudge.` }) : null].filter(Boolean)),
        el('div', { class: 'dr-ft' }, [el('small', { text: online ? 'Claude Code is watching this window' : 'Not watched. Ask Claude Code to open the room and watch.' }), el('span', { class: 'sp' }), go]));
      setTimeout(() => go.focus(), 40); return;
    }
    dlg.append(...header,
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
      el('div', { class: 'dr-ft' }, [el('small', { text: online ? 'Claude Code is watching this window' : 'Not watched. Ask Claude Code to open the room and watch.' }), el('span', { class: 'sp' }), el('button', { class: 'dr-ghost', type: 'button', text: 'Clear', onclick: () => { draft = {}; saveDraft(); form(); } }), go]),
    );
    setTimeout(() => { const f = dlg.querySelector('select,input,textarea'); f && f.focus(); }, 40);
  }
  const QKEY = 'design-requests';
  const readQ = () => { try { return JSON.parse(localStorage.getItem(QKEY) || '[]'); } catch (e) { return []; } };
  const writeQ = q => { try { localStorage.setItem(QKEY, JSON.stringify(q)); } catch (e) {} };
  function submit() {
    const body = draft.mode === 'guided' ? { ...draft, inspiration: inspirationPicks() } : { mode: 'auto', theme: draft.theme, inspiration: inspirationPicks() };
    if (!body.mode) body.mode = 'guided';
    const now = new Date(); const id = now.toISOString().replace(/[-:T]/g, '').slice(0, 14).replace(/(\d{8})(\d{6})/, '$1-$2') + '-' + Math.random().toString(36).slice(2, 6);
    const req = { ...body, id, name: 'New design', status: 'pending', room: ROOM, created: now.toISOString(), updated: now.toISOString() };
    const q = readQ(); q.push(req); writeQ(q);
    const watched = !!window.__designFlowWatcher;
    dlg.replaceChildren(el('div', { class: 'dr-hd' }, [el('h2', { text: watched ? 'Sent' : 'Saved' }), el('button', { class: 'dr-x', type: 'button', 'aria-label': 'Close', text: '×', onclick: close })]),
      el('div', { class: 'dr-done' }, [el('p', { text: watched ? 'Claude Code is watching this window and picks it up within a few seconds. It shows up in the rail when it is ready.' : 'Saved in this browser. Claude Code only sees it in the window it opened for the room, so ask Claude Code to open the room and watch.' })]));
    draft = { mode: draft.mode, theme: draft.theme }; saveDraft(); refresh();
  }
  function open() { logId = null; form(); ov.classList.add('show'); }
  function close() { ov.classList.remove('show'); btn.focus(); }
  btn.addEventListener('click', open);
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && ov.classList.contains('show')) close(); });

  // status list
  function renderList() {
    const recent = list.slice(-6).reverse();
    listBox.replaceChildren(...recent.map(r => {
      const pct = r.status === 'done' ? 100 : (r.percent || (r.status === 'building' ? 5 : 0));
      const last = (r.progress || []).slice(-1)[0];
      const line = r.status === 'done' ? ((r.result && r.result.message) || 'Ready in the room') : r.status === 'failed' ? ((r.result && r.result.message) || 'Failed') : (last ? last.msg : (r.status === 'pending' ? 'Waiting for Claude Code' : 'Starting'));
      const item = el('div', { class: 'dr-item', role: 'button', tabindex: '0', 'aria-label': (r.name || 'New design') + ', ' + r.status + ', ' + pct + ' percent' }, [
        el('span', { class: 'dr-st ' + r.status, text: r.stage && r.status === 'building' ? r.stage : r.status }),
        el('b', { text: r.name || 'New design', title: r.name || 'New design' }),
        r.status === 'done' && r.result && r.result.dir ? el('a', { href: r.result.dir + '/index.html', target: '_blank', rel: 'noopener', text: 'Open', onclick: e => e.stopPropagation() }) : null,
        el('div', { class: 'dr-bar' }, [el('i', { style: 'width:' + pct + '%' })]),
        el('span', { class: 'dr-pl', text: line }),
      ].filter(Boolean));
      const show = () => showLog(r.id); item.addEventListener('click', show); item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
      return item;
    }));
    if (logId && ov.classList.contains('show')) renderLog();
  }
  let logId = null;
  function showLog(id) { logId = id; renderLog(); ov.classList.add('show'); }
  function renderLog() {
    const r = list.find(x => x.id === logId); if (!r) return;
    const pct = r.status === 'done' ? 100 : (r.percent || 0);
    const items = (r.progress || []).map(p => el('li', {}, [el('time', { text: (p.t || '').slice(11, 16) }), el('span', { text: p.msg })]));
    if (!items.length) items.push(el('li', {}, [el('time', { text: (r.created || '').slice(11, 16) }), el('span', { text: r.status === 'pending' ? 'Waiting for Claude Code to pick this up.' : 'Claude Code has started.' })]));
    dlg.replaceChildren(
      el('div', { class: 'dr-hd' }, [el('h2', { text: r.name || 'New design' }), el('button', { class: 'dr-x', type: 'button', 'aria-label': 'Close', text: '×', onclick: () => { logId = null; close(); } })]),
      el('p', { class: 'dr-sub', text: (r.mode === 'auto' ? 'Auto' : 'Guided') + ' · ' + r.status + (r.stage ? ' · ' + r.stage : '') + ' · ' + pct + '%' }),
      el('div', { style: 'padding:10px 20px 14px' }, [el('div', { class: 'dr-bar' }, [el('i', { style: 'width:' + pct + '%' })])]),
      el('ol', { class: 'dr-log', 'aria-live': 'polite' }, items),
      r.status === 'done' && r.result && r.result.dir ? el('div', { class: 'dr-ft' }, [el('span', { class: 'sp' }), el('a', { class: 'dr-go', href: r.result.dir + '/index.html', target: '_blank', rel: 'noopener', text: 'Open design', style: 'display:inline-flex;align-items:center;text-decoration:none' })]) : null,
    );
  }

  function refresh() {
    online = !!window.__designFlowWatcher; list = readQ();
    if (mount) renderList();
    const done = list.filter(r => r.status === 'done' && !r.announced);
    if (done.length) { done.forEach(r => r.announced = true); writeQ(list); document.dispatchEvent(new CustomEvent('design-requests', { detail: list })); }
  }
  addEventListener('storage', e => { if (e.key === QKEY) refresh(); });
  refresh(); setInterval(refresh, 2000);
})();
