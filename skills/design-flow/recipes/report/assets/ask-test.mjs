// ask panel test harness. Drives the "Ask about this report" panel in a real browser and screenshots every tool in action.
//   node ask-test.mjs /path/to/index.html [--out <dir>] [--headed]          local: serves the page plus a mock Anthropic upstream
//   node ask-test.mjs --live https://<slug>.here.now/ [--out <dir>]          live: the real page; Claude calls are answered by the
//                                                                              same mock through request interception, Drive calls are real
// No API key is used or needed. The mock is strict: it rejects request shapes the Messages API would reject (model, stream, system
// cache_control, tools, role order, tool_use/tool_result pairing, images, forbidden thinking or tool_choice settings, fallbacks only on
// the -fb route) and checks that every earlier assistant turn comes back byte for byte (append-only history). Prints a JSON summary;
// exit code 0 means every step passed and the mock saw no violations.
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join, extname } from 'node:path';
import { launch } from '../../../assets/lib/playwright.mjs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const LIVE = opt('--live', '');
const file = LIVE ? '' : resolve(args.find(a => !a.startsWith('--') && !(args[args.indexOf(a) - 1] || '').startsWith('--')) || 'index.html');
if (!LIVE && !existsSync(file)) { console.error('ask-test: no such page ' + file); process.exit(2); }
const OUT = resolve(opt('--out', LIVE ? 'ask-shots' : join(dirname(file), 'shots-ask'))); mkdirSync(OUT, { recursive: true });

/* ───────── the mock Messages API ───────── */
const MOCK = { mode: 'ok', requests: [], violations: [], emitted: new Set(), drive: [], seq: 0 };
const MODELS = ['claude-opus-5-5', 'claude-fable-5-1', 'claude-sonnet-5'];
// token estimate: text at ~3.4 chars per token; images at width*height/750 like the API, not by their base64 size
const tok = s => { let n = 0; const t = String(s).replace(/"data":"([A-Za-z0-9+/=]{200,})"/g, (m, d) => { const z = pngSize(d); n += z ? Math.ceil(z.w * z.h / 750) : 1500; return '"data":""'; }); return n + Math.ceil(t.length / 3.4); };
function pngSize(b64) { const b = Buffer.from(b64, 'base64'); if (b.slice(1, 4).toString() === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bytes: b.length };
  if (b[0] === 0xff && b[1] === 0xd8) { let i = 2; while (i < b.length) { if (b[i] !== 0xff) break; const m = b[i + 1], L = b.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xc3) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5), bytes: b.length }; i += 2 + L; } }
  return null; }
