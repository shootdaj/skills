# Design System — Report Publisher

The craft core. Read before writing any HTML. Goal: a report that looks
deliberate and modern, reads top-down (verdict first, detail folded), and uses
visuals and libraries only where they carry information.

## Table of contents
1. Dark theme tokens
2. Page layout — the pyramid
3. Metadata strip
4. Collapsible detail (`<details>`)
5. Charts: earn the ink
6. D3 recipes
7. Library menu — motion & 3D
8. Design references — 21st.dev & Mobbin
9. Typography & spacing
10. Pre-flight checklist

---

## 1. Dark theme tokens

Dark by default. Never pure-black on pure-white. Use a layered near-black with a
restrained accent. Drop these as CSS custom properties and reference them — no
hardcoded hex scattered through the markup.

```css
:root{
  --bg:#0d0f14;        /* page */
  --panel:#151922;     /* cards / sections */
  --panel-2:#1b2030;   /* nested / hover */
  --line:#262d3d;      /* borders, dividers */
  --txt:#e6e9f0;       /* primary text */
  --muted:#9aa4b8;     /* secondary text */
  --dim:#6b7488;       /* captions, meta */
  --accent:#3ba9ff;    /* links, primary accent */
  /* Semantic scale — reuse for severity, status, deltas.
     Pick a palette that fits the domain; this is a safe default. */
  --sev-crit:#ff4d6d; --sev-high:#ff9f43; --sev-med:#ffd23f;
  --sev-low:#4dd4ac;  --good:#3ba9ff;
  --code:#0a0c11;      /* code blocks */
}
```

Contrast: body text on `--bg` must stay comfortably readable — `--txt` on `--bg`
clears WCAG AA. Keep large muted text above `--muted`; reserve `--dim` for small
captions only. Accent is for emphasis and links, not large fills.

The theme-tokens approach matters because a report often encodes a scale
(severity, pass/fail, up/down). Bind those to semantic vars once so color stays
consistent across the headline visual, the tables, and the section badges — a
reader learns "red = critical" in the summary and trusts it everywhere.

Optional: support light mode via `@media (prefers-color-scheme: light)` only if
the user asked. Otherwise commit to dark and make it excellent.

---

## 2. Page layout — the pyramid

The whole point of the report is that the answer comes first. Structure the page
in this order, top to bottom:

This section defines the **Standard Pyramid** template. When **Visual Product
Shortlist** is selected, use the alternate profile in §2b instead; its explicit
exceptions override the navigation and collapsible-section requirements below.

```
┌─────────────────────────────────────────────┐
│  Title            [ meta strip: date · scope ]│  ← who/what/when
│  VERDICT — the single most important sentence │  ← one line, larger
├─────────────────────────────────────────────┤
│  [ stat tiles ]  or  [ one summary chart ]    │  ← the numbers that frame it
│   3–6 metrics, or a severity/trend visual     │
├─────────────────────────────────────────────┤
│  Key takeaways                                │  ← tight bullets/table,
│   • self-contained point                      │     each stands alone
├─────────────────────────────────────────────┤
│  Contents ·  §1  §2  §3  §4  …                 │  ← TOC: jump links to sections
├═════════════════════════════════════════════─┤
│  ▸ Section (collapsible panel)                │  ← body: EVERY heavy section
│  ▸ Section (collapsible panel)                │     is the same panel component
│  ▸ Methodology / appendix (collapsible)       │
└─────────────────────────────────────────────┘
```

- Constrain content width (`max-width: ~1000px`, centered) so lines stay
  readable. Wide tables/charts get their own horizontal-scroll container
  (`overflow-x:auto`) — the page body must never scroll sideways.
