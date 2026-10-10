// The context brief every report carries: the CONTEXT block in d-data.js (shape in references/ask-panel.md, "Context brief").
// One list of required fields, read by ask-build.mjs (build summary) and ask-test.mjs (fails the run on a gap).
// Every field is plain English written by the agent that builds the report. A fact the builder does not have is written as
// "not recorded", which counts as filled; an empty or missing field is a gap.
export const BRIEF_FIELDS = [
  ['project.name', 'the project'],
  ['project.links', 'the ticket or PR links (a list of {label, url}, or "not recorded")'],
  ['project.goal', 'the goal the work serves'],
  ['why.problem', 'the problem this report is for'],
  ['why.askedBy', 'who asked for it'],
  ['why.quote', 'their words, quoted (or "not recorded")'],
  ['how.sources', 'the data sources'],
  ['how.ran', 'what was actually run: a real run, old records or a calculation'],
  ['how.where', 'where it ran'],
  ['how.dates', 'the dates'],
  ['how.tools', 'the tools and models'],
  ['how.notTested', 'what was not tested'],
  ['decisions.decided', 'what is already decided'],
  ['decisions.pending', 'what is still pending'],
  ['decisions.yourCall', 'what the reader is asked to do'],
  ['history', 'how the report changed between versions (a list of {date, change})'],
  ['glossary', 'where the project glossary lives'],
];
const text = v => typeof v === 'string' && v.trim().length > 0;
const filled = (path, v) => {
  if (path === 'project.links') return text(v) || (Array.isArray(v) && v.length > 0 && v.every(l => l && text(l.label) && /^https?:\/\//.test(l.url || '')));
  if (path === 'history') return Array.isArray(v) && v.length > 0 && v.every(h => h && /^\d{4}-\d{2}-\d{2}$/.test(h.date || '') && text(h.change));
  return text(v);
};
// Plain-English gaps, one per missing or empty field. An empty list means the brief is complete.
export function briefGaps(brief) {
  if (!brief || typeof brief !== 'object') return ['no CONTEXT brief: add the CONTEXT block to d-data.js (shape in references/ask-panel.md)'];
  return BRIEF_FIELDS.filter(([p]) => !filled(p, p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), brief)))
    .map(([p, what]) => `CONTEXT.${p} is empty: ${what}`);
}
// Every plain-text fact in the brief, for checks that the same facts reach Claude or the page.
export function briefStrings(brief) {
  const out = [];
  const walk = (v, k) => { if (typeof v === 'string') { if (k !== 'url' && v.trim()) out.push(v.trim()); } else if (Array.isArray(v)) v.forEach(x => walk(x)); else if (v && typeof v === 'object') for (const [kk, x] of Object.entries(v)) walk(x, kk); };
  walk(brief);
  return out;
}
