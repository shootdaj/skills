// page recipe build: one data file in, one index.html out, on the report shell. Usage:
//   node page-build.mjs <work>/src/page.json [--out <work>/index.html] [--repo <project dir>|none]
// The shell is the report starter's own parts (head, tokens, components, header, theme doors, palette picker, e-core.js), read from
// ../../report/assets/starter at build time, so a page always matches the report recipe at the same commit. This recipe adds page.css
// and page.js for the four kinds: proof (screenshots with the URL under each), approval (keep or strike), judging (blind, scored),
// gallery (design directions). The glossary hover part comes from ../../report/assets/glossary.mjs, found from --repo (or the data
// file's "repo") the way the report recipe finds it. No Ask panel: that is a report feature; the page recipe ships without it by design.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dataFile = resolve(args.find(a => !a.startsWith('--') && !(args[args.indexOf(a) - 1] || '').startsWith('--')) || 'page.json');
if (!existsSync(dataFile)) { console.error('page-build: no such data file ' + dataFile); process.exit(2); }
const here = dirname(fileURLToPath(import.meta.url));
const REPORT = join(here, '..', '..', 'report', 'assets');
const STARTER = join(REPORT, 'starter');
for (const f of ['a-head.html', 'b1-tokens.css', 'b2-components.css', 'c-body.html', 'e-core.js']) if (!existsSync(join(STARTER, f))) { console.error('page-build: the report starter is missing ' + f + ' at ' + STARTER); process.exit(2); }

const P = JSON.parse(readFileSync(dataFile, 'utf8'));
const KINDS = ['proof', 'approval', 'judging', 'gallery'];
const srcDir = dirname(dataFile);
const out = resolve(opt('--out', join(srcDir, '..', 'index.html')));
const outDir = dirname(out);
const problems = [];
if (!KINDS.includes(P.kind)) problems.push(`kind must be one of ${KINDS.join(', ')} (got ${JSON.stringify(P.kind)})`);
if (!P.key || P.key === 'PAGE_SLUG' || !/^[a-z0-9-]+$/i.test(P.key)) problems.push('key: a short slug for localStorage and the gate, letters, digits and dashes' + (P.key === 'PAGE_SLUG' ? ' (still the starter placeholder PAGE_SLUG)' : ''));
if (!P.title) problems.push('title: the plain question or decision this page is for, 14 words or fewer');
if (!P.purpose) problems.push('purpose: one line under the title, what the source is and what the reader does now');
if (!Array.isArray(P.bullets) || P.bullets.length < 4 || P.bullets.length > 6) problems.push('bullets: four to six, each {lead, text}');
const sections = Array.isArray(P.sections) && P.sections.length ? P.sections : (Array.isArray(P.items) ? [{ id: P.kind, title: ({ proof: 'Proof', approval: 'Decide', judging: 'Judge', gallery: 'Directions' })[P.kind] || 'Items', items: P.items }] : []);
if (!sections.length || !sections.every(s => Array.isArray(s.items) && s.items.length)) problems.push('items (or sections[].items): at least one');
if (problems.length) { console.error('page-build: page.json is incomplete:\n  ' + problems.join('\n  ')); process.exit(2); }

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Copy rules every visible string follows: straight quotes, no em or en dashes (references/structure.md of the report recipe).
const copy = s => String(s == null ? '' : s).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/(\d)\s*[–—]\s*(\d)/g, '$1 to $2').replace(/\s*[—–]\s*/g, ', ');
const t = s => esc(copy(s));
const HUES = ['c1', 'c2', 'c3', 'c4', 'c5'];
const ICON = { check: 'i-check', db: 'i-db', user: 'i-user', layout: 'i-layout', alert: 'i-alert', info: 'i-info', compass: 'i-compass', copy: 'i-copy' };
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x';

// Every image the page shows must exist next to index.html; a missing file is a broken proof, so the build stops.
const missing = [];
const img = (src) => { if (!src) return ''; if (!/^https?:/.test(src) && !existsSync(join(outDir, src))) missing.push(src); return src; };