- **Use vertical space efficiently — the header must not eat the first screen.**
  A reader should not have to scroll to the middle of the page to reach any real
  information. Keep the masthead compact: a modest title, a one-line/inline
  metadata strip (not a tall bordered grid box), and the verdict immediately
  after. An oversized hero (giant title, huge padding, a big meta panel) that
  pushes the verdict and metrics below the fold is a failure, however pretty. The
  verdict and the stat tiles should both be visible without scrolling on a normal
  laptop screen; the summary chart and takeaways right below. Spend the vertical
  budget on substance, not on a title treatment.
- The first screen (above the fold) should carry verdict + metrics + the start of
  takeaways. If methodology or context is pushing the conclusion down, move it
  into a collapsed section — or tighten the header.
- Stat tiles: a horizontal row of small cards, each a big number + a small label
  (+ optional colored delta). This is usually the right summary visual — cheaper
  and clearer than a chart when you have a handful of key figures.

### Table of contents (required for any multi-section report)

A reader landing on a long report needs a map: what's in here, and how do I get
straight to the part I care about. Give every body section a stable `id` and
provide jump links to them, annotated with counts where sections carry them
("Findings · 22"). Pair with `html{scroll-behavior:smooth}` so clicks glide.

Deliver this as the **persistent side nav** described below — not as a separate
contents card in the document flow. One list, always visible, is strictly better
than a card that scrolls away plus a duplicate of it somewhere else.

### One navigation, always visible

A TOC that only exists at the top is useless the moment the reader is deep in
section 04 — they have to scroll back to move anywhere. But **don't solve that by
shipping two TOCs.** A top contents card plus a persistent nav is redundant: the
same six links twice, one of which scrolls away. Pick one, and make it the
persistent one.

**Ship a single always-visible side nav.** Not a click-to-open FAB — making the
reader open a menu to see where they are is friction on every jump. The nav should
simply be there, showing the section list with the current one highlighted.

The overlap trap: a nav pinned beside a centred, max-width content column will sit
*on top of* the text at most window sizes, because the gutter width varies with the
viewport. Don't fight that with clever `calc()` offsets — **reserve the space**:

```css
@media(min-width:1200px){
  body{padding-right:260px}   /* content shifts left; the rail can never overlap it */
  .sidenav{display:block}
  .fab{display:none}
}
```
- **Side nav**: fixed, vertically centred, ~216px wide, elevated rounded surface,
  rows as ≥44px pills with number, title and item count; active row filled with the
  tonal primary. Include a "back to top" action.
- Highlight the section currently in view (scroll listener, `passive:true`).
- Clicking an entry **opens that section if it's collapsed** — otherwise the jump
  lands on a closed header and looks broken.
- **Below the breakpoint** there's no room beside the content, so fall back to a
  FAB + slide-in drawer (over a scrim, dismiss on scrim-click and `Escape`). Same
  links, same behaviour — just a presentation that fits a narrow screen.

One nav, always present, no duplicate list in the document flow.

### 2b. Visual Product Shortlist profile

Use `assets/templates/visual-product-shortlist.html` for image-led comparisons
of discrete choices. It keeps the answer-first principle but replaces the long
analytical body with a fast visual decision surface:

```text
┌─────────────────────────────────────────────┐
│ Compact title · source · checked date       │
├──────────────┬──────────────┬───────────────┤
│ BUY / PICK   │ KEEP / ALT   │ SKIP / AVOID  │
├──────────────┴──────────────┴───────────────┤
│ [large image card] [large image card] [...] │
│ rank · score · state · price · facts · CTA  │
└─────────────────────────────────────────────┘
```

- Use a responsive 3 / 2 / 1-column grid for desktop / tablet / mobile.
- Let real images dominate: image wells at least 260px tall, `object-fit:contain`,
  no cropping, dimming, blend mode, or overlay that obscures the item.
- Each card contains one rank, one score, an optional state badge, one prominent
  total price/value, no more than three fact chips, exactly one short verdict,
  and one ≥44px outbound CTA.
- Keep the decision strip to the 2–3 actions that materially help the choice.
- Do not add a side nav, drawer, collapsibles, methodology, charts, or a duplicate
  comparison table. The grid is the report and the user should understand it in
  seconds.
