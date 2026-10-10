# Report recipe

A figure-first report is one self-contained `index.html`: a short lead statement in plain English that a reader with no context can follow, four to six one-line bullets a reader can scan in seconds, then numbered chapters made of interactive figures with one-line captions. Detail lives in tooltips, click panels and an appendix, not in paragraphs. Every report also carries an Ask panel: a chat with Claude about the page, with tools that point at figures, read their data and look at what the reader sees. Build from `assets/starter/`. The finished reference build (the Skills Assessment report) stays with the work copy of this recipe in AyaHelix/skills; it is optional reading, never a requirement.

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
2. Outline the pyramid. The title, the lead statement with its Your call strip and side card, the opening bullets, then chapters 01 to 05 at most, inside the length budget below. The title is the question the report answers or the decision it supports, in plain words, 14 words or fewer. It is a normal page heading: 24 to 28 px at 1440 (never over 32), weight 600 to 700, no display type, no italic or coloured accent words, no slogan.
   Why: on 2026-10-08 Anshul said of a display headline ("A small model that sees the footage, offline."): "this doesn't help at all. remove it and put something actually useful there. like what is this report for exactly." Of its size he said "it doesn't need to be that fucking huge."
   Directly under the title sits the lead statement: two or three short paragraphs in plain English that assume the reader has no context. Say what the situation is today; what was done, and how (a real run, a check against old records, or a calculation); and what was found, with the key numbers, each one clear about whether it was measured or worked out. Every term gets a plain gloss the first time, for example "a pull request (a proposed change waiting to be merged)". No codes, ticket numbers, model names or job names unless glossed. Type: 19 px on desktop, 18 px on narrow screens (under 900 px), line height 1.7, about 66ch wide (never over 70ch), weight 400, full text colour (`--txt`). Never the secondary or grey text tokens (`--txt2`, `--txt3`) anywhere in the opening. Highlight only the three to five phrases that carry the point: weight 600 and a thin 2 px underline in the phrase's hue at about 70 percent, offset about 5 px. No filled backgrounds, boxes or pills. After the statement comes the Your call strip (an arrow icon, surface background, 3 px left border in the accent): what the reader needs to decide, or "Nothing to decide yet" and why. On the right sits a side card, such as "How we checked": the method in three numbered steps, plus one line on what was not done or is not proven. It stacks under the statement below 900 px. The markup is `div.lead` in `assets/starter/c-body.html`.
   Why: on 2026-10-10 Anshul said "the first bullet point should be the main point spelled out properly and in detail as a proper sentence with like highlighted words that make sense", then "maybe not the first bullet point, but just the first statement after the title, and not tiny font like the 'Replay of 83 PR pushes since Sep 18. Read the plan on LUM-137 and answer its five questions.' It should be an easy to read, visually pleasing to read like I said with the highlights, and any other things you think will make it more understandable. it should always be in plain english and not assume the reader knows all context." He also said "do you htink this grey text is easy to read???", "those highlights are too intense", "it should be readable, dont you understand that?" and "i have no idea what you actually did you test the runs. why isn't it fucking obvious". He approved the result the same day. Basis: dark-mode readability guidance (near-white text on dark at 10:1 to 15:1 contrast, generous line height) and Nielsen Norman Group's finding that bold keywords help scanning only when used sparingly.
   Then four to six one-line bullets right after the lead, with nothing else between: no label, badge, "Verdict" tag, eyebrow or extra paragraph. Each bullet starts with its key number or phrase in bold, in the same calm style as the lead highlights (weight 600, thin underline in the bullet's hue, no fill), then says in plain words what it means. A coloured dot or small icon per bullet is optional. Together they say what this is, what it means for the reader and what to do. These bullets are the takeaways; there is no second list. There is no row of stat tiles or headline numbers: a number that matters leads a bullet or goes into a real figure. Each chapter is figures plus captions plus at most one short list. Details in `references/structure.md`.
   Why: on 2026-10-08 Anshul said "at the top of the report put a plain english thing, no label, just the text." Shown a plain paragraph there, he said "that's a huge wall of text at top of report. i need something i can scan fast, bullet points, make it more readable, highlights, other visual things to scan the points easily." Shown a row of stat cards (FACT 740M, FITS 284MB, KEEP 0.885, SPIKE 2s, COST $0, 1 BENT), he said "never put these in the report."
3. Turn text into figures. For each block of prose, pick a figure from `references/components.md` using the map in `references/viz-pack.md`. The lead statement, the opening bullets and the captions stay as text. Use 3D only when it encodes structure and has a 2D fallback.
4. Build from parts. Copy `assets/starter/` next to your work. Fill `c-body.html`, `d-data.js` and the figure functions in `f-figures.js`. Look for the project's glossary with `node assets/glossary.mjs --repo <project root> --out <starter copy>/h-glossary.js` (see Glossary hover below), then run `sh build.sh` (Node only) to write `index.html` one folder up. One file, inline CSS and JS, libraries and fonts from CDN only (list in `references/structure.md`). The build adds the Ask panel (`h-ask.css`, `i-ask.js`) and runs `assets/ask-build.mjs`, which freezes the report text into the page for Claude and writes `.herenow/proxy.json` next to it. `ASK=off sh build.sh` leaves the panel out. Details in `references/ask-panel.md`.
5. Style with tokens. `assets/starter/b1-tokens.css` holds five palettes, each with a dark and a light theme. Components use tokens only. Category hues go on `--lc`. Large fills blend the hue at 30 to 35 percent into the surface. Details in `references/tokens.md`.
6. Keep motion on a budget. Page-load choreography, scroll reveals, draw-in strokes, spring press. Lights blink only on the active tab count and missing readiness cells. Details in `references/motion-budget.md`.
7. Write the captions last. One takeaway per caption, 12 words or fewer in every edition. The lean edition adds a "Details" link to the appendix entry.
8. Verify with Playwright. Run `node assets/shoot.mjs <index.html> --key <slug> --repo <project root>` (no setup: it finds or installs Playwright itself), read the JSON summary, look at the PNGs yourself, fix, re-shoot. Its `opening` line fails a page with a title over 14 words or 32 px, text over 48 px anywhere or italic text in a heading or the overview; a missing lead statement, lead text under 18 px or wider than 70ch, fewer than three or more than five highlights, a highlight or bullet lead with a background fill, any overview text under 10:1 contrast against what is behind it (dark and light), a missing Your call strip or side card, or a first screen at 1440 by 900 that does not show the title, lead, strip and card in full with the first bullet on it; a label, eyebrow, verdict card, stat tiles or a paragraph outside the lead; fewer than four or more than six opening bullets, a bullet without a bold lead, or a bullet that wraps past one line at 1440. It lists each failure in plain words under `fails`; its `length` line fails a page over the length budget; its `glossary` lines fail a page whose glossary terms do not open on hover, focus and Escape, or whose glossary does not match what `--repo` declares. Details in `references/verification.md`. Open the page in Chrome as sections land so the user sees progress. With the panel on, also run `node assets/ask-test.mjs <index.html>`: it drives every Ask tool against a strict mock of the Messages API, so no key is needed, and writes `shots-ask/`.
9. Publish. Follow `references/publish.md`: publish to here.now with the access mode the door's profile says, post the link where the work is tracked. Publish the folder with its `.herenow/` manifest. If `ask-build.mjs` says `ANTHROPIC_API_KEY` is not set, tell the owner the one line to set it; never set it yourself. Without here.now credentials the page stays in its folder and you say so.

## Length budget

Shorter wins. These caps are hard:

- The first screen answers everything: the title, the lead statement, the Your call strip and the side card are fully visible at 1440 by 900 without scrolling, and the opening bullets start on that screen.
- With every chapter open, the page fits in about three screens at 1440 by 900 (about 2,700 px) before the appendix.
- At most five chapters. No chapter that only restates another.
- Captions are 12 words or fewer, in every edition.
- A detail that does not change a decision goes to the collapsed appendix, or is cut.

`assets/shoot.mjs` checks every cap except the restating one, in its `opening` and `length` lines.

Why: on 2026-10-08 Anshul said "any future reports need to be fucking shorter."

## Glossary hover

When the project has a glossary, every glossary term in body text, bullets, captions, detail panels and figure labels gets a dotted underline. Hovering, focusing (each term is in the tab order) or tapping one shows a small popover, 280 px wide at most, with the term in bold and its definition. Moving away, Escape or a tap elsewhere closes it. Headings, links, code and buttons are left alone. With no glossary nothing is added to the page.

Find it at build time, every time; never assume it was mentioned in chat. `node assets/glossary.mjs --repo <project root> --out <starter copy>/h-glossary.js` searches in this order and the first hit wins:

1. A `Glossary:` line in the project's `AGENTS.md` or `CLAUDE.md`, naming a file path or a URL.
2. `docs/GLOSSARY.md`, `GLOSSARY.md`, `docs/glossary.md`, `glossary.md` from the repo root (`git rev-parse --show-toplevel`), any letter case.
3. Any file named `glossary.md`, `.yml`, `.yaml` or `.json` in the top two levels of the repo.

It prints the source it used (`GLOSSARY 4 terms from docs/GLOSSARY.md @ a46ef03 (via conventional file)`), and the page footer shows the same `Glossary: <file> @ <short sha>`. With no hit it prints `GLOSSARY none` and leaves `h-glossary.js` empty, so the build skips it. A Linear document URL cannot be fetched by the script: it prints `GLOSSARY needs-linear <url>`; read the document with the Linear MCP `get_document` tool, save the markdown, and rerun with `--from <file> --label "<url>"`.

The file format. Markdown with one `## Term` heading per term, an optional `Also: alias, alias` line, then the definition paragraph:

```markdown
## Vault
Also: archive
Where every original file is kept, on Backblaze B2. Nothing in it is ever edited.
```

A Markdown table also works: term in the first column, definition in the second, aliases in an optional `Also` column. YAML (`- term:`, `definition:`, `aliases:`) and JSON (`[{term, definition, aliases}]` or `{term: definition}`) are read too. Definitions are cut to two sentences and cleaned to the copy rules. Plurals match (`Layers` finds `Layer`); a name with two capitals or a digit, such as `B2`, matches its exact case only.

The Ask panel should put the glossary in its context too: when present, the page exposes it as `window.REPORT_GLOSSARY`, shaped `{source, terms: [{t, d, a}]}`.

Why: on 2026-10-08 Anshul said "if i hover over anything that's in the glossary, it will show a tiny popup with the glossary definition... if there is a glossary for this project, add that, but otherwise, don't." and "when the skill is invoked from another project, it should look for the glossary, cuz maybe it's not in the chat context."

## Rules that do not bend

- The page opens with a plain title (the question or decision, 24 to 28 px, never over 32), then the lead statement: two or three plain paragraphs for a reader with no context, at 19 px (18 px under 900), line height 1.7, about 66ch, weight 400, full text colour, with three to five highlighted phrases (weight 600, thin 2 px underline in the phrase's hue, no fill). The Your call strip follows it and the "How we checked" side card sits beside it. Then four to six one-line bullets, each led by a key number or phrase in the same calm style. Never grey text in the opening: every opening text reaches 10:1 contrast. No verdict label, badge, eyebrow, paragraph outside the lead, stat tiles or row of headline numbers anywhere in the report. Why: on 2026-10-10 Anshul said "maybe not the first bullet point, but just the first statement after the title, and not tiny font like the 'Replay of 83 PR pushes since Sep 18. Read the plan on LUM-137 and answer its five questions.' It should be an easy to read, visually pleasing to read like I said with the highlights, and any other things you think will make it more understandable. it should always be in plain english and not assume the reader knows all context.", "do you htink this grey text is easy to read???", "those highlights are too intense" and "it should be readable, dont you understand that?" (all the quotes are in step 2). On 2026-10-08 he said "at the top of the report put a plain english thing, no label, just the text." Shown a plain paragraph there, he said "that's a huge wall of text at top of report. i need something i can scan fast, bullet points, make it more readable, highlights, other visual things to scan the points easily." Shown a row of stat cards (FACT 740M, FITS 284MB, KEEP 0.885, SPIKE 2s, COST $0, 1 BENT), he said "never put these in the report."
- No italic display or accent type: no italic headings, no italic serif for emphasis, no italic pull-quotes. Emphasis is weight or colour only. Why: on 2026-10-08 Anshul said "never use that fucking stupid italic font".
- 12 px minimum text, 44 px minimum targets, no horizontal page scroll at 1440 or 800 wide, zero console errors.
- Status is never colour alone. Every light sits next to a word or an icon.
- Text uses text tokens, never the series colour.
- Body background is a solid colour. Patterns and gradients live on `body::before`.
- Theme and palette keys in `localStorage` are namespaced per report: `<slug>-theme`, `<slug>-palette`.
- No emoji as icons. Icons are inline SVG symbols with Lucide shapes.
- No vote widget on a final, no Material chassis, no Claude Artifact copies.
- No key in the page, ever. The Ask panel reaches Claude only through the site's here.now proxy routes, which inject `ANTHROPIC_API_KEY` from the owner's account variables. The owner sets that variable; never set it, print it or write it to a file. Why: on 2026-10-08 Anshul asked for a chat in every report that "should just use like a claude session underneath"; the key stays his.
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
| `references/ask-panel.md` | The Ask panel: switch, model, how the key is held, context, tools, cost guard, saving threads, tests |
| `assets/starter/` | Head, tokens, component CSS, core JS, body skeleton, boot, build script |
| `assets/shoot.mjs` | The verification script |
| `assets/ask-build.mjs` | Build step for the Ask panel: freezes the report context, writes `.herenow/proxy.json`, checks the variables |
| `assets/ask-test.mjs` | Drives every Ask tool in a browser against a mock Messages API; local or on the live page |
| `assets/glossary.mjs` | Finds and parses the project's glossary, writes `h-glossary.js` for the build (empty when there is none) |
| `assets/glossary-runtime.js` | The hover popover code `glossary.mjs` bundles into `h-glossary.js` |
