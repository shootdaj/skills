/* Look navigator: the Ask panel. Claude answers questions about the design system ("which look should I use for a launch page?")
   through the site's own proxy route (/api/claude on here.now, key injected server side from the ANTHROPIC_API_KEY account variable;
   this page never holds a key). Claude can steer the app: open a look, try one on a page, compare two, blend two.
   Built from the report recipe's Ask panel (recipes/report/assets/starter/i-ask.js), cut down to what this app needs. */
(function () {
'use strict';
const D = document, Q = (s, r = D) => r.querySelector(s), QA = (s, r = D) => [...r.querySelectorAll(s)];
const E = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ic = n => `<svg class="i" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const HTTP = /^https?:$/.test(location.protocol);
const CFG = Object.assign({ model: 'claude-opus-5-5', route: '/api/claude', count: '/api/claude-count', maxTokens: 6000, maxHops: 5, costCap: 1.0, price: { in: 4, out: 20, cw: 5, cr: 0.2 } }, window.ASK_CONFIG || {});
const KEY = 'look-nav:ask';
const KEYLINE = 'In your here.now dashboard open Variables, add ANTHROPIC_API_KEY with allowed upstream api.anthropic.com, then reload this page.';

/* The context brief: the work behind this page, so Claude can say why it exists and how it was made. */
const CONTEXT = {
  project: { name: "Look navigator for Anshul's design system", links: [{ label: 'skills repo (design-flow)', url: 'https://github.com/shootdaj/skills/tree/master/skills/design-flow' }], goal: 'See, compare, try on and make design looks in one app, mostly used on his phone.' },
  why: { problem: "His design looks (design-flow's directions) were only text files. He needed a visual way to see them, pick one for a report, site or comparison page, and make new ones.", askedBy: 'Anshul, 2026-10-17, in a Claude Code session', quote: "yes do all that and also add a 'heat map' like a star graph (spiky graph) that shows the various attributes of each theme" },
  how: { sources: 'The look files in github.com/shootdaj/skills, skills/design-flow/directions/*.md, read live at load; judged scores in navigator/judged.json; demo pages in directions/<id>/demo.html where built', ran: 'Measured attributes (darkness, contrast, colourfulness, warmth, roundness, density) are computed in the page from each look file. Judged ones (boldness, playfulness, formality, motion) were scored by Claude from each look\'s prose and demo page.', where: 'In the browser; hosted on here.now', dates: 'Built 2026-10-17', tools: 'Plain HTML, CSS and JavaScript; OKLCH colour maths; View Transitions; this panel uses Claude Opus 5.5', notTested: 'Judged scores are opinions, not measurements. Blends and pins are starting points; their colours need checking before they become looks.' },
  decisions: { decided: 'The app itself wears the Obsidian spotlight look. New looks leave as a request for Claude; the page never writes files.', pending: 'Demo pages still being built for some looks.', yourCall: 'Pick a look for the page at hand, or ask for a new one.' },
  history: [{ date: '2026-10-17', change: 'First version: mood map, star graphs, look pages, try-on, compare, make, how-it-fits diagram, Ask.' }],
  glossary: 'not recorded'
};
const SYSTEM_MAP = `Anshul's design system, in plain words:
- Door: anshul-design (his personal profile: publish to here.now, dark by default, quick questions, never italic, his report rules). A second door, helix-design-anshul, serves AyaHelix work.
- Engine: design-flow. It infers what it can, asks the rest, offers an inspiration picker, builds one design or opens the design room for two or more, verifies with Playwright and publishes.
- Looks (directions/): one file per look with colours for dark and light, fonts, corner radius, density, best and avoid, a motion signature, forms and 3D. "best" and "avoid" decide which looks get offered for a page. To use one, he says "use <Look name>" to Claude.
- Recipes: report (title, lead statement, Your call strip, highlighted bullets, figures, Ask panel), bakeoff (pick elements across variants), flow3d (3D flow figure).
- UI standards: anshul-ui-standards-v2, how every page behaves whatever the look (44 px targets, focus, springs, theme toggle, verification).
- A finished page = look x recipe x standards. The design room compares built designs.
House rules that matter for picking: never italic; dark by default; reports open with a plain title and a lead statement, no stat tiles; Ink reads as an old terminal over long sessions, so offer it but do not default to it.`;
const INSTRUCTIONS = `You are the Ask panel inside Anshul's look navigator, a phone-friendly app for his design looks. He is visual and non-technical and hates walls of text.

How to answer:
- Two to five short sentences, or a short list. Plain words. Bold the one phrase that answers the question. No preamble, no em dashes.
- Recommend by name and say why in one line, tied to the look's "best" and "avoid", its mood and its star-graph numbers. When two looks fit, name both and the trade-off.
- Refer to a look as [[look:<id>]] (for example [[look:ink]]); the app turns it into a tappable chip. Use only ids from the data.
- When showing helps, call a tool: show_look to open one look, try_on to show it on his kind of page (report, site, compare), compare_looks to put two side by side, blend_looks to start a new look between two. Call at most one navigation tool per answer.
- Star-graph attributes are 0 to 10. Measured ones come from the look file; judged ones are Claude's opinion. Say "judged" when you lean on a judged number.
- Questions about why this app exists, how it was made or what is pending are answered from the brief. Where a field says "not recorded", say so.
- Never invent looks, numbers or features.

The data is JSON: brief, system (how the pieces fit), attributes (what each star-graph axis means), looks (every look with its numbers) and pages (the sample pages for try-on).`;
const TOOLS = [
  { name: 'show_look', description: 'Open one look\'s page in the app: its star graph, colours, fonts, best and avoid, and its demo.', input_schema: { type: 'object', properties: { id: { type: 'string', description: 'look id' } }, required: ['id'] } },
  { name: 'try_on', description: 'Show a look on one of his sample pages.', input_schema: { type: 'object', properties: { id: { type: 'string' }, page: { type: 'string', enum: ['report', 'site', 'compare'] } }, required: ['id'] } },
  { name: 'compare_looks', description: 'Put two looks side by side on the same page with both star graphs overlaid.', input_schema: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' }, page: { type: 'string', enum: ['report', 'site', 'compare'] } }, required: ['a', 'b'] } },
  { name: 'blend_looks', description: 'Open the maker with two looks blended; mix is 0 (all a) to 100 (all b).', input_schema: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' }, mix: { type: 'number' } }, required: ['a', 'b'] } }
];
function dataBlob() {
  const app = window.NavApp, looks = app ? app.data.looks : [];
  const A = window.NavData.ATTRS;
  return JSON.stringify({
    brief: CONTEXT, system: SYSTEM_MAP,
    attributes: A.map(a => ({ key: a.k, label: a.label, kind: a.kind, means: a.what })),
    looks: looks.map(l => ({ id: l.id, name: l.name, mood: l.mood, first: l.first, fonts: { display: l.fonts.display, body: l.fonts.body, mono: l.fonts.mono }, radius: l.radius, density: l.density, best: l.best, avoid: l.avoid,
      accent: { dark: l.dark.accent, light: l.light.accent }, background: { dark: l.dark.bg, light: l.light.bg }, motion: l.prose.motion, forms: l.prose.forms, threeD: l.prose.three, note: l.prose.note || undefined,
      scores: Object.fromEntries(A.filter(a => l.attrs[a.k]).map(a => [a.k, l.attrs[a.k].v])), judged: l.judged, demo: ((window.NAV_SNAPSHOT && window.NAV_SNAPSHOT.demos) || []).includes(l.id) })),
    pages: { report: 'a report opening: plain title, lead statement with highlights, Your call strip, four bullets, a bar figure', site: 'a site hero: nav, big display headline, two buttons, a product preview, three feature cards', compare: 'two-option comparison tabs with good, partly and missing marks' }
  });
}
function system() { return [{ type: 'text', text: INSTRUCTIONS }, { type: 'text', text: '<data>\n' + dataBlob() + '\n</data>', cache_control: { type: 'ephemeral' } }]; }
function readerState() { const s = window.NavApp ? window.NavApp.S : {}; return `Reader state: on the ${s.view || 'map'} view${s.look ? ', look ' + s.look : ''}${s.view === 'compare' ? ' vs ' + s.vs : ''}${s.page && (s.view === 'try' || s.view === 'compare') ? ', page ' + s.page : ''}; ${s.theme || 'dark'} theme; screen ${innerWidth}x${innerHeight}.`; }

/* ───────── thread ───────── */
let T = load(); let running = null, status = null;
function load() { try { const t = JSON.parse(localStorage.getItem(KEY) || 'null'); if (t && Array.isArray(t.api) && Array.isArray(t.view)) return t; } catch (e) {} return { api: [], view: [], cost: 0 }; }
function save() { try { localStorage.setItem(KEY, JSON.stringify(T)); } catch (e) {} }

/* ───────── panel ───────── */
const panel = Q('#ask');
panel.innerHTML = `<div class="ask-h"><span class="ask-t">${ic('spark')}<b>Ask about your looks</b></span><span class="ask-m">Opus 5.5</span><button class="ib" type="button" data-new aria-label="New thread" title="New thread">${ic('trash')}</button><button class="ib" type="button" data-close aria-label="Close">${ic('x')}</button></div>
<div class="ask-status" role="status"></div>
<div class="ask-log" aria-live="polite"></div>
<div class="ask-sugg chips"></div>
<form class="ask-f"><textarea rows="1" placeholder="Which look for a launch page?" aria-label="Your question"></textarea><button class="os-btn primary ask-send" type="submit">${ic('up')}<span>Send</span></button></form>`;
const log = Q('.ask-log', panel), ta = Q('textarea', panel), sendBtn = Q('.ask-send', panel), statusEl = Q('.ask-status', panel), sugg = Q('.ask-sugg', panel);
const SUGG = ['Which look should I use for a launch page?', 'Which looks are calm but colourful?', 'Ink or Swiss broadsheet for a tech doc?', 'Make me something between Plum and Toy blocks'];
sugg.innerHTML = SUGG.map(s => `<button class="chip" type="button">${E(s)}</button>`).join('');
sugg.onclick = e => { const b = e.target.closest('.chip'); if (b) { ta.value = b.textContent; send(); } };
const relayout = () => setTimeout(() => dispatchEvent(new Event('resize')), 30);
function open() { panel.hidden = false; D.body.classList.add('ask-open'); relayout(); requestAnimationFrame(() => panel.classList.add('on')); renderAll(); probe(); setTimeout(() => ta.focus(), 60); }
function close() { panel.classList.remove('on'); D.body.classList.remove('ask-open'); relayout(); setTimeout(() => { panel.hidden = true; }, 260); Q('#askBtn').focus(); }
Q('#askBtn').addEventListener('click', () => panel.hidden ? open() : close());
Q('[data-close]', panel).onclick = close;
Q('[data-new]', panel).onclick = () => { if (running) running.abort(); T = { api: [], view: [], cost: 0 }; save(); renderAll(); setStatus(status === 'cap' ? null : status); };
D.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) close(); });
Q('.ask-f', panel).addEventListener('submit', e => { e.preventDefault(); running ? running.abort() : send(); });
ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!running) send(); } });
ta.addEventListener('input', grow); function grow() { ta.style.height = 'auto'; ta.style.height = Math.min(140, ta.scrollHeight) + 'px'; }
log.addEventListener('click', e => { const c = e.target.closest('[data-look]'); if (c && window.NavApp) { window.NavApp.go({ view: 'look', look: c.dataset.look }); if (innerWidth < 900) close(); } });

function setStatus(s, extra) {
  status = s; const M = {
    local: ['warn', 'Preview copy', 'Answers need the published page, where Claude is reached through the site\'s /api/claude route. Everything else here works.'],
    nokey: ['bad', 'Claude key not set', KEYLINE + ' The page never holds the key.'],
    badkey: ['bad', 'Claude key rejected', 'here.now has ANTHROPIC_API_KEY, but Anthropic did not accept it. Replace it under Variables in the here.now dashboard.'],
    noroute: ['bad', 'Proxy route missing', 'This copy was published without .herenow/proxy.json, so /api/claude does not exist. Republish the folder with build.mjs.'],
    neterr: ['warn', 'Cannot reach Claude', extra || 'Check the connection and try again.'],
    cap: ['warn', 'This thread hit its cost cap', 'Start a new thread with the bin button above.']
  }[s];
  if (!M) { statusEl.className = 'ask-status'; statusEl.innerHTML = ''; ta.disabled = false; sendBtn.disabled = false; return; }
  statusEl.className = 'ask-status on ' + M[0]; statusEl.innerHTML = `<b>${E(M[1])}</b><span>${E(M[2])}</span>`;
  const block = ['nokey', 'badkey', 'noroute', 'cap'].includes(s); ta.disabled = block; sendBtn.disabled = block && !running;
}
async function classify(res) {
  let txt = ''; try { txt = await res.text(); } catch (e) {} let j = null; try { j = JSON.parse(txt); } catch (e) {}
  const msg = (j && j.error && (j.error.message || j.error)) || (j && j.message) || '';
  if (res.status === 401) return /required/i.test(msg) ? { s: 'nokey' } : (j && j.type === 'error') ? { s: 'badkey' } : { s: 'neterr', m: 'Sign in to this page first (here.now said 401).' };
  if (res.status === 404 && !(j && j.type === 'error')) return { s: 'noroute' };
  if (res.status === 429) return { s: 'neterr', m: 'Too many questions this hour from this network. Try again later.' };
  return { s: 'error', m: String(msg || txt.slice(0, 200) || 'HTTP ' + res.status), type: j && j.error && j.error.type, status: res.status };
}
let probed = false;
async function probe() {
  if (!HTTP) { setStatus('local'); return; } if (probed) return; probed = true;
  try { const r = await fetch(CFG.count, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: CFG.model, system: system(), tools: TOOLS, messages: [{ role: 'user', content: 'ping' }] }) });
    if (r.ok) { setStatus(T.cost >= CFG.costCap ? 'cap' : null); return; } const c = await classify(r); setStatus(c.s === 'error' ? null : c.s, c.m);
  } catch (e) { setStatus('neterr'); }
}

/* ───────── rendering: a tiny, safe markdown (escape first, then bold, code, lists, look chips) ───────── */
function md(src) {
  const looks = window.NavApp ? window.NavApp.data.looks : [];
  const inline = s => E(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[\[look:([a-z0-9-]+)\]\]/gi, (m, id) => { const L = looks.find(l => l.id === id.toLowerCase()); return L ? `<button class="ask-look" type="button" data-look="${E(L.id)}"><i style="background:${E(L[(window.NavApp.S.theme)].accent)}"></i>${E(L.name)}</button>` : ''; });
  const out = []; let list = null;
  for (const raw of String(src || '').split('\n')) {
    const line = raw.trimEnd(); const m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (m) { if (!list) { list = /^\s*\d/.test(line) ? 'ol' : 'ul'; out.push(`<${list}>`); } out.push(`<li>${inline(m[1])}</li>`); continue; }
    if (list) { out.push(`</${list}>`); list = null; }
    if (/^#{1,4}\s+/.test(line)) out.push(`<p><strong>${inline(line.replace(/^#+\s+/, ''))}</strong></p>`); else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  if (list) out.push(`</${list}>`);
  return out.join('');
}
function bubble(v) {
  if (v.role === 'user') return `<div class="msg u"><p>${E(v.text)}</p></div>`;
  return `<div class="msg a">${v.parts.map(p => p.t === 'text' ? md(p.md) : p.t === 'act' ? `<div class="act">${ic(p.icon || 'spark')}<span>${E(p.label)}</span></div>` : `<div class="note${p.bad ? ' bad' : ''}">${E(p.text)}</div>`).join('')}${v.cost != null ? `<div class="cost">${v.cost < 0.01 ? 'under $0.01' : '$' + v.cost.toFixed(3)}</div>` : ''}</div>`;
}
function renderAll() {
  log.innerHTML = T.view.length ? T.view.map(bubble).join('') : `<div class="ask-empty"><b>Ask anything about your looks.</b><span>Which one fits a page, how two differ, or what a new one between two would be like. Claude can open looks and comparisons for you.</span></div>`;
  sugg.style.display = T.view.length ? 'none' : ''; log.scrollTop = log.scrollHeight;
}

/* ───────── Messages API through the proxy, streamed ───────── */
async function stream(body, signal, onText) {
  const res = await fetch(CFG.route, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'text/event-stream' }, body: JSON.stringify(body), signal });
  if (!res.ok) { const c = await classify(res); const err = new Error(c.m || c.s); err.c = c; throw err; }
  const blocks = []; let usage = {}, stop = null; const rd = res.body.getReader(), dec = new TextDecoder(); let buf = '';
  const handle = j => {
    const t = j.type;
    if (t === 'message_start') usage = Object.assign({}, j.message.usage || {});
    else if (t === 'content_block_start') { const b = Object.assign({}, j.content_block); if (b.type === 'tool_use') b._json = ''; if (b.type === 'text' && b.text == null) b.text = ''; if (b.type === 'thinking' && b.thinking == null) b.thinking = ''; blocks[j.index] = b; }
    else if (t === 'content_block_delta') { const b = blocks[j.index], d = j.delta || {}; if (!b) return; if (d.type === 'text_delta') { b.text += d.text; onText(blocks); } else if (d.type === 'thinking_delta') b.thinking += d.thinking; else if (d.type === 'signature_delta') b.signature = (b.signature || '') + d.signature; else if (d.type === 'input_json_delta') b._json += d.partial_json; }
    else if (t === 'content_block_stop') { const b = blocks[j.index]; if (b && b.type === 'tool_use') { try { b.input = b._json ? JSON.parse(b._json) : (b.input || {}); } catch (e) { b.input = {}; } delete b._json; } }
    else if (t === 'message_delta') { if (j.delta) stop = j.delta.stop_reason || stop; if (j.usage) for (const k in j.usage) if (j.usage[k] != null) usage[k] = j.usage[k]; }
    else if (t === 'error') { const e = new Error((j.error && j.error.message) || 'stream error'); e.c = { s: 'error', type: j.error && j.error.type }; throw e; }
  };
  for (;;) { const { done, value } = await rd.read(); if (done) break; buf += dec.decode(value, { stream: true }).replace(/\r\n/g, '\n'); let i;
    while ((i = buf.indexOf('\n\n')) >= 0) { const raw = buf.slice(0, i); buf = buf.slice(i + 2); let data = ''; for (const l of raw.split('\n')) if (l.startsWith('data:')) data += l.slice(5).replace(/^ /, ''); if (!data) continue; let j; try { j = JSON.parse(data); } catch (e) { continue; } handle(j); } }
  return { blocks: blocks.filter(Boolean), usage, stop };
}
const echo = blocks => blocks.filter(b => ['thinking', 'redacted_thinking', 'text', 'tool_use'].includes(b.type) && !(b.type === 'text' && !b.text)).map(b => { const o = Object.assign({}, b); delete o._json; if (o.type === 'text' && o.citations == null) delete o.citations; return o; });
const costOf = u => ((u.input_tokens || 0) * CFG.price.in + (u.cache_creation_input_tokens || 0) * CFG.price.cw + (u.cache_read_input_tokens || 0) * CFG.price.cr + (u.output_tokens || 0) * CFG.price.out) / 1e6;
function runTool(b) {
  const app = window.NavApp, r = id => app && app.resolve(id); const i = b.input || {};
  try {
    if (b.name === 'show_look') { const L = r(i.id); if (!L) return [{ t: 'note', bad: true, text: 'No look called ' + i.id }, 'No look with id ' + i.id, true]; app.go({ view: 'look', look: L.id }); return [{ t: 'act', icon: 'map', label: 'Opened ' + L.name }, 'Showing ' + L.name + '.']; }
    if (b.name === 'try_on') { const L = r(i.id); if (!L) return [{ t: 'note', bad: true, text: 'No look called ' + i.id }, 'No look with id ' + i.id, true]; const page = ['report', 'site', 'compare'].includes(i.page) ? i.page : 'report'; app.go({ view: 'try', look: L.id, page }); return [{ t: 'act', icon: 'shirt', label: `Trying ${L.name} on the ${page} page` }, `Showing ${L.name} on the ${page} page.`]; }
    if (b.name === 'compare_looks') { const A = r(i.a), B = r(i.b); if (!A || !B) return [{ t: 'note', bad: true, text: 'Unknown look' }, 'Unknown look id', true]; app.go({ view: 'compare', look: A.id, vs: B.id, page: ['report', 'site', 'compare'].includes(i.page) ? i.page : app.S.page }); return [{ t: 'act', icon: 'cols', label: `Comparing ${A.name} and ${B.name}` }, `Showing ${A.name} next to ${B.name}.`]; }
    if (b.name === 'blend_looks') { const A = r(i.a), B = r(i.b); if (!A || !B) return [{ t: 'note', bad: true, text: 'Unknown look' }, 'Unknown look id', true]; const mix = Math.max(0, Math.min(100, Math.round(+i.mix || 50))); app.go({ view: 'make', mode: 'blend', look: A.id, vs: B.id, mix, name: '' }); return [{ t: 'act', icon: 'blend', label: `Blending ${A.name} and ${B.name} at ${mix}%` }, `Opened the maker with ${A.name} and ${B.name} at ${mix}%.`]; }
  } catch (e) { return [{ t: 'note', bad: true, text: e.message }, e.message, true]; }
  return [{ t: 'note', bad: true, text: 'Unknown tool' }, 'Unknown tool', true];
}
async function send() {
  const text = ta.value.trim(); if (!text || running) return;
  if (!HTTP) { setStatus('local'); T.view.push({ role: 'user', text }, { role: 'bot', parts: [{ t: 'note', text: 'This is a local preview, so nothing was sent. Open the published page to ask Claude.' }] }); renderAll(); ta.value = ''; return; }
  if (['nokey', 'badkey', 'noroute', 'cap'].includes(status)) return;
  ta.value = ''; grow();
  const mark = T.api.length; T.api.push({ role: 'user', content: [{ type: 'text', text: readerState() }, { type: 'text', text }] });
  T.view.push({ role: 'user', text }); const bv = { role: 'bot', parts: [] }; T.view.push(bv); renderAll();
  const live = log.lastElementChild; running = new AbortController(); sendBtn.innerHTML = ic('stop') + '<span>Stop</span>';
  let cost = 0, ok = false;
  try {
    for (let hop = 0; hop < CFG.maxHops; hop++) {
      const body = { model: CFG.model, max_tokens: CFG.maxTokens, stream: true, system: system(), tools: TOOLS, cache_control: { type: 'ephemeral' }, output_config: { effort: 'medium' }, messages: T.api };
      const base = bv.parts.length;
      const r = await stream(body, running.signal, blocks => { bv.parts.length = base; blocks.forEach(b => { if (b && b.type === 'text') bv.parts.push({ t: 'text', md: b.text }); }); live.innerHTML = bubble(bv).replace(/^<div class="msg a">|<\/div>$/g, ''); log.scrollTop = log.scrollHeight; });
      bv.parts.length = base; r.blocks.forEach(b => { if (b.type === 'text' && b.text) bv.parts.push({ t: 'text', md: b.text }); });
      cost += costOf(r.usage);
      T.api.push({ role: 'assistant', content: echo(r.blocks) });
      if (r.stop === 'refusal') { bv.parts.push({ t: 'note', bad: true, text: 'Claude declined this one. Try rewording it.' }); break; }
      if (r.stop !== 'tool_use') { ok = true; break; }
      const results = []; for (const b of r.blocks.filter(x => x.type === 'tool_use')) { const [act, out, err] = runTool(b); bv.parts.push(act); results.push(Object.assign({ type: 'tool_result', tool_use_id: b.id, content: out }, err ? { is_error: true } : {})); }
      T.api.push({ role: 'user', content: results }); live.innerHTML = bubble(bv).replace(/^<div class="msg a">|<\/div>$/g, '');
      if (hop === CFG.maxHops - 1) { bv.parts.push({ t: 'note', text: 'Stopped after a few steps.' }); }
    }
  } catch (e) {
    T.api.length = mark;
    if (e.name === 'AbortError') bv.parts.push({ t: 'note', text: 'Stopped. This question was not kept.' });
    else { const c = e.c || {}; if (['nokey', 'badkey', 'noroute', 'neterr'].includes(c.s)) setStatus(c.s, c.m); bv.parts.push({ t: 'note', bad: true, text: c.s === 'nokey' ? 'Claude key not set, so nothing was sent.' : c.s === 'badkey' ? 'Anthropic rejected the key.' : c.s === 'noroute' ? 'The proxy route is missing on this copy.' : c.s === 'neterr' ? (c.m || 'Could not reach Claude.') : (c.type === 'overloaded_error' || c.status >= 500 ? 'Claude is busy right now. Try again in a moment.' : 'Something went wrong: ' + e.message) }); }
  } finally { running = null; sendBtn.innerHTML = ic('up') + '<span>Send</span>'; }
  if (!ok && T.api.length > mark && T.api[T.api.length - 1].role !== 'assistant') T.api.length = mark;
  bv.cost = cost; T.cost += cost; save(); renderAll(); if (T.cost >= CFG.costCap) setStatus('cap');
}
window.__askPanel = { open, close, md, system, CONTEXT };
})();
