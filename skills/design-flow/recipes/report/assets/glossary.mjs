// report recipe glossary: find the project's glossary, parse it, and write the hover part the build includes.
// Usage:
//   node glossary.mjs --repo <project dir> --out <your starter copy>/h-glossary.js [--from <file> --label <source label>]
// Discovery, first hit wins (never assume the glossary was mentioned in chat):
//   1. a `Glossary:` line in the project's AGENTS.md or CLAUDE.md (file path or URL)
//   2. docs/GLOSSARY.md, GLOSSARY.md, docs/glossary.md, glossary.md from the repo root, case-insensitive
//   3. any file named glossary.md|yml|yaml|json in the top two levels of the repo
// Nothing found: the feature stays off. The out file is written empty, so the build adds nothing to the page.
// A Linear document URL cannot be fetched here: read it with the Linear MCP get_document tool, save the markdown, rerun with --from.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join, relative, dirname, extname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const git = (cwd, ...a) => { try { return execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
export const repoRoot = dir => git(dir, 'rev-parse', '--show-toplevel') || resolve(dir);
const ls = dir => { try { return readdirSync(dir); } catch { return []; } };
const ci = (dir, name) => { const hit = ls(dir).find(f => f.toLowerCase() === name.toLowerCase()); return hit ? join(dir, hit) : null; };
const isFile = p => { try { return statSync(p).isFile(); } catch { return false; } };

export function findGlossary(dir) {
  const root = repoRoot(dir);
  for (const name of ['AGENTS.md', 'CLAUDE.md']) {
    const f = ci(root, name); if (!f || !isFile(f)) continue;
    const m = readFileSync(f, 'utf8').match(/^[\s>*-]*\**Glossary\**\s*:\s*(.+)$/im); if (!m) continue;
    let v = m[1].trim().replace(/^`|`$/g, '').replace(/^<|>$/g, ''); const link = v.match(/\]\((.+?)\)/); if (link) v = link[1];
    if (/^https?:\/\//i.test(v)) return { root, via: `${name} Glossary line`, kind: /linear\.app\//i.test(v) ? 'linear' : 'url', url: v, label: v };
    const p = isAbsolute(v) ? v : join(root, v);
    if (isFile(p)) return { root, via: `${name} Glossary line`, kind: 'file', path: p, label: relative(root, p) };
    process.stderr.write(`glossary: ${name} names ${v} but no such file; searching on\n`);
  }
  for (const rel of ['docs/GLOSSARY.md', 'GLOSSARY.md', 'docs/glossary.md', 'glossary.md']) {
    const d = dirname(rel) === '.' ? root : ci(root, dirname(rel)); const p = d && ci(d, rel.split('/').pop());
    if (p && isFile(p)) return { root, via: 'conventional file', kind: 'file', path: p, label: relative(root, p) };
  }
  const skip = n => n.startsWith('.') || n === 'node_modules';
  const hits = [];
  for (const a of ls(root).filter(n => !skip(n)).sort()) {
    const pa = join(root, a);
    if (isFile(pa)) { if (/^glossary\.(md|ya?ml|json)$/i.test(a)) hits.push(pa); continue; }
    for (const b of ls(pa).filter(n => !skip(n)).sort()) if (/^glossary\.(md|ya?ml|json)$/i.test(b) && isFile(join(pa, b))) hits.push(join(pa, b));
  }
  hits.sort((x, y) => x.split('/').length - y.split('/').length || x.localeCompare(y));
  if (hits.length) return { root, via: 'search, two levels deep', kind: 'file', path: hits[0], label: relative(root, hits[0]) };
  return null;
}

// Definitions follow the report copy rules: plain text, straight quotes, no em or en dashes, two sentences at most.
const clean = s => String(s).replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]+/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  .replace(/(\d)\s*[–—]\s*(\d)/g, '$1 to $2').replace(/\s*[—–]\s*/g, ', ').replace(/\s+/g, ' ').trim();
const short = s => { const t = clean(s); const parts = t.match(/[^.!?]+[.!?]+(\s|$)/g); return parts && parts.length > 2 ? parts.slice(0, 2).join('').trim() : t; };
const aliasList = s => clean(s).split(/\s*[,;]\s*/).map(x => x.trim()).filter(Boolean);

