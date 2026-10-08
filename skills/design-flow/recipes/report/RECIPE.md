# Report recipe

A figure-first report is one self-contained `index.html`: four to six one-line bullets a reader can scan in seconds, then numbered chapters made of interactive figures with one-line captions. Detail lives in tooltips, click panels and an appendix, not in paragraphs. Build from `assets/starter/`. The finished reference build (the Skills Assessment report) stays with the work copy of this recipe in AyaHelix/skills; it is optional reading, never a requirement.

## When to use it

- A research report, build-out map, tech design, readiness review or architecture write-up.
- Any page whose job is to get a point across to people who will not read walls of text.

Usually run by `design-flow` through a door (`anshul-design`, or a work door) with the level answers and the chosen look already decided; do not re-ask them. Not for product UI (that is the profile's `ui_kit` skill when it has one). If no look fits, run the bake-off recipe (`../bakeoff/RECIPE.md`) and come back with the picks.

## Before you build

1. Read `anshul-ui-standards-v2` for the mechanics every page must have: targets, focus, states, the verification loop.
2. Writing rules. Write the whole report for a smart reader who is not technical: the opening bullets, captions, tooltips, detail panels and appendix. Give every term a plain phrase the first time it appears, for example "cache hit rate (how often the saved copy is used instead of fetching again)". Run all the copy through the `humanizer` skill when it is installed (the profile's `copy` skill). With or without it, every visible string follows these rules: no em or en dashes, straight quotes, sentence case, active voice, no stock AI words, keep every fact.
   Why: on 2026-10-08 Anshul said "humanize the entire report. i dont understand it."
   No vendor benchmark numbers (model-card scores, launch-post charts) as evidence anywhere in the report. Use only numbers measured on Anshul's own data, or numbers that bear directly on him: cost, size, time, quota.
   Why: on 2026-10-08 Anshul said "never use any measures that we haven't either measured or is directly relevant to us".
3. Use the look design-flow chose. Without one, the default is this recipe's Plum theme with the palette picker. Do not fall back to Material or any other house palette. When the look's forms include stat tiles or a headline-number block (for example `instrument-hud`, `toy-blocks`), drop those forms for a report and keep the rest of the look; they stay valid for dashboards. Why: on 2026-10-08 Anshul, shown a row of stat cards, said "never put these in the report."

## Recipe

1. Facts first. Collect every number, name and quote with its source. Put them in `d-data.js` as named blocks (format in `references/viz-pack.md`). Invent nothing. Label estimates and emphasis weights as such on the figure.
2. Outline the pyramid. The title, the purpose line, the opening bullets, then chapters 01 to 05 at most, inside the length budget below. The title is the question the report answers or the decision it supports, in plain words, 14 words or fewer. It is a normal page heading: 24 to 28 px at 1440 (never over 32), weight 600 to 700, no display type, no italic or coloured accent words, no slogan. Directly under it sits one short line at body size: what the source is and what the reader needs to do now, or "Nothing to decide yet" and why.
   Why: on 2026-10-08 Anshul said of a display headline ("A small model that sees the footage, offline."): "this doesn't help at all. remove it and put something actually useful there. like what is this report for exactly." Of its size he said "it doesn't need to be that fucking huge."
   Then four to six one-line bullets, starting within about 150 px of the top of the content, with nothing else above them: no label, badge, "Verdict" tag, eyebrow or paragraph. Each bullet starts with its key number or phrase in bold with a soft highlight in the bullet's hue, then says in plain words what it means. A coloured dot or small icon per bullet is optional. Together they say what this is, what it means for the reader and what to do. These bullets are the takeaways; there is no second list. There is no row of stat tiles or headline numbers: a number that matters leads a bullet or goes into a real figure. Each chapter is figures plus captions plus at most one short list. Details in `references/structure.md`.
   Why: on 2026-10-08 Anshul said "at the top of the report put a plain english thing, no label, just the text." Shown a plain paragraph there, he said "that's a huge wall of text at top of report. i need something i can scan fast, bullet points, make it more readable, highlights, other visual things to scan the points easily." Shown a row of stat cards (FACT 740M, FITS 284MB, KEEP 0.885, SPIKE 2s, COST $0, 1 BENT), he said "never put these in the report."
3. Turn text into figures. For each block of prose, pick a figure from `references/components.md` using the map in `references/viz-pack.md`. The opening bullets and the captions stay as text. Use 3D only when it encodes structure and has a 2D fallback.
4. Build from parts. Copy `assets/starter/` next to your work. Fill `c-body.html`, `d-data.js` and the figure functions in `f-figures.js`, then run `sh build.sh` (Node only) to write `index.html` one folder up. One file, inline CSS and JS, libraries and fonts from CDN only (list in `references/structure.md`).
5. Style with tokens. `assets/starter/b1-tokens.css` holds five palettes, each with a dark and a light theme. Components use tokens only. Category hues go on `--lc`. Large fills blend the hue at 30 to 35 percent into the surface. Details in `references/tokens.md`.
6. Keep motion on a budget. Page-load choreography, scroll reveals, draw-in strokes, spring press. Lights blink only on the active tab count and missing readiness cells. Details in `references/motion-budget.md`.
7. Write the captions last. One takeaway per caption, 12 words or fewer in every edition. The lean edition adds a "Details" link to the appendix entry.
8. Verify with Playwright. Run `node assets/shoot.mjs <index.html> --key <slug>` (no setup: it finds or installs Playwright itself), read the JSON summary, look at the PNGs yourself, fix, re-shoot. Its `opening` line fails a page with a title over 14 words or 32 px, text over 48 px anywhere, italic text in a heading or the overview, a missing purpose line, a label, eyebrow, verdict card, paragraph or stat tiles at the top, bullets starting more than 150 px below the top of the overview, fewer than four or more than six opening bullets, a bullet without a bold lead, or a bullet that wraps past one line at 1440; its `length` line fails a page over the length budget. Details in `references/verification.md`. Open the page in Chrome as sections land so the user sees progress.
9. Publish. Follow `references/publish.md`: publish to here.now with the access mode the door's profile says, post the link where the work is tracked. Without here.now credentials the page stays in its folder and you say so.

## Length budget

Shorter wins. These caps are hard:

- The first screen answers everything: the title, the purpose line, the four to six opening bullets and one figure, all visible at 1440 by 900 without scrolling.
- With every chapter open, the page fits in about three screens at 1440 by 900 (about 2,700 px) before the appendix.
- At most five chapters. No chapter that only restates another.
- Captions are 12 words or fewer, in every edition.
- A detail that does not change a decision goes to the collapsed appendix, or is cut.

`assets/shoot.mjs` checks every cap except the restating one, in its `opening` and `length` lines.

Why: on 2026-10-08 Anshul said "any future reports need to be fucking shorter."

## Rules that do not bend

- The page opens with a plain title (the question or decision, 24 to 28 px, never over 32), a one-line purpose, then four to six one-line bullets, each led by a highlighted key number or phrase. No verdict label, badge, eyebrow, opening paragraph, stat tiles or row of headline numbers anywhere in the report. Why: on 2026-10-08 Anshul said "at the top of the report put a plain english thing, no label, just the text." Shown a plain paragraph there, he said "that's a huge wall of text at top of report. i need something i can scan fast, bullet points, make it more readable, highlights, other visual things to scan the points easily." Shown a row of stat cards (FACT 740M, FITS 284MB, KEEP 0.885, SPIKE 2s, COST $0, 1 BENT), he said "never put these in the report."
- No italic display or accent type: no italic headings, no italic serif for emphasis, no italic pull-quotes. Emphasis is weight or colour only. Why: on 2026-10-08 Anshul said "never use that fucking stupid italic font".
- 12 px minimum text, 44 px minimum targets, no horizontal page scroll at 1440 or 800 wide, zero console errors.
- Status is never colour alone. Every light sits next to a word or an icon.
- Text uses text tokens, never the series colour.
- Body background is a solid colour. Patterns and gradients live on `body::before`.
- Theme and palette keys in `localStorage` are namespaced per report: `<slug>-theme`, `<slug>-palette`.
- No emoji as icons. Icons are inline SVG symbols with Lucide shapes.
- No vote widget on a final, no Material chassis, no Claude Artifact copies.
- Every number on the page traces to a source named in the appendix or the sources chapter, and was measured on Anshul's own data or bears directly on him (cost, size, time, quota). Never a vendor benchmark. Why: on 2026-10-08 Anshul said "never use any measures that we haven't either measured or is directly relevant to us".

## Lean edition

Ship the lean edition when the audience is leadership or the page is going into a meeting. Same opening bullets, same figures, captions with a Details link, all other prose moved to a numbered appendix with anchors, and an optional prototypes chapter before the appendix. The steps are in `references/structure.md`.

## Files in this recipe

| Path | Holds |
| --- | --- |
| `references/structure.md` | Sections, markup, tabs, panels, figures, copy rules, lean edition, libraries |
| `references/components.md` | The catalog of figure types, what each encodes, where it lives in the reference build |
| `references/viz-pack.md` | The text-to-diagram method and the data block format |
| `references/tokens.md` | Palettes, category hues, type, shape, easing, storage keys |
| `references/motion-budget.md` | Load choreography, reveals, the light budget, fallbacks |
| `references/verification.md` | The Playwright loop, thresholds, known pitfalls |
| `references/publish.md` | here.now, the access gate, where to post links |
| `assets/starter/` | Head, tokens, component CSS, core JS, body skeleton, boot, build script |
| `assets/shoot.mjs` | The verification script |
