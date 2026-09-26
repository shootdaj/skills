# Report recipe

A figure-first report is one self-contained `index.html`: a verdict, six headline numbers, six takeaways, then numbered chapters made of interactive figures with one-line captions. Detail lives in tooltips, click panels and an appendix, not in paragraphs. Build from `assets/starter/`. The finished reference build (the Skills Assessment report) stays with the work copy of this recipe in AyaHelix/skills; it is optional reading, never a requirement.

## When to use it

- A research report, build-out map, tech design, readiness review or architecture write-up.
- Any page whose job is to get a point across to people who will not read walls of text.

Usually run by `design-flow` through a door (`anshul-design`, or a work door) with the level answers and the chosen look already decided; do not re-ask them. Not for product UI (that is the profile's `ui_kit` skill when it has one). If no look fits, run the bake-off recipe (`../bakeoff/RECIPE.md`) and come back with the picks.

## Before you build

1. Read `anshul-ui-standards-v2` for the mechanics every page must have: targets, focus, states, the verification loop.
2. Read the profile's `copy` skill (humanizer) when it is installed. With or without it, every visible string follows these rules: no em or en dashes, straight quotes, sentence case, active voice, no stock AI words, keep every fact.
3. Use the look design-flow chose. Without one, the default is this recipe's Plum theme with the palette picker. Do not fall back to Material or any other house palette.

## Recipe

1. Facts first. Collect every number, name and quote with its source. Put them in `d-data.js` as named blocks (format in `references/viz-pack.md`). Invent nothing. Label estimates and emphasis weights as such on the figure.
2. Outline the pyramid. One-sentence verdict, six stat tiles, six takeaways, then chapters 01 to 0N. Each chapter is figures plus captions plus at most one short list. Details in `references/structure.md`.
3. Turn text into figures. For each block of prose, pick a figure from `references/components.md` using the map in `references/viz-pack.md`. The verdict and the captions stay as text. Use 3D only when it encodes structure and has a 2D fallback.
4. Build from parts. Copy `assets/starter/` next to your work. Fill `c-body.html`, `d-data.js` and the figure functions in `f-figures.js`, then run `build.sh` to write `index.html`. One file, inline CSS and JS, libraries and fonts from CDN only (list in `references/structure.md`).
5. Style with tokens. `assets/starter/b1-tokens.css` holds five palettes, each with a dark and a light theme. Components use tokens only. Category hues go on `--lc`. Large fills blend the hue at 30 to 35 percent into the surface. Details in `references/tokens.md`.
6. Keep motion on a budget. Page-load choreography, scroll reveals, draw-in strokes, spring press. Lights blink only on stat tiles, the active tab count and missing readiness cells. Details in `references/motion-budget.md`.
7. Write the captions last. One takeaway per caption. In the lean edition, 12 words or fewer plus a "Details" link to the appendix entry.
8. Verify with Playwright. Run `assets/shoot.mjs`, read the JSON summary, look at the PNGs yourself, fix, re-shoot. Details in `references/verification.md`. Open the page in Chrome as sections land so the user sees progress.
9. Publish. Follow `references/publish.md`: publish to here.now with the access mode the door's profile says, post the link where the work is tracked.

## Rules that do not bend

- 12 px minimum text, 44 px minimum targets, no horizontal page scroll at 1440 or 800 wide, zero console errors.
- Status is never colour alone. Every light sits next to a word or an icon.
- Text uses text tokens, never the series colour.
- Body background is a solid colour. Patterns and gradients live on `body::before`.
- Theme and palette keys in `localStorage` are namespaced per report: `<slug>-theme`, `<slug>-palette`.
- No emoji as icons. Icons are inline SVG symbols with Lucide shapes.
- No vote widget on a final, no Material chassis, no Claude Artifact copies.
- Every number on the page traces to a source named in the appendix or the sources chapter.

## Lean edition

Ship the lean edition when the audience is leadership or the page is going into a meeting. Same figures, captions cut to 12 words, all prose moved to a numbered appendix with anchors, and an optional prototypes chapter before the appendix. The steps are in `references/structure.md`.

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