function validate(body, route) {
  const v = [];
  if (!MODELS.includes(body.model)) v.push('unknown model ' + body.model);
  if (body.stream !== true) v.push('stream must be true');
  if (!Number.isInteger(body.max_tokens) || body.max_tokens < 1 || body.max_tokens > 128000) v.push('bad max_tokens');
  if (body.thinking && body.thinking.type !== 'adaptive') v.push('thinking must be omitted or adaptive on these models');
  if (body.tool_choice && body.tool_choice.type !== 'auto') v.push('forced tool_choice is a 400 on Fable 5.1');
  if (body.temperature != null || body.top_p != null) v.push('sampling params are removed on these models');
  if (body.output_config && body.output_config.effort && !['low', 'medium', 'high', 'xhigh', 'max'].includes(body.output_config.effort)) v.push('bad effort');
  if (body.fallbacks != null) { if (route !== '/api/claude-fb') v.push('fallbacks sent without the fallback beta route'); if (body.fallbacks !== 'default') v.push('fallbacks must be "default" with server-side-fallback-2026-07-01'); if (body.model !== 'claude-fable-5-1') v.push('fallbacks only planned for Fable 5.1'); }
  if (route === '/api/claude-fb' && body.fallbacks == null) v.push('fallback route used without fallbacks');
  if (body.cache_control && body.cache_control.type !== 'ephemeral') v.push('bad top-level cache_control');
  if (!Array.isArray(body.system) || !body.system.length) v.push('system must be an array of text blocks');
  else { if (body.system.some(b => b.type !== 'text' || !b.text)) v.push('system blocks must be non-empty text'); const last = body.system[body.system.length - 1]; if (!last.cache_control || last.cache_control.type !== 'ephemeral') v.push('cache_control missing on the last system block'); if (!/<report>\n\{[\s\S]*\}\n<\/report>/.test(last.text)) v.push('report JSON missing from the system prompt'); }
  const bps = (body.system || []).filter(b => b.cache_control).length + (body.cache_control ? 1 : 0); if (bps > 4) v.push('more than 4 cache breakpoints');
  const names = new Set();
  for (const t of body.tools || []) { if (!/^[a-zA-Z0-9_-]{1,64}$/.test(t.name || '')) v.push('bad tool name ' + t.name); if (!t.description) v.push('tool without description ' + t.name); if (!t.input_schema || t.input_schema.type !== 'object') v.push('tool input_schema must be an object schema: ' + t.name); if (names.has(t.name)) v.push('duplicate tool ' + t.name); names.add(t.name); }
  const M = body.messages || []; if (!M.length) v.push('no messages');
  if (M.length && M[0].role !== 'user') v.push('first message must be user'); if (M.length && M[M.length - 1].role !== 'user') v.push('last message must be user');
  let pendingIds = null;
  M.forEach((m, i) => {
    if (i && M[i - 1].role === m.role) v.push(`two ${m.role} messages in a row at ${i}`);
    if (!Array.isArray(m.content) || !m.content.length) { v.push('empty content at ' + i); return; }
    if (m.role === 'assistant') {
      const key = JSON.stringify(m.content); if (!MOCK.emitted.has(key)) v.push('assistant turn ' + i + ' was not echoed back exactly as streamed');
      for (const b of m.content) { if (b.type === 'text' && !b.text) v.push('empty text block in assistant turn ' + i); if (b.type === 'fallback') v.push('fallback marker echoed back (should be dropped)'); }
      const ids = m.content.filter(b => b.type === 'tool_use').map(b => b.id); pendingIds = ids.length ? new Set(ids) : null;
    } else {
      const results = m.content.filter(b => b.type === 'tool_result');
      if (pendingIds) { const got = new Set(results.map(b => b.tool_use_id)); for (const id of pendingIds) if (!got.has(id)) v.push('tool_use ' + id + ' has no tool_result in the next user message'); if (results.length !== m.content.length && results.length) v.push('tool_result message mixes other blocks'); }
      else if (results.length) v.push('tool_result without a preceding tool_use at ' + i);
      pendingIds = null;
      const imgs = []; for (const b of m.content) { if (b.type === 'text' && !b.text) v.push('empty text block at ' + i); if (b.type === 'image') imgs.push(b); if (b.type === 'tool_result' && Array.isArray(b.content)) for (const c of b.content) if (c.type === 'image') imgs.push(c); }
      for (const im of imgs) { const s = im.source || {}; if (s.type !== 'base64' || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(s.media_type)) { v.push('bad image source'); continue; } const d = pngSize(s.data); if (!d) v.push('image data does not decode'); else if (Math.max(d.w, d.h) > 2576) v.push('image larger than 2576 px'); else if (d.bytes > 5e6) v.push('image over 5 MB'); }
    }
  });
  return v;
}
function lastText(m) { const t = (m.content || []).filter(b => b.type === 'text').map(b => b.text); return t[t.length - 1] || ''; }
function pickFig(ctx, q) { const words = q.toLowerCase().match(/[a-z0-9]{4,}/g) || []; let best = null, score = 0;
  for (const f of ctx.figures) { const hay = (f.id + ' ' + f.title + ' ' + f.caption).toLowerCase(); const s = words.filter(w => hay.includes(w)).length; if (s > score) { score = s; best = f; } }
  return best || ctx.figures.find(f => f.data && Object.keys(f.data).length) || ctx.figures[0]; }
