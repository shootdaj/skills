/* Look navigator: the data layer.
   Reads every look file (design-flow/directions/*.md) live from the public skills repo on GitHub, so a new or changed look shows up
   within minutes of a push with no rebuild. Falls back to the last good copy in this browser, then to snapshot.js (made by build.mjs
   from the local checkout). Also holds the colour maths (OKLCH, contrast), the star-graph attributes and the blend / new-look maths. */
(function () {
'use strict';
const REPO = { owner: 'shootdaj', repo: 'skills', branch: 'master', root: 'skills/design-flow' };
const RAW = p => `https://raw.githubusercontent.com/${REPO.owner}/${REPO.repo}/${REPO.branch}/${p}`;
const TREE = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/git/trees/${REPO.branch}?recursive=1`;
const JSD = `https://data.jsdelivr.com/v1/packages/gh/${REPO.owner}/${REPO.repo}@${REPO.branch}?structure=flat`;
const BLOB = p => `https://github.com/${REPO.owner}/${REPO.repo}/blob/${REPO.branch}/${p}`;
const CACHE_KEY = 'look-nav:cache:v1';

/* ───────── colour maths ───────── */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
function parseColor(s) {
  if (!s) return null; s = String(s).trim(); let m;
  if ((m = s.match(/^#([0-9a-f]{3,8})$/i))) {
    let h = m[1]; if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16);
    return { r: (n >> 16 & 255) / 255, g: (n >> 8 & 255) / 255, b: (n & 255) / 255, a: h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1 };
  }
  if ((m = s.match(/^rgba?\(([^)]+)\)$/i))) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(x => x.endsWith('%') ? parseFloat(x) / 100 * 255 : parseFloat(x));
    return { r: p[0] / 255, g: p[1] / 255, b: p[2] / 255, a: p[3] == null ? 1 : (p[3] > 1 ? p[3] / 255 : p[3]) };
  }
  return null;
}
const lin = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const gam = c => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
function toOklab({ r, g, b }) {
  r = lin(r); g = lin(g); b = lin(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return { L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s };
}
function fromOklab({ L, a, b }) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return { r: gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), g: gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), b: gam(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s) };
}
function toOklch(c) { const o = toOklab(c); const C = Math.hypot(o.a, o.b); let H = Math.atan2(o.b, o.a) * 180 / Math.PI; if (H < 0) H += 360; return { L: o.L, C, H }; }
function fromOklch({ L, C, H }) {
  const inG = x => x.r >= -1e-4 && x.r <= 1.0001 && x.g >= -1e-4 && x.g <= 1.0001 && x.b >= -1e-4 && x.b <= 1.0001;
  const at = c => fromOklab({ L, a: c * Math.cos(H * Math.PI / 180), b: c * Math.sin(H * Math.PI / 180) });
  let rgb = at(C);
  if (!inG(rgb)) { let lo = 0, hi = C; for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2; if (inG(at(mid))) lo = mid; else hi = mid; } rgb = at(lo); }
  return { r: clamp(rgb.r), g: clamp(rgb.g), b: clamp(rgb.b) };
}
const hex2 = v => Math.round(clamp(v) * 255).toString(16).padStart(2, '0').toUpperCase();
function toCss(c, a) { a = a == null ? (c.a == null ? 1 : c.a) : a; if (a >= 0.999) return '#' + hex2(c.r) + hex2(c.g) + hex2(c.b); const k = v => Math.round(clamp(v) * 255); return `rgba(${k(c.r)},${k(c.g)},${k(c.b)},${String(+a.toFixed(3)).replace(/^0\./, '.')})`; }
function over(fg, bg) { const a = fg.a == null ? 1 : fg.a; return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 }; }
const lum = c => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
function contrast(fgS, bgS) {
  const bg = parseColor(bgS), fg0 = parseColor(fgS); if (!bg || !fg0) return null;
  const fg = over(fg0, bg); const a = lum(fg), b = lum(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
/* Blend two colours in OKLCH, shorter way round the hue wheel; a near-grey side borrows the other's hue so greys don't swing. */
function mix(c1, c2, t) {
  const A = parseColor(c1), B = parseColor(c2); if (!A || !B) return t < .5 ? c1 : c2;
  const a = toOklch(A), b = toOklch(B);
  let ha = a.H, hb = b.H; if (a.C < 0.02) ha = hb; if (b.C < 0.02) hb = ha;
  let dh = hb - ha; if (dh > 180) dh -= 360; if (dh < -180) dh += 360;
  const out = fromOklch({ L: lerp(a.L, b.L, t), C: lerp(a.C, b.C, t), H: (ha + dh * t + 360) % 360 });
  return toCss(out, lerp(A.a == null ? 1 : A.a, B.a == null ? 1 : B.a, t));
}

/* ───────── the star-graph attributes ───────── */
const ATTRS = [
  { k: 'darkness', label: 'Darkness', short: 'Dark', kind: 'measured', what: 'How dark the background is, from its OKLCH lightness.' },
  { k: 'contrast', label: 'Contrast', short: 'Contrast', kind: 'measured', what: 'How strongly text and muted text stand off the background (WCAG contrast ratio).' },
  { k: 'colour', label: 'Colourfulness', short: 'Colour', kind: 'measured', what: 'How saturated the accent is, how tinted the surfaces are, and any extra palette (OKLCH chroma).' },
  { k: 'warmth', label: 'Warmth', short: 'Warm', kind: 'measured', what: 'Where the accent and surfaces sit on the hue wheel: orange and red are warm, blue and cyan are cool.' },
  { k: 'roundness', label: 'Roundness', short: 'Round', kind: 'measured', what: 'The corner radius, 2 px (sharp) to 18 px (soft).' },
  { k: 'density', label: 'Density', short: 'Dense', kind: 'measured', what: 'How tightly packed, from the file: airy, regular or dense.' },
  { k: 'boldness', label: 'Boldness', short: 'Bold', kind: 'judged', what: 'How loud it reads: display type weight, accent strength, size of the moves.' },
  { k: 'playfulness', label: 'Playfulness', short: 'Playful', kind: 'judged', what: 'How much fun and give it has: toys, bounce, hand-drawn touches.' },
  { k: 'formality', label: 'Formality', short: 'Formal', kind: 'judged', what: 'How buttoned-up it feels: fit for an executive or an engineering doc.' },
  { k: 'motion', label: 'Motion', short: 'Motion', kind: 'judged', what: 'How much moves, from its motion signature: count and size of the moments.' }
];
const r1 = v => Math.round(v * 10) / 10;
function measure(look) {
  const P = look[look.first] || look.dark || look.light; const out = {};
  const bg = parseColor(P.bg);
  if (bg) {
    const L = toOklch(bg).L;
    out.darkness = { v: r1(clamp((0.98 - L) / 0.86) * 10), basis: `background ${P.bg}, lightness ${(L * 100).toFixed(0)}% (its ${look.first} theme)` };
  }
  const c1 = contrast(P.txt, P.bg), c2 = contrast(P.txt2, P.bg);
  if (c1 && c2) {
    const s = r => clamp((Math.log(r) - Math.log(4.5)) / (Math.log(21) - Math.log(4.5)));
    out.contrast = { v: r1((0.6 * s(c1) + 0.4 * s(c2)) * 10), basis: `text ${c1.toFixed(1)}:1, muted text ${c2.toFixed(1)}:1 on the background` };
  }
  const acc = parseColor(P.accent), s1 = parseColor(P.s1);
  if (acc && bg) {
    const aC = toOklch(acc).C, sC = (toOklch(bg).C + (s1 ? toOklch(s1).C : 0)) / 2;
    const extras = Object.values(look.candy || {}).length + Object.values(look.extra || {}).length + Object.values((look.hues && (look.hues[look.first] || look.hues.dark)) || {}).length + (look.palettes || []).length * 0.5;
    out.colour = { v: r1((0.5 * clamp(aC / 0.24) + 0.3 * clamp(sC / 0.05) + 0.2 * clamp(extras / 5)) * 10), basis: `accent chroma ${aC.toFixed(2)}, surface tint ${sC.toFixed(3)}${extras ? `, ${extras} extra colours` : ''}` };
    const w = h => (1 + Math.cos((h - 55) * Math.PI / 180)) / 2;
    let num = 0, den = 0;
    [[P.accent, 3], [P.bg, 2], [P.s1, 1], [P.txt, 1]].forEach(([c, wt]) => { const p = parseColor(c); if (!p) return; const o = toOklch(p); const f = clamp(o.C / 0.05); num += wt * (f * w(o.H) + (1 - f) * 0.5); den += wt; });
    const ah = toOklch(acc).H;
    out.warmth = { v: r1(clamp((num / den - 0.15) / 0.75) * 10), basis: `accent hue ${ah.toFixed(0)}°, surfaces ${toOklch(bg).C < 0.01 ? 'neutral' : 'tinted ' + toOklch(bg).H.toFixed(0) + '°'}` };
  }
  if (typeof look.radius === 'number') out.roundness = { v: r1(clamp(look.radius / 18) * 10), basis: `radius ${look.radius} px` };
  const D = { airy: 2, regular: 5, dense: 8.5 }[String(look.density || '').toLowerCase()];
  if (D != null) out.density = { v: D, basis: `"${look.density}" in the file` };
  return out;
}
function attrsFor(look, judged) {
  const a = measure(look); const j = judged && judged.looks && judged.looks[look.id];
  if (j) for (const k of ['boldness', 'playfulness', 'formality', 'motion']) if (typeof j[k] === 'number') a[k] = { v: j[k], basis: (j.why && j.why[k]) || 'judged from the look file and its demo' };
  return a;
}
/* Mood map: calm to bold across (x), serious to playful down (y), both 0..10. Judged scores lead; measured ones fill in when a look has none yet. */
function moodXY(a) {
  const v = k => a[k] ? a[k].v : null;
  let x, y;
  if (v('boldness') != null) x = 0.5 * v('boldness') + 0.2 * (v('colour') ?? 5) + 0.2 * (v('motion') ?? 5) + 0.1 * (v('contrast') ?? 5);
  else x = 0.5 * (v('colour') ?? 5) + 0.5 * (v('contrast') ?? 5);
  if (v('playfulness') != null) y = 0.5 * v('playfulness') + 0.25 * (v('roundness') ?? 5) + 0.25 * (10 - (v('formality') ?? 5));
  else y = 0.6 * (v('roundness') ?? 5) + 0.4 * (v('warmth') ?? 5);
  return { x, y };
}

/* ───────── look files ───────── */
function parseLook(md, file) {
  const m = md.match(/```json\s*([\s\S]*?)```/); if (!m) throw new Error('no JSON block');
  const j = JSON.parse(m[1]);
  for (const k of ['id', 'name']) if (!j[k]) throw new Error('missing ' + k);
  if (!j.dark && !j.light) throw new Error('no colours');
  if (!j.dark) j.dark = j.light; if (!j.light) j.light = j.dark;
  if (j.first !== 'light') j.first = 'dark';
  j.fonts = j.fonts || {}; j.best = j.best || []; j.avoid = j.avoid || [];
  const line = k => { const x = md.match(new RegExp('^' + k + ':\\s*(.+)$', 'mi')); return x ? x[1].trim() : ''; };
  j.prose = { motion: line('Motion signature'), forms: line('Forms'), three: line('3D'), note: line('Note') };
  j.file = file; j.path = `${REPO.root}/directions/${file}`; j.github = BLOB(j.path);
  return j;
}
const JOBS = [
  { id: 'reports', label: 'Reports', re: /report|status page/i },
  { id: 'sites', label: 'Sites', re: /landing|launch|marketing|showcase|keynote|editorial page/i },
  { id: 'dashboards', label: 'Dashboards', re: /dashboard|monitoring|\bops\b/i },
  { id: 'docs', label: 'Docs', re: /\bdoc\b|docs|tech design|engineering/i },
  { id: 'stories', label: 'Stories', re: /story|narrative|vision|keynote/i },
  { id: 'tools', label: 'Tools', re: /tool|onboarding|internal|workshop|personal project/i }
];
const jobsOf = look => JOBS.filter(j => look.best.some(b => j.re.test(b))).map(j => j.id);
/* Small visual traits a look's prose asks for; the sample pages switch them on so each look keeps some of its character. */
function flavorOf(look) {
  const t = [look.mood, look.prose.forms, look.prose.motion].join(' ').toLowerCase();
  const f = [];
  if (/glass|frosted/.test(t)) f.push('glass');
  if (/hard (offset )?shadow/.test(t)) f.push('hard');
  if (/hairline/.test(t)) f.push('hairline');
  if (/blueprint/.test(t)) f.push('grid');
  if (/corner bracket/.test(t)) f.push('brackets');
  if (/aurora/.test(t)) f.push('aurora');
  if (/spotlight/.test(t)) f.push('spotlight');
  if (/chrome|iridescent|conic/.test(t)) f.push('chrome');
  if (/clay|candy/.test(t)) f.push('clay');
  if (/filmic|cinematic|pinned/.test(t)) f.push('film');
  if (/pill/.test(t)) f.push('pill');
  if (/broadsheet|masthead|print/.test(t)) f.push('caps');
  if (/paper|hand drawn|sketch/.test(t)) f.push('paper');
  return f;
}
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
function build(files, judged, meta) {
  const looks = [], errors = [];
  for (const f of files) {
    try { const L = parseLook(f.md, f.file); L.sha = f.sha || ''; L.hash = hash(f.md); looks.push(L); }
    catch (e) { errors.push(`${f.file}: ${e.message}`); }
  }
  looks.sort((a, b) => a.name.localeCompare(b.name));
  for (const L of looks) {
    L.attrs = attrsFor(L, judged); L.mood_xy = moodXY(L.attrs); L.jobs = jobsOf(L); L.flavor = flavorOf(L);
    L.judged = !!(judged && judged.looks && judged.looks[L.id]);
  }
  return { looks, judged, errors, meta };
}

/* ───────── loading: live from GitHub, else this browser's last copy, else the snapshot ───────── */
const SNAP = () => window.NAV_SNAPSHOT || { looks: [], judged: null, demos: [], recipes: [] };
function readCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { return null; } }
function writeCache(v) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(v)); } catch (e) {} }
const isLookFile = n => /\.md$/.test(n) && !/^(_|README)/i.test(n);
async function getJSON(u) { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(u.split('/')[2] + ' ' + r.status); return r.json(); }
async function getText(u) { const r = await fetch(u); if (!r.ok) throw new Error('raw ' + r.status); return r.text(); }
async function listLive() {
  const dir = REPO.root + '/directions/';
  try {
    const t = await getJSON(TREE);
    const files = t.tree.filter(x => x.type === 'blob' && x.path.startsWith(dir) && !x.path.slice(dir.length).includes('/') && isLookFile(x.path.slice(dir.length))).map(x => ({ file: x.path.slice(dir.length), sha: x.sha }));
    const judged = t.tree.find(x => x.path === REPO.root + '/navigator/judged.json');
    const recipes = [...new Set(t.tree.filter(x => x.path.startsWith(REPO.root + '/recipes/') && /RECIPE\.md$/.test(x.path)).map(x => x.path.split('/')[3]))];
    return { via: 'GitHub', files, judgedSha: judged ? judged.sha : null, recipes };
  } catch (e) {
    const j = await getJSON(JSD);
    const files = (j.files || []).filter(x => x.name.startsWith('/' + dir) && !x.name.slice(dir.length + 1).includes('/') && isLookFile(x.name.slice(dir.length + 1))).map(x => ({ file: x.name.slice(dir.length + 1), sha: x.hash }));
    const judged = (j.files || []).find(x => x.name === '/' + REPO.root + '/navigator/judged.json');
    const recipes = [...new Set((j.files || []).filter(x => x.name.startsWith('/' + REPO.root + '/recipes/') && /RECIPE\.md$/.test(x.name)).map(x => x.name.split('/')[4]))];
    return { via: 'jsDelivr', files, judgedSha: judged ? judged.hash : null, recipes };
  }
}
async function load(onData) {
  const snap = SNAP();
  const cache = readCache();
  const base = cache && cache.files && cache.files.length ? cache : null;
  const first = base
    ? build(base.files, base.judged || snap.judged, { source: 'saved', at: base.at, via: base.via, recipes: base.recipes || snap.recipes })
    : build(snap.looks, snap.judged, { source: 'snapshot', at: snap.built, recipes: snap.recipes });
  onData(first);
  if (!/^https?:$/.test(location.protocol) && !window.NAV_FORCE_LIVE) return first;
  try {
    const live = await listLive();
    const old = new Map(((cache && cache.files) || []).map(f => [f.file, f]));
    const snapBy = new Map(snap.looks.map(f => [f.file, f]));
    const files = await Promise.all(live.files.map(async f => {
      const o = old.get(f.file); if (o && o.sha === f.sha && o.md) return o;
      try { return { file: f.file, sha: f.sha, md: await getText(RAW(`${REPO.root}/directions/${f.file}`)) }; }
      catch (e) { const s = (o && o.md) ? o : snapBy.get(f.file); if (s) return Object.assign({}, s, { stale: true }); throw e; }
    }));
    let judged = (cache && cache.judgedSha && cache.judgedSha === live.judgedSha && cache.judged) || null;
    if (!judged && live.judgedSha) { try { judged = JSON.parse(await getText(RAW(`${REPO.root}/navigator/judged.json`))); } catch (e) { judged = null; } }
    const judgedFrom = judged ? 'GitHub' : 'this app';
    if (!judged) judged = snap.judged;
    const at = new Date().toISOString();
    writeCache({ at, via: live.via, files, judged, judgedSha: live.judgedSha, recipes: live.recipes });
    const d = build(files, judged, { source: 'live', at, via: live.via, judgedFrom, recipes: live.recipes });
    onData(d); return d;
  } catch (e) {
    const d = Object.assign({}, first, { meta: Object.assign({}, first.meta, { offline: e.message }) });
    onData(d); return d;
  }
}