export function parseGlossary(text, ext = '.md') {
  ext = ext.toLowerCase(); const out = [];
  const add = (t, d, a = []) => { t = clean(t); d = short(d || ''); if (t && d) out.push({ t, d, a: [...new Set(a.map(clean).filter(x => x && x.toLowerCase() !== t.toLowerCase()))] }); };
  if (ext === '.json') {
    const j = JSON.parse(text); const list = Array.isArray(j) ? j : (j.terms || j.glossary || Object.entries(j).map(([t, d]) => ({ t, d })));
    for (const e of list) add(e.term ?? e.t ?? e.name, e.definition ?? e.d ?? e.meaning ?? e.description, [].concat(e.aliases ?? e.also ?? e.a ?? []));
    return out;
  }
  if (ext === '.yml' || ext === '.yaml') {
    let cur = null;
    for (const line of text.split('\n')) {
      if (/^\s*#/.test(line) || !line.trim()) continue;
      let m;
      if ((m = line.match(/^-\s*(term|name)\s*:\s*(.+)$/i))) { if (cur) add(cur.t, cur.d, cur.a); cur = { t: m[2].replace(/^["']|["']$/g, ''), d: '', a: [] }; continue; }
      if (cur && (m = line.match(/^\s+(definition|meaning|description)\s*:\s*(.+)$/i))) { cur.d = m[2].replace(/^["']|["']$/g, ''); continue; }
      if (cur && (m = line.match(/^\s+(aliases|also)\s*:\s*\[?(.+?)\]?\s*$/i))) { cur.a = aliasList(m[2].replace(/["']/g, '')); continue; }
      if (!cur && (m = line.match(/^([^\s:#-][^:]*):\s*(.+)$/))) add(m[1].replace(/^["']|["']$/g, ''), m[2].replace(/^["']|["']$/g, ''));
    }
    if (cur) add(cur.t, cur.d, cur.a);
    return out;
  }
  // Markdown. Preferred: "## Term", an optional "Also: alias, alias" line, then the definition paragraph.
  const lines = text.split('\n'); let i = 0;
  while (i < lines.length) {
    const h = lines[i].match(/^#{2,4}\s+(.+?)\s*#*\s*$/);
    if (h) {
      i++; let also = []; const para = [];
      while (i < lines.length && !lines[i].trim()) i++;
      const am = i < lines.length && lines[i].match(/^\s*\**(also|aliases)\**\s*:\s*(.+)$/i); if (am) { also = aliasList(am[2]); i++; }
      while (i < lines.length && !lines[i].trim()) i++;
      while (i < lines.length && lines[i].trim() && !/^#{1,4}\s/.test(lines[i]) && !/^\s*\|/.test(lines[i])) para.push(lines[i++].trim());
      add(h[1], para.join(' '), also); continue;
    }
    // Also accepted: a Markdown table whose first two columns are term and definition (an optional third column holds aliases).
    if (/^\s*\|/.test(lines[i]) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(lines[i]).map(c => c.toLowerCase()); const ai = head.findIndex(c => /alias|also/.test(c)); i += 2;
      while (i < lines.length && /^\s*\|/.test(lines[i])) { const c = cells(lines[i++]); add(c[0], c[1], ai > 1 && c[ai] ? aliasList(c[ai]) : []); }
      continue;
    }
    i++;
  }
  return out;
}

const shortSha = (root, file) => git(root, 'log', '-1', '--format=%h', '--', file) || 'uncommitted';

async function main() {
  const args = process.argv.slice(2); const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const out = opt('--out'); if (!out) { console.error('glossary.mjs: --out <starter copy>/h-glossary.js is required'); process.exit(2); }
  const here = dirname(fileURLToPath(import.meta.url));
  let text, ext, label, via;
  if (opt('--from')) { const f = resolve(opt('--from')); text = readFileSync(f, 'utf8'); ext = extname(f) || '.md'; label = opt('--label', f); via = '--from'; }
  else {
    const g = findGlossary(resolve(opt('--repo', '.')));
    if (!g) { writeFileSync(out, ''); console.log(`GLOSSARY none: no Glossary line in AGENTS.md or CLAUDE.md, no docs/GLOSSARY.md, GLOSSARY.md, docs/glossary.md or glossary.md, no glossary.* two levels deep. Feature off, ${out} left empty.`); return; }
    via = g.via;
    if (g.kind === 'linear') { console.log(`GLOSSARY needs-linear ${g.url}: read it with the Linear MCP get_document tool, save the markdown, then rerun with --from <file> --label "${g.url}".`); process.exit(3); }
    if (g.kind === 'url') { const r = await fetch(g.url); if (!r.ok) { console.error(`glossary.mjs: ${g.url} returned ${r.status}`); process.exit(1); } text = await r.text(); ext = extname(new URL(g.url).pathname) || '.md'; label = `${g.url} @ ${new Date().toISOString().slice(0, 10)}`; }
    else { text = readFileSync(g.path, 'utf8'); ext = extname(g.path); label = `${g.label} @ ${shortSha(g.root, g.path)}`; }
  }
  const terms = parseGlossary(text, ext);
  if (!terms.length) { writeFileSync(out, ''); console.log(`GLOSSARY empty: ${label} (via ${via}) has no terms in a format this script reads. Feature off, ${out} left empty.`); return; }
  const data = JSON.stringify({ source: label, terms }).replace(/</g, '\\u003c');
  writeFileSync(out, `/* glossary: ${terms.length} terms from ${label}, written by assets/glossary.mjs. Rerun it to refresh; an empty file turns the feature off. */\nconst GLOSSARY=${data};\n` + readFileSync(join(here, 'glossary-runtime.js'), 'utf8'));
  console.log(`GLOSSARY ${terms.length} terms from ${label} (via ${via}) -> ${out}`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
