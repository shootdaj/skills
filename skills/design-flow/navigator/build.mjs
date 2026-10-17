// Look navigator build step. The page itself reads the look files live from GitHub; this only refreshes its fallback copy and
// assembles a folder to publish. Usage (from anywhere):
//   node build.mjs                          refresh snapshot.js from ../directions/*.md, judged.json, the demo pages and recipes
//   node build.mjs --import-demos <dir>     first copy finished demo pages (<dir>/<id>/index.html, marked ✅ in <dir>/PROGRESS.md)
//                                           to ../directions/<id>/demo.html
//   node build.mjs --dist <dir>             also write a publishable folder: navigator/, the look files the app wears, the demo pages,
//                                           a root index.html that forwards to navigator/, and .herenow/proxy.json for the Ask panel
// Prints a JSON summary. Never reads or prints a key.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const flow = resolve(here, '..');
const dirs = join(flow, 'directions');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const out = { looks: 0, demos: [], imported: [], skipped: [], dist: null };

// 1. demo pages from the look-demo builders, only the ones marked done
const imp = opt('--import-demos');
if (imp) {
  const prog = existsSync(join(imp, 'PROGRESS.md')) ? readFileSync(join(imp, 'PROGRESS.md'), 'utf8') : '';
  for (const id of readdirSync(imp)) {
    const src = join(imp, id, 'index.html');
    if (!existsSync(src) || !existsSync(join(dirs, id + '.md'))) continue;
    const line = prog.split('\n').find(l => new RegExp('^\\s*-\\s*' + id + '(?![\\w-])').test(l)) || '';
    if (!/✅/.test(line)) { out.skipped.push(id); continue; }
    mkdirSync(join(dirs, id), { recursive: true });
    copyFileSync(src, join(dirs, id, 'demo.html')); out.imported.push(id);
  }
}

// 2. snapshot: the fallback copy the page uses offline or opened as a file
const files = readdirSync(dirs).filter(f => f.endsWith('.md') && !/^(_|README)/i.test(f)).sort();
const looks = files.map(f => ({ file: f, md: readFileSync(join(dirs, f), 'utf8') }));
const judged = JSON.parse(readFileSync(join(here, 'judged.json'), 'utf8'));
const demos = readdirSync(dirs).filter(d => { try { return statSync(join(dirs, d)).isDirectory() && existsSync(join(dirs, d, 'demo.html')); } catch (e) { return false; } }).sort();
const recipes = existsSync(join(flow, 'recipes')) ? readdirSync(join(flow, 'recipes')).filter(r => existsSync(join(flow, 'recipes', r, 'RECIPE.md'))).sort() : [];
const snap = { built: new Date().toISOString(), looks, judged, demos, recipes };
writeFileSync(join(here, 'snapshot.js'), '/* Fallback copy of the look files, judged scores, demo list and recipes. Made by build.mjs; the page prefers the live files on GitHub. */\nwindow.NAV_SNAPSHOT = ' + JSON.stringify(snap).replace(/</g, '\\u003c') + ';\n');
out.looks = looks.length; out.demos = demos; out.recipes = recipes;

// 3. a folder to publish (here.now): same relative layout as the repo, so every path in the app works unchanged
const dist = opt('--dist');
if (dist) {
  const D = resolve(dist);
  const cp = (from, to) => { mkdirSync(dirname(to), { recursive: true }); copyFileSync(from, to); };
  for (const f of ['index.html', 'app.css', 'app.js', 'ask.js', 'looks.js', 'pages.css', 'pages.js', 'radar.js', 'snapshot.js', 'judged.json']) cp(join(here, f), join(D, 'navigator', f));
  for (const f of ['tokens.css', 'look.css', 'spotlight.js']) cp(join(dirs, 'obsidian-spotlight', f), join(D, 'directions', 'obsidian-spotlight', f));
  for (const id of demos) cp(join(dirs, id, 'demo.html'), join(D, 'directions', id, 'demo.html'));
  writeFileSync(join(D, 'index.html'), `<!doctype html><html lang="en" style="background:#08090C;color-scheme:dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Look Navigator</title>
<script>location.replace('navigator/' + location.search + location.hash)</script></head><body style="font:16px system-ui;color:#EDEFF3;padding:24px"><a href="navigator/" style="color:#4F8CFF">Open the look navigator</a></body></html>\n`);
  const claude = up => ({ upstream: up, method: 'POST', rateLimit: '120/hour/ip', headers: { 'x-api-key': '${ANTHROPIC_API_KEY}', 'anthropic-version': '2023-06-01' } });
  mkdirSync(join(D, '.herenow'), { recursive: true });
  writeFileSync(join(D, '.herenow', 'proxy.json'), JSON.stringify({ proxies: { '/api/claude': claude('https://api.anthropic.com/v1/messages'), '/api/claude-count': claude('https://api.anthropic.com/v1/messages/count_tokens') } }, null, 2) + '\n');
  out.dist = D;
}
console.log(JSON.stringify(out, null, 1));
