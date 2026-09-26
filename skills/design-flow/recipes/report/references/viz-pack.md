# Viz pack: replace text with figures

The goal is a page that is mostly figure, caption and one short list. Every figure comes with its data and its source.

## Rules

1. Earn the ink. A figure must show a relationship, distribution, sequence or structure that text shows worse.
2. Interactive by default. Hover gives the underlying fact, click focuses, filters or reveals detail, keyboard reaches everything.
3. Build from proven examples. Base each chart on a known, well-built example (Observable D3 gallery, motion.dev examples, vasturiano's 3d-force-graph examples, three.js examples). Match the mechanics, restyle to the tokens.
4. 3D only when it encodes. Allowed: a force graph for a real graph, instanced boxes for a value field, a points morph for a de-duplication story, an exploded layer stack. Each needs a 2D fallback, orbit or drag, at most 10k particles, and must read at 800 px wide. If in doubt, draw it isometric in SVG, which is what the reference stack does.
5. Style stays in tokens. Status colours carry an icon or a word, no rainbow palettes, direct labels, 12 px floor.
6. Text budget. After the pass, a chapter is figures, captions and one short list. Detail moves into tooltips, detail panels and the appendix.

## Data blocks

Put every fact in `d-data.js` as a named constant with a comment that names its source. The figures read only from these blocks.

```js
// Source: Confluence "Skills Assessment" v4 (2026-09-08), section "Takeaways"
const SKILL_STATES = {
  states: ['Inferred', 'Self-reported', 'Talent-confirmed', 'Talent-denied', 'Verified', 'Expired'],
  transitions: [['Inferred', 'Talent-confirmed', 'talent confirms inferred skill'] /* ... */],
};
// Source: talent-system BFF OpenAPI, counted 2026-09-23. 17 routes, none for skills.
const BFF_ROUTES = { existing: { personas: [/* ... */] }, missing: ['POST .../record-skill-ratings'] };
// Weights are relative emphasis in the source recap, not measured. Label the figure "emphasis".
const EVIDENCE_FLOW = { nodes: [/* ... */], links: [/* [from, to, weight] */] };
```

Rules for blocks: numbers come from a count you ran or a document you can cite; estimates and emphasis weights say so in the comment and on the figure; step ids, route strings and identifiers are copied verbatim.

## Text to figure map

Use this table as the starting map. The right column names the block shape the figure needs.

| Text that usually appears | Replace with | Block shape |
| --- | --- | --- |
| Six findings | Six short cards plus a layer map that pins each finding to a layer | `LAYERS_MAP: [{layer, takeaways[]}]` |
| Architecture paragraphs | Exploded stack or layered system graph | `SYSTEMS: {nodes[{id,label,layer,state}], links[[from,to,state,label]]}` |
| Call flow description | Swimlane sequence | `SEQ: [{n, from, to, label, state}]` |
| Readiness prose | Grid with lights plus stacked bars | `READINESS: {layers[], cols[], counts[[ready,partial,missing,na]], cells}` |
| Principles list | Evidence Sankey plus principles map | `EVIDENCE_FLOW`, `PRINCIPLES: [[title, evidence]]` |
| Next steps list | Roadmap | `NEXT_STEPS: []` |
| State descriptions | State machine | `SKILL_STATES: {states[], transitions[[from,to,rule]], envelope[]}` |
| Decision history | Timeline with status | `HDR_TIMELINE: [{id,date,t,status}]` |
| A share or duplication story | Waffle | `{total, part, unitSize}` |
| Stage counts | Alluvial | `{stages[], counts[]}` |
| Deliverables and order | Dependency DAG plus bars per layer plus Gantt | `DELIVERABLES: [{id,layer,t}]`, `DEPS: [[from,to]]` |
| An existing flow with a new step | Stepper | `STEPS: [ids, with the new one marked]` |
| Risks table | Beeswarm level by layer | `RISKS: [{t,level,layer}]` |
| Open decisions | Decision to unblocks graph | `DECISIONS: [{q, unblocks[]}]` |
| Asks | Priority by effort quadrant | `HELP: [{t,p,effort}]` |
| Sources tables | Repo freshness lollipop plus document map | `REPOS: [{r,behind}]`, `DOCS: {pages[], hdrs[], links[]}` |
| API counts such as "17 routes, 0 for skills" | API surface treemap with ghost tiles | `BFF_ROUTES` |
| A model description | Entity diagram | `MODEL: {root, fields[], children[], vocab, api}` |
| Layer rules | Domain layering | `DOMAINS: {layers[{name,systems[],repo}], rule}` |

## Minimums

- At least ten interactive figures, each with a caption that states the takeaway.
- Prose in the supporting chapters cut by at least half; what remains is captions and one-line facts.
- Verify again after the pass: both themes, 1440 and 800, zero console errors, 12 px floor, and the fallback path when WebGL or Motion is missing.

## Worked example

The Skills Assessment report applied this map to 27 figures. Its finished build and the VIZ-PACK brief with every block written out stay with the work copy of this recipe (AyaHelix/skills); optional reading.