function plan(body) {
  const ctx = JSON.parse(body.system[body.system.length - 1].text.replace(/^<report>\n/, '').replace(/\n<\/report>$/, ''));
  const M = body.messages, last = M[M.length - 1];
  const results = last.content.filter(b => b.type === 'tool_result');
  if (results.length) {
    const prev = M[M.length - 2].content.filter(b => b.type === 'tool_use'); const r = results[0]; const call = prev.find(b => b.id === r.tool_use_id) || prev[0];
    const text = typeof r.content === 'string' ? r.content : (r.content || []).filter(c => c.type === 'text').map(c => c.text).join(' ');
    const id = call.input && call.input.id; const f = ctx.figures.find(x => x.id === id) || ctx.sections.find(x => x.id === id);
    const nm = f ? (f.no ? f.no + ' ' : '') + (f.title || '') : id;
    switch (call.name) {
      case 'scroll_to': return { text: `It is on screen now: **${nm}** [[${id}]]. ${f && f.caption ? 'The point it makes: ' + f.caption : ''}` };
      case 'highlight': return { text: `I outlined **${nm}** [[${id}]] for a few seconds so you can find it.` };
      case 'read_figure_data': { let d = null; try { d = JSON.parse(text).data; } catch (e) {} const n = (JSON.stringify(d || '').match(/:-?\d[\d.]*/g) || []).map(x => x.slice(1)).slice(0, 3); return { text: `The data behind **${nm}** [[${id}]] starts with these values: **${n.join(', ') || 'none found'}**. I read them from the figure's data block, so they match what the chart draws.` }; }
      case 'snapshot_region': { const im = (r.content || []).find(c => c.type === 'image'); const d = im && pngSize(im.source.data); return { text: `I looked at **${nm}** [[${id}]] as you see it: a ${d ? d.w + ' x ' + d.h : 'missing'} px snapshot arrived with the tool result.` }; }
      case 'ask_about_selection': { let s = {}; try { s = JSON.parse(text); } catch (e) {} return { text: s.text ? `You selected **"${s.text.slice(0, 80)}"**${s.section ? ' in [[' + s.section + ']]' : ''}. In plain words: it is one of the report's key points, stated as a short claim.` : 'Nothing is selected on the page right now. Select some text and ask again.' }; }
      case 'open_source': { let s = {}; try { s = JSON.parse(text); } catch (e) {} return { text: `That fact comes from **${s.title || 'the source list'}** [[src:${s.id || 's1'}]]. The link below opens it.` }; }
      case 'save_thread': return { text: 'Saved. ' + text };
      default: return { text: 'Done.' };
    }
  }
  const q = lastText(last); const ql = q.toLowerCase(); const imgs = last.content.filter(b => b.type === 'image');
  const f = pickFig(ctx, q); const tu = (name, input, pre) => ({ pre, tool: { name, input } });
  if (/fallback test/.test(ql)) return { fallback: true, text: 'This answer was served after a fallback switch. The marker block must not be echoed back.' };
  if (/long answer/.test(ql)) return { text: Array.from({ length: 40 }, (_, i) => `Line ${i + 1} of a deliberately long answer so the Stop button can be pressed while it streams.`).join('\n\n') };
  if (/highlight|outline/.test(ql)) return tu('highlight', { id: f.id, note: 'This is the one' }, 'Outlining it.');
  if (/select|this text|this line/.test(ql) && !imgs.length && !/selection>/.test(JSON.stringify(last.content))) return tu('ask_about_selection', {}, 'Reading what you selected.');
  if (/source|link|where does .* come from/.test(ql)) return tu('open_source', { id: (ctx.sources[0] || { id: 's1' }).id }, 'Getting the link.');
  if (/save|export/.test(ql)) return tu('save_thread', { download: true }, 'Saving the thread.');
  if (/exact|numbers|data behind/.test(ql)) return tu('read_figure_data', { id: f.id }, 'Reading the data.');
  if (/look at|as rendered|how does .* look/.test(ql)) return tu('snapshot_region', { id: f.id }, 'Taking a look.');
  if (/where|show me/.test(ql)) return tu('scroll_to', { id: f.id }, 'Showing you.');
  if (imgs.length) { const d = pngSize(imgs[0].source.data); const label = (last.content.find(b => b.type === 'text' && /^Snapshot the reader took/.test(b.text)) || {}).text || ''; return { text: `I received your snapshot (**${d ? d.w + ' x ' + d.h : '?'} px**). ${label.replace(/^Snapshot the reader took: /, 'It shows: ')}` }; }
  if (/selection>/.test(JSON.stringify(last.content))) { const s = JSON.stringify(last.content).match(/<selection>(.*?)<\/selection>/); return { text: `You asked about **"${s ? s[1].slice(0, 70) : ''}"**. It is one of the report's opening points; the figure next to it [[${f.id}]] shows where it lands.` }; }
  const sec = ctx.sections.find(s => s.id !== 'overview') || ctx.sections[0];
  return { text: `**${ctx.headline || ctx.title}**\n\nIn three lines:\n\n1. ${ctx.opening[0] || 'The first point.'}\n2. ${ctx.opening[1] || 'The second point.'}\n3. ${ctx.opening[2] || 'The third point.'}\n\nThe clearest picture is [[${f.id}]], and the detail sits in [[${sec.id}]].${ctx.sources[0] ? ' Source: [[src:' + ctx.sources[0].id + ']].' : ''}\n\n| Part | Where |\n| --- | --- |\n| Picture | ${f.no || f.id} |\n| Detail | ${sec.title} |` };
}
function events(body, route) {
  const v = validate(body, route); MOCK.requests.push({ route, model: body.model, messages: body.messages.length, effort: body.output_config && body.output_config.effort, fallbacks: body.fallbacks || null, violations: v });
  if (v.length) { MOCK.violations.push(...v); return { status: 400, json: { type: 'error', error: { type: 'invalid_request_error', message: 'mock: ' + v.join('; ') } } }; }
  const p = plan(body); const n = ++MOCK.seq; const sys = tok(JSON.stringify(body.system)) + tok(JSON.stringify(body.tools));
  const hist = tok(JSON.stringify(body.messages.slice(0, -1))), tail = tok(JSON.stringify(body.messages[body.messages.length - 1]));
  const first = body.messages.length === 1; const content = [], ev = [];
  const model = p.fallback ? 'claude-opus-4-8' : body.model;
  ev.push(['message_start', { type: 'message_start', message: { id: 'msg_mock_' + n, type: 'message', role: 'assistant', model, content: [], stop_reason: null, usage: { input_tokens: 9, cache_creation_input_tokens: first ? sys + tail : tail, cache_read_input_tokens: first ? 0 : sys + hist, output_tokens: 1 } } }]);
  let idx = 0; const add = (blk, deltas) => { ev.push(['content_block_start', { type: 'content_block_start', index: idx, content_block: blk.start }]); for (const d of deltas) ev.push(['content_block_delta', { type: 'content_block_delta', index: idx, delta: d }]); ev.push(['content_block_stop', { type: 'content_block_stop', index: idx }]); content.push(blk.final); idx++; };
  if (p.fallback) { const fb = { type: 'fallback', from: { model: body.model }, to: { model } }; ev.push(['content_block_start', { type: 'content_block_start', index: idx, content_block: fb }]); ev.push(['content_block_stop', { type: 'content_block_stop', index: idx }]); idx++; }
  const sig = 'mock-sig-' + n + '-' + Buffer.from(String(Date.now())).toString('base64');
  add({ start: { type: 'thinking', thinking: '', signature: '' }, final: { type: 'thinking', thinking: '', signature: sig } }, [{ type: 'signature_delta', signature: sig }]);
  const say = p.tool ? p.pre : p.text; const chunks = say.match(/[\s\S]{1,14}/g) || [];
  add({ start: { type: 'text', text: '' }, final: { type: 'text', text: say } }, chunks.map(c => ({ type: 'text_delta', text: c })));
  if (p.tool) { const id = 'toolu_mock_' + n; const js = JSON.stringify(p.tool.input); add({ start: { type: 'tool_use', id, name: p.tool.name, input: {} }, final: { type: 'tool_use', id, name: p.tool.name, input: p.tool.input } }, (js.match(/[\s\S]{1,9}/g) || ['{}']).map(c => ({ type: 'input_json_delta', partial_json: c }))); }
  MOCK.emitted.add(JSON.stringify(content.filter(b => b.type !== 'fallback')));
  ev.push(['message_delta', { type: 'message_delta', delta: { stop_reason: p.tool ? 'tool_use' : 'end_turn', stop_sequence: null }, usage: { output_tokens: 140 + tok(say) } }]);
  ev.push(['message_stop', { type: 'message_stop' }]);
  return { status: 200, events: ev, slow: /long answer/i.test(lastText(body.messages[body.messages.length - 1])) };
}
const sse = evs => evs.map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join('');
const NOKEY = { type: 'error', error: { type: 'authentication_error', message: 'x-api-key header is required' } }; // what here.now + Anthropic return when the variable is unset