- Verify every photo has a nonzero natural size in the browser and every CTA uses
  the exact destination URL. A card without a working image or link is incomplete.

---

## 3. Metadata strip

Reports are forwarded and archived; a reader should know what they're looking at
without asking. Put a compact, muted strip near the title with whatever applies:

- Date (absolute, e.g. `2026-07-22` — never "today")
- Author / reviewer
- Subject: repo, URL, dataset, system under review
- Scope: what was and wasn't covered
- Version / commit / build being described
- Method in one phrase (e.g. "static analysis, 6 surfaces")

Keep it one or two lines, small, `--dim`/`--muted`, separated by `·`. Don't
invent fields — show only what's real. If the source work has a git commit,
build number, or explicit scope, surface it; that's what makes a report
trustworthy rather than a blog post.

---

## 4. Collapsible detail (`<details>`)

Progressive disclosure is what keeps the report short-when-skimmed and
long-when-interrogated. Use native `<details>/<summary>` — no JS needed, works
everywhere, accessible, and the reader controls depth.

```html
<details class="section">
  <summary>
    <span class="chev">▸</span>
    <b>Finding C1 — auth bypass</b>
    <span class="badge sev-crit">Critical</span>
  </summary>
  <div class="section-body">
    …evidence, code, exploit path, fix…
  </div>
</details>
```

```css
.section{background:var(--panel);border:1px solid var(--line);
  border-radius:12px;margin:12px 0;overflow:hidden}
.section > summary{list-style:none;cursor:pointer;padding:14px 18px;
  display:flex;align-items:center;gap:10px;user-select:none}
.section > summary::-webkit-details-marker{display:none}
.section .chev{transition:transform .18s ease;color:var(--muted)}
.section[open] .chev{transform:rotate(90deg)}
.section-body{padding:2px 18px 18px}
```

**The section itself must collapse — not just the items inside it.**
This is the mistake to avoid: a bare `<h2>`/label like "01 FINDINGS" followed by a
list of collapsible finding cards. The individual cards collapse, but the *section*
doesn't, so a reader who doesn't care about findings still has to scroll past all
14 of them. Every top-level section — Findings, Attack scenarios, Strengths,
Methodology, Remediation, Appendix — is itself a `<details>` whose `<summary>` *is*
the section header. Item-level panels nest inside it. Two levels: collapse a whole
section to skip it, or open it and collapse individual items within.

```html
<details class="sect" id="findings" open>
  <summary><span class="schev">▶</span><span class="no">01</span> Findings
           <span class="cnt">22</span><span class="rule"></span></summary>
  <div class="sect-body">
    <details class="p crit"> … one finding … </details>
    <details class="p high"> … one finding … </details>
  </div>
</details>
```
Put the item count in the section summary (`22`, `A1–A3`, `5 stages`) so a reader
knows the weight of what's behind it before opening. Expand-all / collapse-all must
target **both** levels (`document.querySelectorAll('details.p, details.sect')`).

**Every heavy section is a collapsible panel — and they all look the same.**
This is not just for findings. Once you're past the big-picture header (verdict,
metrics, takeaways, TOC), *every* body section — findings, attack scenarios,
strengths, methodology, remediation, appendices, long tables — lives inside the
**same** collapsible panel component. Consistency is the point: a reader learns
the interaction once (a titled bar with a chevron that opens a body) and it holds
everywhere, so the page reads as one coherent document instead of a pile of
mismatched blocks. A prose section that's a bare `<h2>` + text sitting next to
collapsible finding cards looks broken and breaks the skim-then-expand model.

Define one panel and reuse it. Section-level panels use a neutral header; finding
panels are the same component with a severity-colored left border and a badge —
same chevron, same summary layout, same body padding.

