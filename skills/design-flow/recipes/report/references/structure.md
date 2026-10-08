# Structure

The page is a pyramid. The reader gets the answer in the first screen and can stop at any depth.

## Order

| Block | What it holds | State |
| --- | --- | --- |
| Top bar | Brand mark and title, Expand all, Collapse all, palette picker, theme toggle, chapter tabs with a light and a count each, a scroll progress line | always visible, sticky |
| 00 Overview | Headline with the decisive words in the accent colour, then four to six one-line bullets (the opening, which are also the takeaways), with an optional layer map beside them. No eyebrow, label, badge, verdict card, paragraph or stat tiles | always open |
| 01 and 02 | The two chapters that carry the answer, for example architecture and readiness | open by default |
| 03 to 05 | Supporting chapters, for example build plan, risks or decisions. Five chapters at most in all | closed by default |
| Prototypes (optional) | Clickable flows the report proposes, each with a tap counter | closed |
| Appendix | `section.panel#appendix`: the prose the captions link to, one numbered entry per figure, plus any detail that does not change a decision | closed |
| Footer | Method line, date, author, where the sources live | always |

At 1440 by 900 the headline and every opening bullet are visible without scrolling.

Why: on 2026-10-08 Anshul said "at the top of the report put a plain english thing, no label, just the text." Shown a plain paragraph there, he said "that's a huge wall of text at top of report. i need something i can scan fast, bullet points, make it more readable, highlights, other visual things to scan the points easily." Shown a row of stat cards (FACT 740M, FITS 284MB, KEEP 0.885, SPIKE 2s, COST $0, 1 BENT), he said "never put these in the report."

## Chapter recipe

A chapter is a `section.panel` with a header button, a body and one or more figures. Every chapter needs:

- a two-digit number and a short title: `data-no`, `data-title`
- a status light and a count for its tab: `data-led` (ok, part, miss, new, off), `data-cnt`, and `data-cntl` for the spoken label, for example `data-led="miss" data-cnt="7" data-cntl="7 cells missing"`
- a hue for its tab: `data-hue="c1"` to `c5`
- figures, each with a number, a one-line caption, a tooltip on hover, a click detail and keyboard focus
- at most one short list of plain facts

## Length budget

- The first screen answers everything: the headline, the four to six opening bullets and one figure, visible at 1440 by 900 without scrolling. The starter puts the layer map beside the bullets for this.
- With every chapter open, the page fits in about three screens at 1440 by 900 (about 2,700 px) before the appendix.
- At most five chapters, none that only restates another.
- Captions are 12 words or fewer, in every edition.
- A detail that does not change a decision goes to the collapsed appendix, or is cut.

Why: on 2026-10-08 Anshul said "any future reports need to be fucking shorter."

Typical chapters and the figure that carries each one. Pick five at most; merge or cut the rest, and put sources in the footer or the appendix:

| Chapter | Lead figure | Supporting figures |
| --- | --- | --- |
| Architecture | Exploded layer stack | Swimlane sequence, system graph, domain layering, entity diagram, API surface treemap |
| Readiness | Status grid with lights | Stacked bars per layer, evidence panel on click |
| Product direction | Evidence Sankey | Principles map, state machine, process flow, decision timeline, waffle, alluvial, roadmap |
| Build plan | Dependency DAG | Bars per layer, Gantt lanes, stepper with the inserted step |
| Risks | Level by layer beeswarm | |
| Decisions | Decision to unblocks graph | |
| Asks | Priority by effort quadrant | |
| Sources | Repo freshness lollipop | Document map network |

## Markup

Tabs are generated from the sections, so adding a section adds a tab.

```html
<header class="top" id="top">
 <div class="wrap">
  <div class="top-row">
   <a class="brand" href="#overview"><span class="mk"><svg class="i"><use href="#i-mark"/></svg></span><span><b>Title</b><small>Subtitle</small></span></a>
   <span class="spacer"></span>
   <button class="btn" id="expandAll" type="button">Expand all</button>
   <button class="btn" id="collapseAll" type="button">Collapse all</button>
   <div class="pal" id="pal">palette menu, see the starter body</div>
   <button class="btn icon" id="themeBtn" type="button" aria-label="Switch to light theme"><svg class="i"><use id="themeUse" href="#i-sun"/></svg></button>
  </div>
  <nav class="tabs live" id="tabs" aria-label="Chapters"></nav>
 </div>
 <div class="prog" aria-hidden="true"><i id="prog"></i></div>
</header>
```

The opening. Four to six one-line bullets straight under the headline. Each starts with its key number or phrase in `<b>`, which gets a soft highlight in the bullet's hue (`--lc`); the rest of the line says what it means. The icon chip is optional, and `<span class="oi dot"></span>` gives a plain coloured dot instead. No label or heading above the list, no paragraph, no stat tiles. `data-tk` ties a bullet to the layer map.