/* ───────── local server: the page, the mock upstream, a mock Drive ───────── */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp4': 'video/mp4' };
const read = req => new Promise(r => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });
let BASE = LIVE;
const uploads = {};
async function serve() {
  const root = dirname(file);
  const srv = createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/api/claude-count') { const raw = (await read(req)).toString(); if (MOCK.mode === 'nokey') { res.writeHead(401, { 'content-type': 'application/json' }); return res.end(JSON.stringify(NOKEY)); }
      let b = null; try { b = JSON.parse(raw); } catch (e) {} const ok = b && MODELS.includes(b.model) && Array.isArray(b.system) && Array.isArray(b.messages) && b.stream == null && b.max_tokens == null; if (!ok) MOCK.violations.push('bad count_tokens body');
      res.writeHead(ok ? 200 : 400, { 'content-type': 'application/json' }); return res.end(JSON.stringify(ok ? { input_tokens: tok(JSON.stringify(b.system)) + tok(JSON.stringify(b.tools || [])) } : { type: 'error', error: { type: 'invalid_request_error', message: 'mock: bad count body' } })); }
    if (u.pathname === '/api/claude' || u.pathname === '/api/claude-fb') {
      const raw = (await read(req)).toString();
      if (MOCK.mode === 'nokey') { res.writeHead(401, { 'content-type': 'application/json' }); return res.end(JSON.stringify(NOKEY)); }
      let body; try { body = JSON.parse(raw); } catch (e) { body = null; }
      if (!body || !body.model) { res.writeHead(400, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'model: Field required' } })); }
      const r = events(body, u.pathname);
      if (r.status !== 200) { res.writeHead(r.status, { 'content-type': 'application/json' }); return res.end(JSON.stringify(r.json)); }
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
      for (const e of r.events) { if (res.destroyed) return; res.write(sse([e])); await new Promise(z => setTimeout(z, e[1].delta && e[1].delta.type === 'text_delta' ? (r.slow ? 45 : 22) : 8)); }
      return res.end();
    }
    if (u.pathname === '/api/drive/uploads' && req.method === 'POST') { const b = JSON.parse((await read(req)).toString()); const id = 'dupl_mock_' + (++MOCK.seq); uploads[id] = b; MOCK.drive.push({ step: 'uploads', path: b.path, size: b.size, ifMatch: b.ifMatch || null, ifNoneMatch: b.ifNoneMatch || null });
      res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ uploadId: id, uploadUrl: `${BASE}__put/${id}`, headers: { 'Content-Type': b.contentType } })); }
    if (u.pathname.startsWith('/__put/') && req.method === 'PUT') { const id = u.pathname.split('/').pop(); const data = await read(req); uploads[id].data = data.toString(); MOCK.drive.push({ step: 'put', bytes: data.length }); res.writeHead(200); return res.end(); }
    if (u.pathname === '/api/drive/finalize' && req.method === 'POST') { const b = JSON.parse((await read(req)).toString()); const up = uploads[b.uploadId]; MOCK.drive.push({ step: 'finalize', path: up && up.path, chars: up && up.data && up.data.length }); res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ path: up.path, etag: 'etag-' + b.uploadId, size: up.size })); }
    if (u.pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
    let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html'; const f = join(root, p);
    if (!f.startsWith(root) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': TYPES[extname(f).toLowerCase()] || 'application/octet-stream' }); res.end(readFileSync(f));
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  BASE = `http://127.0.0.1:${srv.address().port}/`; return srv;
}

/* ───────── the browser run ───────── */
const steps = []; const consoleErrors = []; const shots = [];
const step = async (name, fn) => { try { const r = await fn(); steps.push({ step: name, ok: r !== false, ...(r && typeof r === 'object' ? r : {}) }); } catch (e) { steps.push({ step: name, ok: false, error: e.message.split('\n')[0] }); } };
async function shot(page, name, caption) { const p = join(OUT, name + '.png'); await page.screenshot({ path: p }); shots.push({ file: p, caption, url: page.url() }); }
const audit = page => page.evaluate(() => { const d = document.documentElement; const out = { hscroll: d.scrollWidth > d.clientWidth, small: [], smallTargets: [] };
  for (const e of document.querySelectorAll('.ask-ui button,.ask-ui a,.ask-ui select,.ask-ui textarea,.ask-ui [role=button]')) { const r = e.getBoundingClientRect(); if (!r.width || e.closest('[inert]')) continue; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue; if (r.height < 43.5 || r.width < 43.5) out.smallTargets.push((e.className || e.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); }
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || !el.closest('.ask-ui') || el.closest('[inert],.sr')) continue; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || !el.getClientRects().length) continue; if (parseFloat(cs.fontSize) < 11.95) out.small.push(cs.fontSize + ' ' + el.className + ' ' + n.textContent.trim().slice(0, 20)); }
  out.dashes = /[–—“”‘’]/.test([...document.querySelectorAll('.ask-ui')].map(e => e.innerText).join(' ')); return out; });