```html
<details class="panel" id="strengths" open>
  <summary><span class="chev">▸</span><b>What's solid</b></summary>
  <div class="panel-body"> … </div>
</details>
```
```css
.panel{background:var(--panel);border:1px solid var(--line);border-radius:12px;
  margin:12px 0;overflow:hidden}
.panel > summary{list-style:none;cursor:pointer;padding:14px 18px;
  display:flex;align-items:center;gap:10px;user-select:none;font-size:15px}
.panel > summary::-webkit-details-marker{display:none}
.panel-body{padding:2px 18px 18px}
/* finding = same panel + severity accent */
.panel.crit{border-left:4px solid var(--sev-crit)}
```

Guidance on what to fold vs. keep open:
- **Never collapsible (always visible):** title + meta strip, verdict, metrics/
  stat tiles, key takeaways, the summary visual, the TOC. The reader must never
  click to reach the headline.
- **Collapsible panels (the whole body):** findings, attack/impact narratives,
  strengths, methodology, caveats, remediation, appendices, and any many-row
  table. Use the one panel component for all of them.
- **Default open vs. collapsed:** let the one or two most important panels start
  `open` (e.g. the top-severity finding, the remediation plan) so the reader sees
  substance immediately; collapse the long tail. Every panel stays individually
  toggleable regardless.
- Include a single **Expand all / Collapse all** control once there are more than
  a few panels — a small button pair that toggles the `open` attribute on every
  `<details>`. On a report with many findings this is expected, not optional.

---

## 5. Charts: earn the ink

A visual must tell the reader something faster or more clearly than text would.
If a chart just re-encodes one or two numbers, it is decoration — delete it and
use a stat tile or a sentence. Ask: *does the shape carry meaning?*

**Worth a chart:**
- A distribution across categories (severity counts, error types, time buckets).
- A trend over time (regressions, latency, adoption).
- A comparison across many items (benchmark A vs B vs C, before/after per file).
- A relationship or structure (dependency graph, flow, correlation).
- A part-to-whole where proportion is the point (and even then, a labeled bar
  usually beats a pie).

**Not worth a chart — use text/table/tiles instead:**
- "3 critical, 2 high" → stat tiles or a one-row severity bar, not a pie.
- A single percentage → a big number, maybe a thin radial/meter at most.
- Two values compared once → a sentence.
- Precise values people need to read off exactly → a table.

**Chart-type quick pick:**
| You have | Use |
|---|---|
| Counts per category | Horizontal bar (labels readable) |
| One total split by severity/status | Single stacked horizontal bar |
| Value over time | Line / area |
| Many items, two dimensions | Scatter |
| Hierarchy / relationships | Force graph, tree, or treemap (D3) |
| One ratio, glanceable | Radial gauge / meter |

Style charts to the theme: `--panel` background or transparent, `--line`
gridlines kept faint, series colored from the semantic scale, direct labels over
legends where possible, axis titles present, no chartjunk (no 3D bars, no heavy
gradients, no drop shadows on data).

For a handful of static, simple charts, hand-rolled inline SVG or CSS bars are
lighter than pulling a library. Reach for D3 when the data is dynamic, the chart
type is non-trivial (force graph, treemap, scatter with scales), or you want
axes/scales done right.

---

## 6. D3 recipes

Load via CDN (fine on here.now): `<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>`.

Two patterns cover most report needs.

