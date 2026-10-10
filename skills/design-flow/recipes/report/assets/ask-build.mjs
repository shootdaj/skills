// ask panel build step, run by build.sh after it writes index.html (or by hand). Usage:
//   node ask-build.mjs /path/to/index.html [--no-freeze] [--no-drive] [--drive-id drv_...]
// 1. Freezes the report text into the page as <script type="application/json" id="ask-context">. That blob is the system prompt
//    the panel sends with prompt caching, so it must be byte-stable between builds; it is read from the rendered page in headless Chrome.
//    Its first entry is the context brief (CONTEXT in d-data.js), ahead of the page text; the summary lists any field left empty.
// 2. Writes .herenow/proxy.json next to the page. here.now injects secrets from account variables server side, so the page never holds one:
//    /api/claude, /api/claude-fb and /api/claude-count -> api.anthropic.com with ANTHROPIC_API_KEY (-fb adds the server-side fallback
//    beta header; -count is the free token count the panel uses as its key check),
//    /api/drive/uploads and /api/drive/finalize -> the owner's default Drive with REPORT_THREADS_DRIVE_TOKEN (only when a Drive is known).
// 3. Reports which variables exist on the here.now account (names only; values are never readable) and what to do next.
// Prints a JSON summary. Never prints a key.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { homedir } from 'node:os';
const args = process.argv.slice(2);
const has = k => args.includes(k);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const file = resolve(args.find(a => !a.startsWith('--') && !(args[args.indexOf(a) - 1] || '').startsWith('--drive')) || 'index.html');
if (!existsSync(file)) { console.error('ask-build: no such page ' + file); process.exit(2); }
const dir = dirname(file);
const out = { page: file, context: null, manifest: null, routes: [], drive: false, variables: null, next: [] };

// here.now account key: used only to look up the default Drive id and the variable names. Never printed.
let HN = process.env.HERENOW_API_KEY || '';
const cred = join(homedir(), '.herenow', 'credentials');
if (!HN && existsSync(cred)) { const m = readFileSync(cred, 'utf8').match(/[A-Za-z0-9_-]{20,}/); if (m) HN = m[0]; }
const hn = async p => { const r = await fetch('https://here.now' + p, { headers: { Authorization: 'Bearer ' + HN } }); if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); };

// 1. freeze the context
let html = readFileSync(file, 'utf8');
const BLOB = /<script type="application\/json" id="ask-context">[\s\S]*?<\/script>\n?/;
if (!html.includes('__askPanel') && !/ask-sheet|i-ask/.test(html)) { console.error('ask-build: this page has no ask panel (built with ASK=off?)'); process.exit(3); }
if (!has('--no-freeze')) {
  try {
    const { launch } = await import('../../../assets/lib/playwright.mjs');
    const browser = await launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + file); await page.waitForTimeout(2600);
    const c = await page.evaluate(() => window.__askPanel ? window.__askPanel.extract() : null);
    await browser.close();
    if (!c) throw new Error('window.__askPanel is missing; is i-ask.js in the build?' + (errs.length ? ' Page errors: ' + errs.join('; ') : ''));
    const json = JSON.stringify(c).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, ch => '\\u' + ch.charCodeAt(0).toString(16));
    html = html.replace(BLOB, '').replace(/<\/body>/i, `<script type="application/json" id="ask-context">${json}</script>\n</body>`);
    writeFileSync(file, html);
    let gaps = c.brief ? [] : ['no CONTEXT brief in d-data.js']; try { gaps = (await import('./brief.mjs')).briefGaps(c.brief); } catch (e) {}
    out.context = { chars: json.length, approxTokens: Math.round(json.length / 3.4), brief: !c.brief ? 'missing' : gaps.length ? 'incomplete' : 'complete', lead: !!c.lead, sections: c.sections.length, figures: c.figures.length, sources: c.sources.length,
      figuresWithData: c.figures.filter(f => f.data && Object.keys(f.data).length).length, truncated: !!c.truncated };
    if (gaps.length) out.next.push('Context brief incomplete, so Claude cannot fully say why this report exists, how it was made or what happens next: ' + gaps.join('; ') + '. Fill CONTEXT in d-data.js and write "not recorded" for a fact you do not have; ask-test.mjs fails until then.');
    if (out.context.figuresWithData < out.context.figures) out.next.push(`${out.context.figures - out.context.figuresWithData} of ${out.context.figures} figures have no data block (none named in data-ask, none found in their FIGS draw function); Claude gets their rendered labels instead. Add data-ask="BLOCK" where a figure has real data.`);
  } catch (e) {
    out.context = { frozen: false, why: e.message };
    out.next.push('Context not frozen; the page builds it live on first use, which still works but caches less reliably. Fix the error and rerun.');
  }
}