// ── parts of the shell, read from the report starter ──
const head = readFileSync(join(STARTER, 'a-head.html'), 'utf8');
const body0 = readFileSync(join(STARTER, 'c-body.html'), 'utf8');
const symbols = (body0.match(/<svg width="0"[\s\S]*?<\/svg>/) || [''])[0];
let header = (body0.match(/<header class="top"[\s\S]*?<\/header>/) || [''])[0];
if (!symbols || !header) { console.error('page-build: could not find the symbol sheet or the header in the report starter c-body.html'); process.exit(2); }
const brand = P.brand || {};
header = header.replace(/<b>Report title<\/b><small>Subtitle · Team<\/small>/, `<b>${t(brand.name || P.title.split(/\s+/).slice(0, 4).join(' '))}</b><small>${t(brand.sub || ({ proof: 'Proof', approval: 'Approval', judging: 'Judging', gallery: 'Gallery' })[P.kind])}</small>`)
  .replace(/aria-label="Report title, back to overview"/, 'aria-label="Page title, back to overview"');

// ── kind bodies ──
const urlLine = (u) => u ? `<span class="u">${t(u)}</span>` : '';
const openBtn = (u) => u ? `<a class="btn" href="${esc(u)}" target="_blank" rel="noopener"><svg class="i"><use href="#i-arrow"/></svg><span class="lbl">Open page</span></a>` : '';
const shotLink = (it, i, alt) => it.img ? `<a class="shot-link" href="${esc(img(it.img))}" data-lb="${i}" aria-label="Open full size: ${t(alt)}"><img src="${esc(it.img)}" alt="${t(alt)}" loading="lazy"${it.w ? ` width="${+it.w}" height="${+it.h}"` : ''}></a>` : '';
let n = 0; const lb = [];
function proofItem(it) { n++; const id = it.id || `s${n}`; const alt = it.alt || it.title || it.caption || `Step ${n}`; lb.push({ src: it.img, cap: copy(it.caption || ''), url: it.url || '' });
  if (!it.url) problems.push(`proof item ${n} (${id}) has no url: every screenshot carries the URL it was taken on`);
  return `<figure class="fg shot" id="${esc(id)}"><div class="fg-h"><span class="fgno">${t(it.label || 'Step ' + n)}</span>${it.title ? `<h3>${t(it.title)}</h3>` : ''}<span class="sp"></span>${openBtn(it.url)}</div>${shotLink(it, lb.length - 1, alt)}<figcaption><span class="capw"><span class="cap">${t(it.caption || '')}</span>${urlLine(it.url)}</span></figcaption></figure>`; }
function approvalItem(it) { n++; const id = it.id || slug(it.title || 'item-' + n); lb.push({ src: it.img, cap: copy(it.title || ''), url: it.url || '' });
  return `<article class="ap" id="ap-${esc(id)}" data-id="${esc(id)}"><div class="ap-h"><span class="fgno">${n}</span><h3>${t(it.title || 'Item ' + n)}</h3><span class="sp"></span><span class="st ap-state"><span class="led off on"></span><span class="w">Open</span></span>${openBtn(it.url)}</div>${shotLink(it, lb.length - 1, it.alt || it.title || 'Item ' + n)}${it.text ? `<p class="ap-t">${t(it.text)}</p>` : ''}${urlLine(it.url)}<div class="ap-act"><button class="btn keep" type="button" aria-pressed="false"><svg class="i"><use href="#i-check"/></svg>Keep</button><button class="btn strike" type="button" aria-pressed="false"><svg class="i"><use href="#i-x"/></svg>Strike</button></div></article>`; }
function judgingItem(it, i) { n++; const id = it.id || slug(it.name || 'entry-' + n); const L = String.fromCharCode(65 + (i % 26)); lb.push({ src: it.img, cap: 'Entry ' + L, url: it.url || '' });
  return `<article class="jd" id="jd-${esc(id)}" data-id="${esc(id)}" data-name="${t(it.name || '')}"><div class="ap-h"><span class="fgno">Entry ${L}</span><h3 class="jd-name" hidden>${t(it.name || '')}</h3><span class="sp"></span>${openBtn(it.url)}</div>${shotLink(it, lb.length - 1, it.alt || 'Entry ' + L)}${it.line ? `<p class="ap-t">${t(it.line)}</p>` : ''}<div class="ap-act"><span class="st">Score</span><div class="chips" data-slide role="group" aria-label="Score for entry ${L}">${[1, 2, 3, 4, 5].map(s => `<button class="chip" type="button" data-score="${s}" aria-pressed="false" style="--lc:var(--${HUES[s - 1]})">${s}</button>`).join('')}</div></div></article>`; }
function galleryItem(it) { n++; const id = it.id || slug(it.name || 'd' + n); lb.push({ src: it.img, cap: copy(it.name || ''), url: it.url || '' });
  return `<article class="gc" id="g-${esc(id)}" style="--lc:var(--${HUES[(n - 1) % 5]})">${shotLink(it, lb.length - 1, it.alt || it.name || 'Design ' + n)}<div class="gc-b"><span class="fgno">${t(it.label || String(n).padStart(2, '0'))}</span><h3>${t(it.name || 'Design ' + n)}</h3>${it.line ? `<p>${t(it.line)}</p>` : ''}${it.fonts ? `<small class="mono">${t(it.fonts)}</small>` : ''}<div class="gc-a">${openBtn(it.url)}</div></div></article>`; }