**Horizontal bar (counts per category):**
```js
const data = [{k:'Critical',v:1,c:'var(--sev-crit)'},{k:'High',v:3,c:'var(--sev-high)'},
              {k:'Medium',v:10,c:'var(--sev-med)'},{k:'Low',v:8,c:'var(--sev-low)'}];
const W=640,H=data.length*44+20,m={l:90,r:40};
const svg=d3.select('#chart').append('svg').attr('viewBox',`0 0 ${W} ${H}`);
const x=d3.scaleLinear().domain([0,d3.max(data,d=>d.v)]).range([m.l,W-m.r]);
const y=d3.scaleBand().domain(data.map(d=>d.k)).range([10,H-10]).padding(.28);
svg.selectAll('rect').data(data).join('rect')
  .attr('x',m.l).attr('y',d=>y(d.k)).attr('height',y.bandwidth())
  .attr('width',d=>x(d.v)-m.l).attr('rx',5).attr('fill',d=>d.c);
svg.selectAll('text.lbl').data(data).join('text').attr('class','lbl')
  .attr('x',m.l-10).attr('y',d=>y(d.k)+y.bandwidth()/2).attr('dy','.35em')
  .attr('text-anchor','end').attr('fill','var(--muted)').attr('font-size',13).text(d=>d.k);
svg.selectAll('text.val').data(data).join('text').attr('class','val')
  .attr('x',d=>x(d.v)+6).attr('y',d=>y(d.k)+y.bandwidth()/2).attr('dy','.35em')
  .attr('fill','var(--txt)').attr('font-size',13).attr('font-weight',600).text(d=>d.v);
```

**Force-directed graph (relationships — e.g. attack surface, dependencies):**
```js
// nodes:[{id}], links:[{source,target}]
const sim=d3.forceSimulation(nodes)
  .force('link',d3.forceLink(links).id(d=>d.id).distance(70))
  .force('charge',d3.forceManyBody().strength(-260))
  .force('center',d3.forceCenter(W/2,H/2));
// append link <line> (stroke var(--line)) and node <circle> (fill var(--accent)),
// then sim.on('tick', …) to update x/y. Add drag + labels as needed.
```

Always give SVGs a `viewBox` and `max-width:100%` so they scale on mobile. Wrap a
wide chart in `<div style="overflow-x:auto">`.

---

## 6b. Controls: Material-style, built to be grabbed

A report is not a poster — the reader *operates* it: expanding sections, opening
findings, jumping around. Every control must be obviously clickable and easy to
hit. Lean on **Material Design** conventions here, because they're tuned for exactly
this: clear affordances, generous targets, and motion that confirms the action.

The failure mode to avoid is a "terminal/console" treatment where controls are tiny
mono glyphs (a 10px `▶`, a hairline text button). It looks sharp in a screenshot and
is miserable to use — the reader can't tell what's interactive and has to aim.

Rules that make controls feel right:
- **≥44px touch target on everything interactive.** An expand toggle should be a
  ~44px circular icon-button, not a bare character. Section and item headers should
  be ≥56–60px tall rows where the *whole row* is the click target, not just the icon.
- **Real icons, not text glyphs.** Use inline SVG (a chevron that rotates 180° on
  open, a hamburger/list icon for contents). Size them ~24–26px.
- **Visible state layers.** Hover lightens the surface and shows a circular
  background behind icon-buttons; press adds a **ripple**. That feedback is what
  tells a reader "this is a button". A ~15-line delegated pointerdown handler gives
  you ripple across every `.ripple` element — cheap, and it transforms how the page
  feels.
- **Buttons are filled pills**, not outlined text: ~44px min-height, pill radius,
  a tonal/primary fill for the main action ("Expand all") and a neutral surface fill
  for the secondary, each with a leading icon.
- **Elevation over borders** for card separation — layered dark surfaces plus soft
  shadows read as tactile; 1px hairlines everywhere read as a wireframe.
- **Motion on state change**: rotate the chevron, animate elevation on hover, ease
  the drawer in. Use one shared easing (`cubic-bezier(.2,0,0,1)`) so everything
  feels like one system. Respect `prefers-reduced-motion`.

Material surfaces work well with the dark palette in §1 — express them as tonal
steps (`--s1` … `--s4`) and use the step to signal hierarchy and hover state.

## 7. Library menu — motion & 3D

Libraries are for when they *do* something. Motion everywhere is worse than none;
it reads as a template. Reach for these only when the payoff is real, and load
them via CDN.