// 2. proxy manifest
const P = join(dir, '.herenow', 'proxy.json');
let manifest = { proxies: {} };
if (existsSync(P)) { try { const m = JSON.parse(readFileSync(P, 'utf8')); if (m && m.proxies) manifest = m; } catch (e) { out.next.push('Existing .herenow/proxy.json was not valid JSON; it was replaced.'); } }
const claude = beta => ({ upstream: 'https://api.anthropic.com/v1/messages', method: 'POST', rateLimit: '120/hour/ip',
  headers: Object.assign({ 'x-api-key': '${ANTHROPIC_API_KEY}', 'anthropic-version': '2023-06-01' }, beta ? { 'anthropic-beta': beta } : {}) });
manifest.proxies['/api/claude'] = claude(null);
manifest.proxies['/api/claude-fb'] = claude('server-side-fallback-2026-07-01');
manifest.proxies['/api/claude-count'] = Object.assign(claude(null), { upstream: 'https://api.anthropic.com/v1/messages/count_tokens' }); // free; the panel's key check
let driveId = opt('--drive-id', process.env.ASK_DRIVE_ID || '');
if (!has('--no-drive') && !driveId && HN) { try { const d = await hn('/api/v1/drives/default'); driveId = (d.drive && d.drive.id) || d.id || ''; } catch (e) { out.next.push('Could not look up the default Drive (' + e.message + '); Drive copies are off for this build.'); } }
if (!has('--no-drive') && /^drv_[A-Za-z0-9]+$/.test(driveId)) {
  for (const k of ['uploads', 'finalize']) manifest.proxies['/api/drive/' + k] = { upstream: `https://here.now/api/v1/drives/${driveId}/files/${k}`, method: 'POST', rateLimit: '30/hour/ip', headers: { Authorization: 'Bearer ${REPORT_THREADS_DRIVE_TOKEN}' } };
  out.drive = true;
} else { delete manifest.proxies['/api/drive/uploads']; delete manifest.proxies['/api/drive/finalize']; }
mkdirSync(dirname(P), { recursive: true });
writeFileSync(P, JSON.stringify(manifest, null, 2) + '\n');
out.manifest = P; out.routes = Object.keys(manifest.proxies);

// 3. variables (names only)
if (HN) {
  try {
    const v = await hn('/api/v1/me/variables'); const names = (v.variables || []).map(x => x.name);
    out.variables = { ANTHROPIC_API_KEY: names.includes('ANTHROPIC_API_KEY'), REPORT_THREADS_DRIVE_TOKEN: names.includes('REPORT_THREADS_DRIVE_TOKEN') };
    if (!out.variables.ANTHROPIC_API_KEY) out.next.push('ANTHROPIC_API_KEY is not set, so the panel shows its key-not-set state. The owner adds it in the here.now dashboard under Variables (allowed upstream api.anthropic.com). Never set it for them and never put it in the page.');
    if (out.drive && !out.variables.REPORT_THREADS_DRIVE_TOKEN) out.next.push('REPORT_THREADS_DRIVE_TOKEN is not set, so Save to Drive reports it is not set up. See references/ask-panel.md for the one-time scoped token.');
  } catch (e) { out.variables = { unknown: e.message }; }
} else out.next.push('No here.now credentials found: the manifest is written, Drive routes are off, variables were not checked.');
out.next.push('Publish the folder that holds index.html and .herenow/ together. Republishing without .herenow/proxy.json drops the routes.');
console.log(JSON.stringify(out, null, 1));