const itemFn = { proof: proofItem, approval: approvalItem, judging: judgingItem, gallery: galleryItem }[P.kind];
const tools = { approval: `<div class="tools"><div class="sum" id="apsum" aria-live="polite"></div><span class="sp"></span><button class="btn" type="button" id="apExport"><svg class="i"><use href="#i-copy"/></svg>Export decisions</button><button class="btn" type="button" id="apReset"><svg class="i"><use href="#i-replay"/></svg>Reset</button></div>`,
  judging: `<div class="tools"><div class="sum" id="jdsum" aria-live="polite"></div><span class="sp"></span><button class="btn" type="button" id="jdReveal" aria-pressed="false"><svg class="i"><use href="#i-user"/></svg><span class="lbl-r">Reveal names</span></button><button class="btn" type="button" id="jdExport"><svg class="i"><use href="#i-copy"/></svg>Export scores</button><button class="btn" type="button" id="jdReset"><svg class="i"><use href="#i-replay"/></svg>Reset</button></div>` }[P.kind] || '';
const panels = sections.map((s, si) => { const id = s.id || slug(s.title || P.kind + (si + 1)); const no = String(si + 1).padStart(2, '0'); const cnt = s.items.length;
  const unit = ({ proof: 'step', approval: 'item', judging: 'entry', gallery: 'design' })[P.kind];
  const count = `${cnt} ${cnt === 1 ? unit : unit === 'entry' ? 'entries' : unit + 's'}`;
  const items = s.items.map((it, i) => itemFn(it, i)).join('\n');
  const inner = P.kind === 'gallery' ? `<div class="gal">${items}</div>` : items;
  return `<section class="panel${si === 0 || s.open ? ' open' : ''}" id="${esc(id)}" data-title="${t(s.title || 'Items')}" data-no="${no}" data-led="${esc(s.led || 'ok')}" data-cnt="${cnt}" data-cntl="${count}" data-hue="${HUES[si % 5]}">
 <button class="ph" type="button" aria-expanded="${si === 0 || s.open ? 'true' : 'false'}"><span class="no">${no}</span><h2>${t(s.title || 'Items')}</h2><span class="ruler" aria-hidden="true"></span><span class="cnt"><span class="led ${esc(s.led || 'ok')} on"></span>${count}</span><span class="chev"><svg class="i"><use href="#i-chev"/></svg></span></button>
 <div class="pb"><div class="pbi">${s.dek ? `<p class="dek">${t(s.dek)}</p>` : ''}${si === 0 ? tools : ''}
${inner}
 </div></div>
</section>`; }).join('\n');
if (problems.length) { console.error('page-build: page.json is incomplete:\n  ' + problems.join('\n  ')); process.exit(2); }
if (missing.length) { console.error('page-build: images missing next to ' + out + ':\n  ' + missing.join('\n  ')); process.exit(2); }

const bullets = P.bullets.map((b, i) => { const hue = HUES.includes(b.hue) ? b.hue : HUES[i % 5]; const ic = ICON[b.icon] ? `<span class="oi"><svg class="i"><use href="#${ICON[b.icon]}"/></svg></span>` : '<span class="oi dot"></span>';
  return `   <li data-tk="${i}" style="--lc:var(--${hue})">${ic}<span class="ot"><b>${t(b.lead)}</b> ${t(b.text)}</span></li>`; }).join('\n');
const date = P.date || new Date().toISOString().slice(0, 10);
const footer = P.footer || {};
const foot = `<footer class="colo"><span>${t(footer.left || `Built ${date} by Claude Code with ${footer.author || 'Anshul'}`)}</span><span>${t(footer.right || footer.method || 'Screenshots taken on the pages named under each one.')}</span></footer>`;