- **Plain CSS / native first.** Section reveals, hover states, chevron rotation,
  progress bars, meters — all cheaper in CSS. A subtle fade/slide-in on scroll
  via `IntersectionObserver` + a CSS class is often all the motion a report
  wants. Start here.
- **Framer Motion** (needs React; only if you're already building the page in
  React) — purposeful entrance/stagger of summary cards, a smooth expand. Don't
  pull React into an otherwise-static HTML report just for one animation; use CSS
  instead. If the report is genuinely interactive/stateful, then React + Framer
  Motion is justified.
- **Three.js** — only when a 3D or spatial view genuinely clarifies the data:
  a physical layout, a 3D scatter where the third axis matters, a network you
  want to rotate, a hero visualization for a flagship report. A decorative
  spinning object is exactly what to avoid. If you can't name what the 3D view
  *shows*, don't add it.
- **anime.js / GSAP** — fine for a tasteful number count-up on the headline
  metrics or a sequenced reveal, if you want more than CSS gives. Keep it subtle
  and fast; a report is not a landing page.

Rule of thumb: if removing the animation/3D loses information or meaningfully
hurts comprehension, keep it. If it only loses "flair," cut it.

---

## 8. Design references — 21st.dev & Mobbin

These are inspiration sources, not dependencies — use them to make specific
components sharper, not to theme the whole page.

- **21st.dev** — a library of polished React/Tailwind UI components (hero
  sections, stat cards, bento grids, tables, badges, animated counters). When a
  particular element deserves more craft — the metric row, a comparison table, a
  feature/finding grid — borrow the *pattern* (structure, spacing, states) and
  reimplement it in the report's own dark theme and plain HTML/CSS. Don't paste
  Tailwind classes into a non-Tailwind page; translate the idea.
- **Mobbin** — real-world app UI screenshots (web + mobile). Use it for
  higher-level layout and information-density cues: how a good dashboard arranges
  a summary header, how sections are chunked, how metadata is presented. Pull the
  compositional idea, not pixels.

Use them where they add value — a report that's mostly prose and one table
doesn't need either. A metrics-heavy or multi-section report benefits from
stealing a strong card/grid pattern. Adapt to the theme tokens in §1 so
everything still reads as one coherent document.

---

## 9. Typography & spacing

- Pick a distinctive but **readable** pairing: a characterful display face for the
  title/section labels + a clean, efficient **sans** for body. Monospace for
  code/paths/IDs/metadata (`"JetBrains Mono"`, `"SF Mono"`, `ui-monospace`).
- **Body must be a sans, never a serif.** A long technical report set in a serif
  (especially a serif *italic*) reads as an essay, not a document — it's slower to
  scan and looks wrong for findings/tables/code. Keep the body a workmanlike sans
  (e.g. Hanken Grotesk, IBM Plex Sans, Public Sans). Do not set the verdict, body,
  or panel titles in a serif or in italic; reserve italic for the occasional
  inline emphasis only.
- Avoid the generic defaults the frontend-design skill also warns off — Inter,
  Roboto, Arial, bare system-ui as the *display* face. A distinctive heading font
  is what stops the page looking like a template.
- Scale: ~15–16px body, a punchy but not enormous h1, clear section steps.
  Line-height ~1.6 for prose. The verdict is a touch larger than body and set in
  the body sans at a heavier weight — not a serif pull-quote.
- **12px is the hard floor for any text a reader is meant to read.** Uppercase
  tracked micro-labels (eyebrows, table headers, badges, captions, chart tick
  labels, metadata keys) are exactly where 9–10px creeps in, and at that size on a
  dark background they are genuinely illegible — the reader has to lean in, which
  reads as sloppy rather than refined. Keep them ≥12px; only pure icon glyphs
  (a chevron, a bullet) may go smaller. If a label doesn't fit at 12px, the fix is
  to shorten or remove the label, never to shrink it.