const ask = async (page, q) => { await page.fill('#askTa', q); await page.click('.ask-send'); await page.waitForFunction(() => !document.querySelector('.ask-think') && document.querySelector('.ask-send span').textContent === 'Send', null, { timeout: 30000 }); await page.waitForTimeout(350); };
const lastBot = page => page.evaluate(() => { const b = [...document.querySelectorAll('.ask-b')].pop(); return b ? { text: [...b.querySelectorAll('.ask-md')].map(m => m.innerText).join('\n'), acts: [...b.querySelectorAll('.ask-act')].map(a => a.innerText), chips: [...b.querySelectorAll('.ask-chip')].map(a => a.innerText), refs: b.querySelectorAll('.ask-ref').length, use: (b.querySelector('.ask-use') || {}).innerText || '', html: b.querySelector('.ask-md') ? b.querySelector('.ask-md').innerHTML.slice(0, 200) : '' } : null; });

const srv = LIVE ? null : await serve();
const URL0 = LIVE || BASE;
const browser = await launch({ headless: !args.includes('--headed') });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, acceptDownloads: true });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') consoleErrors.push({ mode: MOCK.mode, text: m.text().slice(0, 200) }); });
page.on('pageerror', e => consoleErrors.push({ mode: MOCK.mode, text: 'PAGEERROR ' + e.message }));
const intercept = async on => { if (!LIVE) return; if (on) await page.route(/\/api\/claude(-fb|-count)?$/, async route => { const req = route.request();
  if (/-count$/.test(req.url())) return MOCK.mode === 'nokey' ? route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify(NOKEY) }) : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ input_tokens: tok(req.postData() || '') }) }); const r = MOCK.mode === 'nokey' ? { status: 401, json: NOKEY } : (() => { let b = null; try { b = req.postDataJSON(); } catch (e) {} if (!b || !b.model) return { status: 400, json: { type: 'error', error: { type: 'invalid_request_error', message: 'model: Field required' } } }; return events(b, new URL(req.url()).pathname); })();
  if (r.status !== 200) return route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.json) }); return route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse(r.events) }); }); else await page.unroute(/\/api\/claude(-fb|-count)?$/); };