// ── glossary: found from the project, never assumed from chat (same script and order as the report recipe) ──
let repo = opt('--repo', P.repo || process.env.REPO || '');
if (!repo) { try { repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (e) { repo = ''; } }
const glossaryFile = join(srcDir, 'h-glossary.js');
let glossaryLine = 'GLOSSARY none: no project given (set "repo" in page.json or pass --repo), feature off';
if (repo && repo !== 'none') {
  try { glossaryLine = execFileSync('node', [join(REPORT, 'glossary.mjs'), '--repo', resolve(repo), '--out', glossaryFile], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch (e) { glossaryLine = (e.stdout || e.stderr || e.message).toString().trim(); if (/needs-linear/.test(glossaryLine)) { console.error('page-build: ' + glossaryLine); process.exit(3); } }
} else if (repo === 'none') glossaryLine = 'GLOSSARY none: --repo none, feature off';
const glossary = existsSync(glossaryFile) && readFileSync(glossaryFile, 'utf8').trim() ? readFileSync(glossaryFile, 'utf8') : '';
const glTerms = glossary ? (glossary.match(/^\/\* glossary: (\d+) terms/) || [])[1] || '?' : '0';

// ── assemble ──
const title = copy(P.title);
const headOut = head
  .replace(/<html lang="en" data-theme="dark" data-palette="plum" data-key="REPORT_SLUG">/, `<html lang="en" data-theme="dark" data-palette="${esc(P.palette || 'plum')}" data-key="${esc(P.key)}" data-recipe="page" data-kind="${esc(P.kind)}">`)
  .replace(/<title>REPORT TITLE<\/title>/, `<title>${esc(title)}</title>`)
  .replace(/<meta name="description" content="ONE SENTENCE ON WHAT THE REPORT ANSWERS.">/, `<meta name="description" content="${t(P.purpose)}">`)
  .split('\n').filter(l => !/d3-sankey|elkjs/.test(l)).join('\n'); // diagram libraries a page never draws with
if (!/data-recipe="page"/.test(headOut)) { console.error('page-build: the report starter head changed shape; update the replacements in page-build.mjs'); process.exit(2); }
const css = readFileSync(join(STARTER, 'b1-tokens.css'), 'utf8') + readFileSync(join(STARTER, 'b2-components.css'), 'utf8') + readFileSync(join(here, 'page.css'), 'utf8');
const lbHtml = `<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Full size image" hidden><div class="lb-bar"><button class="btn icon lb-prev" type="button" aria-label="Previous image"><svg class="i" style="transform:rotate(180deg)"><use href="#i-arrow"/></svg></button><button class="btn icon lb-next" type="button" aria-label="Next image"><svg class="i"><use href="#i-arrow"/></svg></button><button class="btn icon lb-x" type="button" aria-label="Close"><svg class="i"><use href="#i-x"/></svg></button></div><img id="lbImg" alt=""><div class="lb-cap" id="lbCap"></div></div>`;
const body = `</style>
</head>
<body>
${symbols}
<a class="sr" href="#overview">Skip to content</a>

${header}

<main class="wrap">
<section id="overview" class="hero page live" data-title="Overview" data-no="00" data-hue="c4">
 <h1 class="title rv0" id="title">${t(title)}</h1>
 <p class="purpose rv0" id="purpose">${t(P.purpose)}</p>
 <ul class="opening solo" aria-label="Key points">
${bullets}
 </ul>
</section>

<div class="panels">
${panels}
</div>
${foot}
</main>

<button class="btn totop" id="totop" type="button"><svg class="i"><use href="#i-up"/></svg>Back to top</button>
<div class="tip" id="tip" role="tooltip"></div>
${lbHtml}
<div class="doors" aria-hidden="true"><div class="door l" id="doorL"><span>${t(brand.name || P.kind)}</span></div><div class="door r" id="doorR"><span>${t(P.kind)}</span></div></div>
<script>
`;
const data = JSON.stringify({ kind: P.kind, key: P.key, lightbox: lb }).replace(/</g, '\\u003c');
const js = `const PAGE=${data};\n` + readFileSync(join(STARTER, 'e-core.js'), 'utf8') + '\n' + glossary + '\n' + readFileSync(join(here, 'page.js'), 'utf8') + '\n</script>\n</body>\n</html>\n';
const html = headOut + css + body + js;
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
const tmp = join(tmpdir(), `page-build-check-${process.pid}.js`); writeFileSync(tmp, script);
try { execFileSync('node', ['--check', tmp], { stdio: 'inherit' }); } catch (e) { console.error('page-build: the inline script does not parse (' + tmp + ')'); process.exit(1); }
writeFileSync(out, html);
console.log(`BUILD_OK ${html.length} bytes -> ${relative(process.cwd(), out)} (kind ${P.kind}, ${lb.length} item${lb.length === 1 ? '' : 's'}, glossary ${glTerms === '0' ? 'none' : glTerms + ' terms'}, no Ask panel: pages ship without it)`);
console.log(glossaryLine);