- **Don't stack two lines of micro-text into a tight slot** (e.g. a chart category
  plus a smaller qualifier beneath it). It forces sub-12px type and tends to
  overflow its container on narrower widths. Put the qualifier somewhere with room
  or drop it — the detail usually already lives in the rows below.
- Whitespace is the cheapest way to look professional — but **whitespace is not
  the same as empty boxes**. Cards must shrink to their content: set
  `align-items:start` on the summary grid so a short chart card isn't stretched to
  match a tall neighbour, and keep card padding modest (~16–18px, not 22–24px).
  A panel that's half empty air reads as unfinished, and it pushes the TOC and the
  real content off the first screen. Aim for balanced density: tight enough that
  each screen earns its space, loose enough to breathe.
- Stat tiles are more space-efficient laid out **number-beside-label** (baseline-
  aligned flex row) than number-stacked-over-label; the stacked version doubles
  tile height for no added information.
- Consistent radius (~10–12px) and 1px `--line` borders give a clean, modern card
  system without shadows-everywhere.
- Tables: muted uppercase header row, 1px row separators, comfortable padding,
  numbers right-aligned if compared. Wrap wide tables in an overflow container.

---

## 10. Pre-flight checklist

Before publishing, confirm:
- [ ] The selected template is named and its specific profile was followed.
- [ ] For Visual Product Shortlist: the decision strip is concise; every card has
      a large loaded photo, rank/score, optional state badge, prominent total,
      ≤3 fact chips, one-line verdict, and ≥44px exact outbound link; there is no
      nav, collapsible body, chart, methodology section, or duplicate table.
- [ ] For Standard Pyramid: apply the navigation, collapsible section, verdict,
      metrics, takeaways, and detail checks below.
- [ ] Verdict + headline metrics + takeaways are visible without expanding or
      scrolling past context.
- [ ] Exactly **one** navigation surface: a persistent, always-visible side nav
      (no click-to-open menu on desktop, no duplicate contents card in the flow).
      It highlights the current section and opens a collapsed section when its link
      is clicked, and its space is reserved so it never overlaps the content at any
      width. Narrow screens fall back to a FAB + drawer with the same links.
- [ ] Every interactive control is ≥44px, uses a real SVG icon, and has hover +
      ripple feedback. No tiny mono glyphs as buttons.
- [ ] Every top-level section is itself collapsible (the section header is the
      `<summary>`), not just the items inside it. Expand/collapse-all hits both
      levels. Section summaries show their item counts.
- [ ] Every heavy body section is a collapsible panel, and they all use the
      **same** panel component — no bare `<h2>`+prose sections sitting next to
      collapsible cards. An Expand all / Collapse all control is present if there
      are more than a few panels.
- [ ] Heavy detail is in collapsed panels; the skim length is short.
- [ ] Every chart passes "earn the ink" — no chart restating one number.
- [ ] Body is a sans (no serif body, no italic verdict/pull-quote); display face
      is distinctive, not Inter/Roboto/Arial/bare system-ui.
- [ ] Header is compact — verdict + stat tiles visible without scrolling; no
      oversized hero pushing information below the fold.
- [ ] No text below 12px anywhere (icon glyphs excepted). Check chart tick labels,
      table headers, badges, captions and metadata keys specifically.
- [ ] No card is padded out with empty space — cards shrink to content
      (`align-items:start`), and the TOC is reachable near the top of the body.
- [ ] Nothing overflows its container: chart labels fit inside the card at the
      narrowest supported width, not just at desktop.
- [ ] Dark theme, tokens used consistently, semantic colors mean the same thing
      throughout.
- [ ] Metadata strip present with only real fields.
- [ ] No page-level horizontal scroll; wide content scrolls in its own box; SVGs
      have `viewBox` + `max-width:100%`.
- [ ] Any library/animation/3D present is justified by information, not flair.
- [ ] Fluff cut — no restated summaries, no filler intro, professional register.
- [ ] Single self-contained `index.html`; own CSS/JS inline; libs via CDN.