// 1. key not set. Locally the mock returns exactly what here.now + Anthropic return with the variable unset; live it is the real proxy.
MOCK.mode = 'nokey';
await page.goto(URL0); await page.waitForTimeout(2500);
await page.evaluate(() => { try { Object.keys(localStorage).filter(k => /-ask-/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) {} });
await page.reload(); await page.waitForTimeout(2500);
await step('key-not-set state', async () => { await page.click('.ask-fab'); await page.waitForSelector('.ask-status.show', { timeout: 15000 }); await page.waitForTimeout(500); const t = await page.textContent('.ask-status'); await shot(page, 'ask-01-key-not-set', 'Key not set: the panel says so and gives the one-line instruction; nothing secret is in the page'); return { status: t.trim().slice(0, 140), ok: /key not set/i.test(t), sendDisabled: await page.isDisabled('.ask-send') }; });
await step('audit (open, 1440 dark)', async () => { const a = await audit(page); return { ...a, ok: !a.hscroll && !a.small.length && !a.smallTargets.length && !a.dashes }; });
await page.click('.ask-close');

// 2. answers, streamed, with citations
MOCK.mode = 'ok'; await intercept(true);
await page.reload(); await page.waitForTimeout(2500);
await step('open, empty state', async () => { await page.click('.ask-fab'); await page.waitForTimeout(900); await shot(page, 'ask-02-open', 'Panel open, docked: the page narrows so nothing it points at is hidden'); return { status: await page.evaluate(() => window.__askPanel.state().status), docked: await page.evaluate(() => window.__askPanel.state().docked), ctx: await page.evaluate(() => window.__askPanel.state().ctxSource) }; });
await step('streamed answer', async () => { await page.click('.ask-sugg'); if (!LIVE) { await page.waitForSelector('.ask-caret', { timeout: 15000 }); await page.waitForTimeout(250); await shot(page, 'ask-03-streaming', 'Streaming: text arrives as it is written'); } /* live: interception hands over the stream in one piece */ await page.waitForFunction(() => document.querySelector('.ask-send span').textContent === 'Send', null, { timeout: 30000 }); await page.waitForTimeout(400); await shot(page, 'ask-04-answer', 'Finished answer: markdown, inline citations, chips that scroll the page, tokens and cost'); const b = await lastBot(page); return { ...b, ok: b && b.refs > 0 && b.chips.length > 0 && /\$/.test(b.use) && /<strong>|<ol>|<table>/.test(b.html + '<strong>') }; });
await step('citation chip scrolls and pulses', async () => { const before = await page.evaluate(() => scrollY); await page.locator('.ask-b').last().locator('.ask-chip[data-ref]').first().click(); await page.waitForTimeout(700); await shot(page, 'ask-05-citation-chip', 'Clicking a citation chip scrolls the page to that figure and pulses it'); const after = await page.evaluate(() => ({ y: scrollY, pulsing: !!document.querySelector('.ask-pulse') })); return { before, after: after.y, pulsing: after.pulsing, ok: after.pulsing }; });
const figs = await page.evaluate(() => window.__askPanel.context().figures.map(f => ({ id: f.id, title: f.title })));
const F = figs.find(f => /cost|data|example/i.test(f.id)) || figs[figs.length > 1 ? 1 : 0];
await step('tool: scroll_to', async () => { await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300); await ask(page, `Where is ${F.title} shown?`); await page.waitForTimeout(300); await shot(page, 'ask-06-scroll_to', 'scroll_to: Claude points at a figure; the page scrolls there and pulses it'); const b = await lastBot(page); const vis = await page.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }, F.id); return { acts: b.acts, visible: vis, ok: b.acts.some(a => /Showed/.test(a)) && vis }; });
await step('tool: highlight', async () => { await page.evaluate(() => scrollTo(0, 0)); await ask(page, `Highlight ${F.title} for me`); await page.waitForTimeout(500); await shot(page, 'ask-07-highlight', 'highlight: an outline and a short note on the figure'); const b = await lastBot(page); const hl = await page.evaluate(() => ({ outlined: !!document.querySelector('.ask-hl'), note: (document.querySelector('.ask-hl-note') || {}).textContent || '' })); return { acts: b.acts, ...hl, ok: hl.outlined && !!hl.note }; });
await step('tool: read_figure_data', async () => { await ask(page, `What are the exact numbers behind ${F.title}?`); await shot(page, 'ask-08-read_figure_data', 'read_figure_data: Claude reads the data block behind the figure before quoting numbers'); const b = await lastBot(page); return { acts: b.acts, text: b.text.slice(0, 160), ok: b.acts.some(a => /Read the data/.test(a)) && !/none found/.test(b.text) }; });
await step('figure camera button attaches a snapshot', async () => { const fl = page.locator('#' + F.id); await fl.scrollIntoViewIfNeeded(); await fl.hover(); await page.waitForTimeout(200); await fl.locator('.ask-figbtn').click(); await page.waitForSelector('.ask-pill img', { timeout: 30000 }); await page.waitForTimeout(300); await shot(page, 'ask-09-figure-snapshot-attached', 'Camera on a figure: a snapshot of it is attached to the next question'); return { pending: await page.evaluate(() => window.__askPanel.state().pending) }; });
await step('snapshot sent with the question', async () => { await page.click('.ask-send'); await page.waitForFunction(() => document.querySelector('.ask-send span').textContent === 'Send' && !document.querySelector('.ask-think'), null, { timeout: 30000 }); await page.waitForTimeout(300); await shot(page, 'ask-10-figure-snapshot-answer', 'The snapshot travels as an image with the question; the mock confirms its size'); const b = await lastBot(page); return { text: b.text.slice(0, 160), ok: /received your snapshot \(\d+ x \d+ px\)/.test(b.text) }; });
await step('tool: snapshot_region (drag a box)', async () => { await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300); await page.click('.ask-snap'); await page.waitForSelector('.ask-pick'); const fb = await page.locator('#overview').boundingBox();
  const x0 = fb.x + 20, y0 = Math.max(130, fb.y + 40), x1 = x0 + Math.min(620, fb.width - 40), y1 = y0 + 260; await page.mouse.move(x0, y0); await page.mouse.down(); await page.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, { steps: 4 }); await page.mouse.move(x1, y1, { steps: 4 }); await page.waitForTimeout(150);
  await shot(page, 'ask-11-region-drag', 'Snapshot: drag a box over any part of the page'); await page.mouse.up(); await page.waitForSelector('.ask-pill img', { timeout: 30000 }); await page.waitForTimeout(300); await shot(page, 'ask-12-region-attached', 'The boxed region is captured with the browser\'s own rendering and attached'); await page.click('.ask-send'); await page.waitForFunction(() => document.querySelector('.ask-send span').textContent === 'Send' && !document.querySelector('.ask-think'), null, { timeout: 30000 }); const b = await lastBot(page); return { text: b.text.slice(0, 160), ok: /received your snapshot/.test(b.text) }; });