/* ───────── making new looks: blend two, or drop a pin on the map ───────── */
const TOKENS = ['bg', 's1', 's2', 'line', 'txt', 'txt2', 'accent', 'accentTxt', 'onAccent', 'ok', 'part', 'miss'];
function blendLooks(A, B, t, extra) {
  /* colours blend in OKLCH; the text on the accent fill is not blended (a grey would read on neither): it takes whichever of the two looks' own button-text colours reads better on the blended accent */
  const pal = th => { const p = Object.fromEntries(TOKENS.map(k => [k, mix(A[th][k] || A[th].accent, B[th][k] || B[th].accent, t)])); const c = [A[th].onAccent, B[th].onAccent].filter(Boolean); if (c.length) p.onAccent = c.sort((x, y) => (contrast(y, p.accent) || 0) - (contrast(x, p.accent) || 0))[0]; return p; };
  const lead = t < 0.5 ? A : B, other = t < 0.5 ? B : A;
  const pct = Math.round(t * 100);
  const L = {
    id: (extra && extra.id) || `${A.id.split('-')[0]}-${B.id.split('-')[0]}-${pct}`,
    name: (extra && extra.name) || `${A.name.split(' ')[0]} × ${B.name.split(' ')[0]} ${pct}`,
    mood: (extra && extra.mood) || `${lead.mood.split(',')[0].trim()}, with ${other.mood.split(',')[0].trim()}`,
    first: t < 0.5 ? A.first : B.first,
    fonts: Object.assign({}, lead.fonts),
    dark: pal('dark'), light: pal('light'),
    radius: Math.round(lerp(A.radius ?? 12, B.radius ?? 12, t)),
    density: lead.density,
    best: [...new Set([...(t <= 0.65 ? A.best : []), ...(t >= 0.35 ? B.best : [])])].slice(0, 4),
    avoid: [...new Set([...(t <= 0.65 ? A.avoid : []), ...(t >= 0.35 ? B.avoid : [])])].slice(0, 3),
    palettes: [], source: `look navigator: ${A.id} blended with ${B.id} at ${pct}% toward ${B.id}`,
    derived: ['dark.*', 'light.*', 'radius'],
    prose: { motion: lead.prose.motion, forms: lead.prose.forms, three: lead.prose.three, note: '' }
  };
  const jA = A.attrs, jB = B.attrs; L.attrs = measure(L);
  for (const k of ['boldness', 'playfulness', 'formality', 'motion']) if (jA[k] && jB[k]) L.attrs[k] = { v: r1(lerp(jA[k].v, jB[k].v, t)), basis: `between ${A.name} (${jA[k].v}) and ${B.name} (${jB[k].v})` };
  L.flavor = flavorOf(L); L.mood_xy = moodXY(L.attrs); L.blend = { a: A.id, b: B.id, t };
  return L;
}
function lookFile(L, note) {
  const obj = { id: L.id, name: L.name, mood: L.mood, first: L.first, fonts: L.fonts, dark: L.dark, light: L.light, radius: L.radius, density: L.density, best: L.best, avoid: L.avoid, palettes: L.palettes || [], source: L.source, derived: L.derived || [] };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  return `# ${L.name}\n\n${cap(L.mood)}. ${cap(L.first)} first.\n\n\`\`\`json\n${JSON.stringify(obj, null, 1)}\n\`\`\`\n\nMotion signature: ${L.prose.motion || 'pick three to five moments.'}\n\nForms: ${L.prose.forms || 'one per content block.'}\n\n3D: ${L.prose.three || 'none.'}\n` + (note ? `\nNote: ${note}\n` : '') + `\nDerived values (not measured from a source page, adjust if they look off): ${(L.derived || []).join(', ')}.\n`;
}

window.NavData = { REPO, RAW, BLOB, ATTRS, JOBS, TOKENS, load, parseColor, toOklch, contrast, mix, measure, moodXY, blendLooks, lookFile, flavorOf, clamp, lerp };
})();
