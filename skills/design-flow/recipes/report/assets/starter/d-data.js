/* ───────────────────────── data blocks ─────────────────────────
   Every fact the page shows lives here, with a comment that names its source. Figures read only from these.
   Name the blocks a figure draws from in its data-ask attribute (data-ask="EXAMPLE") so the Ask panel can hand Claude the data. */

/* The context brief: the work behind this report, in plain English, filled by the agent that builds it. The Ask panel hands it to
   Claude first, before the page text, so a reader can ask why the report exists, how it was made and what happens next; the appendix
   ends with a collapsed "About this report" entry showing the same facts. Every field is required. A fact you do not have is written
   "not recorded", never guessed. Shape and checks: references/ask-panel.md, "Context brief". This one is an example: replace every value. */
const CONTEXT={
 project:{
  name:'Photo library app, photo search',                                   // the project, in plain words
  links:[{label:'Ticket PHOTO-12: try the new search model',url:'https://example.com/tickets/PHOTO-12'}], // tickets or PRs, or 'not recorded'
  goal:'Make search find the right photo on the first try, so an old shot takes seconds to find, not minutes.' // the goal the work serves
 },
 why:{
  problem:'Search put the right photo in the first ten results only 6 times in 10, and nobody knew if the new model would do better or what it would cost.',
  askedBy:'The library owner, in the team chat on 2026-10-01',
  quote:'is the new model actually better on our photos, and what does it cost?' // their words, or 'not recorded'
 },
 how:{
  sources:'200 real searches typed in April, and the price list for the new model.',
  ran:'A real run: every search went through both models and we counted the hits. The monthly cost is a calculation from the price list, not a bill.',
  where:'On the team laptop, against a copy of the photo library.',
  dates:'Run on 2026-10-06, report written on 2026-10-07.',
  tools:'The search script in the app repo, the current model and the new one.',
  notTested:'Searches typed in other languages, and speed on a phone.'
 },
 decisions:{
  decided:'The current model keeps running until a switch is approved.',
  pending:'Whether to switch this month.',
  yourCall:'Pick yes or no on the switch by Friday.'
 },
 history:[{date:'2026-10-07',change:'First version.'},{date:'2026-10-08',change:'Added the cost line after the price list changed.'}], // short dated lines
 glossary:'docs/GLOSSARY.md in the app repo'                                // where the project glossary lives, or 'not recorded'
};

// Source: EXAMPLE. Replace with a real count and cite where it came from.
const EXAMPLE=[{layer:'Layer A',hue:'c1',count:9,items:['item 1','item 2']},{layer:'Layer B',hue:'c2',count:6,items:['item 3']},{layer:'Layer C',hue:'c3',count:3,items:['item 4']}];

// Source: EXAMPLE. Which layer each opening bullet (data-tk index) belongs to; drives Fig. 0.1.
const LAYERS_MAP=[{layer:'Layer A',hue:'c1',takeaways:[0,3]},{layer:'Layer B',hue:'c2',takeaways:[1]},{layer:'Layer C',hue:'c3',takeaways:[2,4]}];