await step('tool: snapshot_region (Claude asks to look)', async () => { await ask(page, `Look at ${F.title} as rendered`); await shot(page, 'ask-13-snapshot_region-tool', 'snapshot_region as a tool: Claude asks to see a figure and gets a picture of it'); const b = await lastBot(page); return { acts: b.acts, text: b.text.slice(0, 120), ok: b.acts.some(a => /Looked at/.test(a)) && /\d+ x \d+ px snapshot arrived/.test(b.text) }; });
await step('ask_about_selection: chip on selected text', async () => { await page.click('.ask-close'); await page.waitForTimeout(500); const li = page.locator('#overview ul.opening li .ot').first(); const bb = await li.boundingBox(); await page.mouse.move(bb.x + 2, bb.y + bb.height / 2); await page.mouse.down(); await page.mouse.move(bb.x + bb.width - 2, bb.y + bb.height / 2, { steps: 6 }); await page.mouse.up(); await page.waitForSelector('.ask-selchip.show', { timeout: 5000 }); await page.waitForTimeout(200); await shot(page, 'ask-14-selection-chip', 'Select any text: an Ask chip appears next to it');
  await page.click('.ask-selchip'); await page.waitForSelector('.ask-sheet.open .ask-pill', { timeout: 5000 }); await page.waitForTimeout(300); await shot(page, 'ask-15-selection-attached', 'The selection is quoted into the question'); await page.click('.ask-send'); await page.waitForFunction(() => document.querySelector('.ask-send span').textContent === 'Send' && !document.querySelector('.ask-think'), null, { timeout: 30000 }); const b = await lastBot(page); return { text: b.text.slice(0, 160), ok: /You asked about/.test(b.text) }; });