```html
<ul class="opening" aria-label="Key points">
 <li data-tk="0" style="--lc:var(--c1)"><span class="oi"><svg class="i"><use href="#i-db"/></svg></span><span class="ot"><b>12 of 30</b> checks pass today; the 18 gaps sit in two places.</span></li>
 <li data-tk="1" style="--lc:var(--c3)"><span class="oi dot"></span><span class="ot"><b>Ship in May</b> if the two missing pieces land in April.</span></li>
</ul>
```

A chapter panel.

```html
<section class="panel open" id="readiness" data-title="Readiness" data-no="02" data-led="miss" data-cnt="7" data-cntl="7 cells missing" data-hue="c1">
 <button class="ph" type="button" aria-expanded="true"><span class="no">02</span><h2>Readiness</h2><span class="ruler" aria-hidden="true"></span><span class="cnt"><span class="led miss on"></span>7 missing</span><span class="chev"><svg class="i"><use href="#i-chev"/></svg></span></button>
 <div class="pb"><div class="pbi">
  figures go here
 </div></div>
</section>
```

A figure.

```html
<figure class="fg" id="fig-grid">
 <div class="fg-h"><span class="fgno">Fig. 2.2</span><h3>Readiness by layer and capability</h3><span class="sp"></span><span class="hint">Click a cell for its evidence</span></div>
 <div class="toolbar">chips with counts on the left, legend on the right</div>
 <div class="fg-b" id="f-grid"></div>
 <figcaption>Persist ratings is missing everywhere except the shell.</figcaption>
 <div class="fg-d" id="d-grid">Pick a cell to see the evidence behind it.</div>
</figure>
```

Two figures side by side: wrap them in `<div class="pair">`, or `pair w57` and `pair w75` for a 5:7 or 7:5 split. They stack under 1180 px.

## Copy rules

- Headline: one line of thought, the decisive words in the accent colour, about 24 characters per visual line.
- Write the whole report for a smart reader who is not technical. Every term gets a plain phrase the first time it appears, such as "cache hit rate (how often the saved copy is used instead of fetching again)". Run the copy through the `humanizer` skill when it is installed. Why: on 2026-10-08 Anshul said "humanize the entire report. i dont understand it."
- No vendor benchmark numbers (model-card scores, launch-post charts) as evidence anywhere in the report. Use only numbers measured on Anshul's own data, or numbers that bear directly on him: cost, size, time, quota. Why: on 2026-10-08 Anshul said "never use any measures that we haven't either measured or is directly relevant to us".
- Opening bullets: four to six, one line each at 1440 wide. Lead with the key number or phrase in bold, then what it means in plain words. Together they say what this is, what it means for the reader and what to do. No label above them and no paragraph. A number that matters leads a bullet or goes into a figure, never into a stat tile. Why: on 2026-10-08 Anshul said "at the top of the report put a plain english thing, no label, just the text." Shown a plain paragraph there, he said "that's a huge wall of text at top of report. i need something i can scan fast, bullet points, make it more readable, highlights, other visual things to scan the points easily." Shown a row of stat cards (FACT 740M, FITS 284MB, KEEP 0.885, SPIKE 2s, COST $0, 1 BENT), he said "never put these in the report."
- Caption: the takeaway of the figure in 12 words or fewer, not a description of it. "The App module has the most gaps" beats "Bar chart of gaps by layer".
- Hint: what the reader can do with the figure, such as "Hover a route" or "Drag a node".
- Figure numbers read `Fig. <chapter>.<n>` and captions in the appendix repeat them.

## Lean edition

The lean edition keeps every figure and drops the prose.

1. Remove chapter intros (`p.dek`) and prose blocks (`div.prose`). The opening bullets stay as they are.
2. Append `<a class="dlink" href="#ap-2-2">Details</a>` to each caption (captions are already 12 words or fewer).
3. Add the appendix after the last chapter as `<section class="panel" id="appendix">`, closed. One entry per figure with `id="ap-<chapter>-<n>"`, holding the removed prose, the sources and any caveats.
4. Optional: a prototypes chapter before the appendix when the report proposes a user flow. Each prototype is clickable, counts the taps and resets.
5. Rebuild and re-verify. Each edition publishes to its own slug.

A short script does the derivation well: edit the full body, assert every caption is 12 words or fewer, and splice in `appendix.html` and `prototypes.html`.

## Libraries

Load from CDN only, in this order, before the inline script:

- `https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;700&family=Martian+Mono:wght@400;500;600&display=swap`
- `https://cdn.jsdelivr.net/npm/dompurify@3.1.7/dist/purify.min.js`, used by `setHTML` for every markup string
- `https://cdn.jsdelivr.net/npm/d3@7`
- `https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/dist/d3-sankey.min.js` when a Sankey or alluvial is used
- `https://cdn.jsdelivr.net/npm/elkjs@0.9.3/lib/elk.bundled.js` when a layered graph or DAG is used
- `https://cdn.jsdelivr.net/npm/motion@11/dist/motion.js`, global `Motion`
- `https://unpkg.com/3d-force-graph` and `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js` only for a 3D figure that has a 2D fallback

The page must still work when Motion fails to load and when WebGL is missing. The reference exploded stack is isometric SVG, so it needs neither.
