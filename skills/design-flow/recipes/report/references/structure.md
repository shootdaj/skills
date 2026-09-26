# Structure

The page is a pyramid. The reader gets the answer in the first screen and can stop at any depth.

## Order

| Block | What it holds | State |
| --- | --- | --- |
| Top bar | Brand mark and title, Expand all, Collapse all, palette picker, theme toggle, chapter tabs with a light and a count each, a scroll progress line | always visible, sticky |
| 00 Overview | Eyebrow line (kind of page, date, author, scope), headline with the decisive words in the accent colour, one-sentence verdict card, six stat tiles, six takeaway cards with a layer map | always open |
| 01 and 02 | The two chapters that carry the answer, for example architecture and readiness | open by default |
| 03 to 0N | Supporting chapters, for example product direction, build plan, risks, decisions, asks, sources | closed by default |
| Prototypes (optional) | Clickable flows the report proposes, each with a tap counter | closed |
| Appendix (lean edition) | The prose the captions link to, one numbered entry per figure | closed |
| Footer | Method line, date, where the sources live | always |

At 1440 by 900 the verdict, the six tiles and the first takeaways are visible without scrolling.

## Chapter recipe

A chapter is a `section.panel` with a header button, a body and one or more figures. Every chapter needs:

- a two-digit number and a short title: `data-no`, `data-title`
- a status light and a count for its tab: `data-led` (ok, part, miss, new, off), `data-cnt`, and `data-cntl` for the spoken label, for example `data-led="miss" data-cnt="7" data-cntl="7 cells missing"`
- a hue for its tab: `data-hue="c1"` to `c5`
- figures, each with a number, a one-line caption, a tooltip on hover, a click detail and keyboard focus
- at most one short list of plain facts

Typical chapters and the figure that carries each one:

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

A stat tile. The light and the status word sit together. The tile jumps to a chapter.

```html
<a class="tile brk" href="#readiness" data-go="readiness" style="--lc:var(--c1)">
 <div class="th"><span class="led ok"></span>OK<span class="go">02<svg class="i"><use href="#i-arrow"/></svg></span></div>
 <div class="k"><span data-count="12">12</span><small>of 30</small></div>
 <div class="l">cells ready today</div>
 <div class="ruler" aria-hidden="true"></div>
</a>
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
- Verdict: two sentences. What to do, and the one fact that makes it urgent.
- Tile label: what the number counts, five words or fewer.
- Caption: the takeaway of the figure, not a description of it. "The App module has the most gaps" beats "Bar chart of gaps by layer".
- Hint: what the reader can do with the figure, such as "Hover a route" or "Drag a node".
- Figure numbers read `Fig. <chapter>.<n>` and captions in the appendix repeat them.

## Lean edition

The lean edition keeps every figure and drops the prose.

1. Remove chapter intros (`p.dek`), prose blocks (`div.prose`), takeaway bodies and the report meta line.
2. Cut each caption to 12 words or fewer and append `<a class="dlink" href="#ap-2-2">Details</a>`.
3. Add an appendix section after the last chapter. One entry per figure with `id="ap-<chapter>-<n>"`, holding the removed prose, the sources and any caveats.
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