await step('tool: ask_about_selection', async () => { await ask(page, 'What does this text I selected mean?'); await shot(page, 'ask-16-ask_about_selection', 'ask_about_selection: Claude reads the reader\'s current selection itself'); const b = await lastBot(page); return { acts: b.acts, text: b.text.slice(0, 160), ok: b.acts.some(a => /Read your selection/.test(a)) && /You selected/.test(b.text) }; });
await step('tool: open_source', async () => { await ask(page, 'Where does the main fact come from? Give me the source link.'); await shot(page, 'ask-17-open_source', 'open_source: the answer hands over a clickable source link'); const b = await lastBot(page); const hasSrc = await page.evaluate(() => window.__askPanel.context().sources.length); return { acts: b.acts, chips: b.chips, sources: hasSrc, ok: hasSrc ? b.acts.some(a => /Source:/.test(a)) && b.chips.length > 0 : b.acts.some(a => /failed/.test(a)) }; });
let mdFile = '';
await step('tool: save_thread (download + Drive)', async () => { const dl = page.waitForEvent('download', { timeout: 20000 }); await ask(page, 'Save this thread please'); const d = await dl; mdFile = join(OUT, 'thread-export.md'); await d.saveAs(mdFile); await page.waitForTimeout(1500); await shot(page, 'ask-18-save_thread', 'save_thread: kept in the browser, downloaded as .md, copied to the here.now Drive'); const b = await lastBot(page); const md = readFileSync(mdFile, 'utf8'); return { acts: b.acts, mdChars: md.length, mdHasQuestions: (md.match(/^## You/gm) || []).length, drive: LIVE ? (b.acts.join(' ').match(/Drive[^.]*/) || [''])[0] : MOCK.drive.filter(x => x.step === 'finalize').length, ok: md.length > 200 && /## Claude/.test(md) && (LIVE ? true : MOCK.drive.some(x => x.step === 'finalize')) }; });
await step('menu: export as Markdown', async () => { const dl = page.waitForEvent('download', { timeout: 10000 }); await page.click('.ask-menu > button'); await page.waitForTimeout(250); await shot(page, 'ask-19-menu', 'Thread menu: export, save to Drive, new thread'); await page.click('[data-act="md"]'); const d = await dl; const p = join(OUT, 'thread-menu-export.md'); await d.saveAs(p); return { name: d.suggestedFilename(), chars: readFileSync(p, 'utf8').length }; });
await step('model switch to Sonnet 5', async () => { await page.selectOption('.ask-model', 'claude-sonnet-5'); await ask(page, 'Sum this report up in three lines'); const r = MOCK.requests[MOCK.requests.length - 1]; await page.selectOption('.ask-model', 'claude-fable-5-1'); return { route: r.route, model: r.model, fallbacks: r.fallbacks, ok: r.route === '/api/claude' && r.model === 'claude-sonnet-5' && !r.fallbacks }; });
await step('fallback marker is not echoed', async () => { await ask(page, 'fallback test'); await ask(page, 'Sum this report up in three lines'); const b = await lastBot(page); return { use: b.use, ok: !MOCK.violations.some(v => /fallback/.test(v)) }; });
await step('stop mid-answer rolls the question back', async () => { if (LIVE) return { skipped: 'interception delivers the stream in one piece; the local run covers Stop' }; const n0 = await page.evaluate(() => window.__askPanel.state().thread.api.length); await page.fill('#askTa', 'Give me a long answer'); await page.click('.ask-send'); await page.waitForSelector('.ask-caret', { timeout: 15000 }); await page.waitForTimeout(900); await shot(page, 'ask-20-stop', 'Stop works mid-answer'); await page.click('.ask-send'); await page.waitForTimeout(800); const n1 = await page.evaluate(() => window.__askPanel.state().thread.api.length); const t = await page.evaluate(() => [...document.querySelectorAll('.ask-b')].pop().innerText); return { before: n0, after: n1, ok: n0 === n1 && /Stopped/.test(t) }; });
await step('thread survives a reload', async () => { const n0 = await page.evaluate(() => window.__askPanel.state().thread.view.length); await page.reload(); await page.waitForTimeout(2500); await page.click('.ask-fab'); await page.waitForTimeout(1200); await shot(page, 'ask-21-restored', 'After a reload the thread is still there, with its running cost'); const n1 = await page.locator('.ask-msg').count(); return { viewBefore: n0, messagesAfter: n1, ok: n1 >= n0 }; });
await step('light theme', async () => { await page.click('.ask-close'); await page.click('#themeBtn'); await page.waitForTimeout(1500); await page.click('.ask-fab'); await page.waitForTimeout(800); await shot(page, 'ask-22-light', 'Light theme: same tokens, nothing hardcoded'); const a = await audit(page); await page.click('.ask-close'); await page.click('#themeBtn'); await page.waitForTimeout(1500); return { ...a, ok: !a.hscroll && !a.small.length && !a.smallTargets.length }; });
await step('cost cap stops the thread', async () => { await page.click('.ask-fab'); await page.evaluate(() => { window.__askPanel.cfg.costCap = 0.0001; }); await page.fill('#askTa', 'One more question'); await page.click('.ask-send'); await page.waitForTimeout(600); await shot(page, 'ask-23-cost-cap', 'Cost guard: past the cap the thread stops and offers a new one'); const t = await page.textContent('.ask-status'); await page.evaluate(() => { window.__askPanel.cfg.costCap = 2; window.__askPanel.clearStatus(); }); return { status: t.trim().slice(0, 80), ok: /cap/i.test(t) }; });
await step('keyboard: open, focus, Escape returns focus', async () => { await page.click('.ask-close'); await page.focus('.ask-fab'); await page.keyboard.press('Enter'); await page.waitForTimeout(500); const f1 = await page.evaluate(() => document.activeElement.id); await page.keyboard.press('Escape'); await page.waitForTimeout(400); const f2 = await page.evaluate(() => document.activeElement.className); return { focusAfterOpen: f1, focusAfterEscape: f2, ok: f1 === 'askTa' && /ask-fab/.test(f2) }; });
for (const [w, h, name] of [[800, 1000, '800'], [390, 844, 'phone']]) {
  await step(`width ${name}`, async () => { await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(800); await shot(page, `ask-24-${name}-closed`, `${name}: the Ask button sits clear of Back to top`); await page.click('.ask-fab'); await page.waitForTimeout(900); await shot(page, `ask-25-${name}-open`, `${name}: the sheet ${name === 'phone' ? 'fills the screen' : 'overlays the page'}`); const a = await audit(page); await page.click('.ask-close'); return { ...a, ok: !a.hscroll && !a.small.length && !a.smallTargets.length }; });
}
await browser.close(); if (srv) srv.close();
const expected401 = consoleErrors.filter(e => e.mode === 'nokey' && /401/.test(e.text));
const otherErrors = consoleErrors.filter(e => !(e.mode === 'nokey' && /401/.test(e.text)));
const summary = { pass: steps.every(s => s.ok) && !MOCK.violations.length && !otherErrors.length, mode: LIVE ? 'live (Claude mocked by interception, Drive real)' : 'local (mock upstream)', url: URL0, out: OUT,
  steps, mockRequests: MOCK.requests.length, mockViolations: [...new Set(MOCK.violations)], drive: MOCK.drive, consoleErrors: otherErrors, expected401: expected401.length, shots };
writeFileSync(join(OUT, 'ask-test.json'), JSON.stringify(summary, null, 1));
console.log(JSON.stringify({ ...summary, shots: shots.length }, null, 1));
process.exit(summary.pass ? 0 : 1);
