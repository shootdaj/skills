# Report recipe

A figure-first report is one self-contained `index.html`: a lead of three or four one-line bullets with their key words in bold, scannable in seconds, then numbered chapters made of interactive figures with one-line captions. Detail lives in tooltips, click panels and an appendix, not in paragraphs. Every report also carries an Ask panel: a chat with Claude about the page, with tools that point at figures, read their data and look at what the reader sees. Build from `assets/starter/`. The finished reference build (the Skills Assessment report) stays with the work copy of this recipe in AyaHelix/skills; it is optional reading, never a requirement.

## When to use it

- A research report, build-out map, tech design, readiness review or architecture write-up.
- Any page whose job is to get a point across to people who will not read walls of text.

Usually run by `design-flow` through a door (`anshul-design`, or a work door) with the level answers and the chosen look already decided; do not re-ask them. Not for product UI (that is the profile's `ui_kit` skill when it has one). If no look fits, run the bake-off recipe (`../bakeoff/RECIPE.md`) and come back with the picks.

## Before you build

1. Read `anshul-ui-standards-v2` for the mechanics every page must have: targets, focus, states, the verification loop.
2. Writing rules. Write the whole report for a smart reader who is not technical: the lead bullets, captions, tooltips, detail panels and appendix. Give a term the reader may not know a plain phrase the first time it appears, for example "cache hit rate (how often the saved copy is used instead of fetching again)"; never gloss terms the reader already knows. Run all the copy through the `humanizer` skill when it is installed (the profile's `copy` skill). With or without it, every visible string follows these rules: no em or en dashes, straight quotes, sentence case, active voice, no stock AI words, keep every fact.
   Why: on 2026-10-08 Anshul said "humanize the entire report. i dont understand it."
   No vendor benchmark numbers (model-card scores, launch-post charts) as evidence anywhere in the report. Use only numbers measured on Anshul's own data, or numbers that bear directly on him: cost, size, time, quota.
   Why: on 2026-10-08 Anshul said "never use any measures that we haven't either measured or is directly relevant to us".
3. Use the look design-flow chose. Without one, the default is this recipe's Plum theme with the palette picker. No house palette by default; Material (`material-report`) only when picked. When the look's forms include stat tiles or a headline-number block (for example `instrument-hud`, `toy-blocks`), drop those forms for a report and keep the rest of the look; they stay valid for dashboards. Why: on 2026-10-08 Anshul, shown a row of stat cards, said "never put these in the report."

## Recipe

1. Facts first. Collect every number, name and quote with its source. Put them in `d-data.js` as named blocks (format in `references/viz-pack.md`). Invent nothing. Label estimates and emphasis weights as such on the figure.
   Every report also fills the context brief: the `CONTEXT` block at the top of `d-data.js`, about the work behind the page. It holds the project, the ticket or PR links and the goal the work serves; why the report exists, who asked for it and their words; how it was made (the data sources, what was actually run: a real run, old records or a calculation, where it ran, the dates, the tools and models, what was not tested); what is decided, what is pending and what the reader is asked to do; how the report changed between versions, as dated lines; and where the project glossary lives. Every field is plain English and required. A fact you do not have is written "not recorded", never guessed. The Ask panel hands the brief to Claude before the page text, so a reader can ask why the report exists, how it was made and what happens next; the page shows it only as a collapsed "About this report" entry at the end of the appendix. The shape is in `references/ask-panel.md`, "Context brief".
   Why: on 2026-10-10 Anshul said "make a change where the AI knows the context about the work that the report is about. how it was created, etc. it should know the basics of whats going on with the report etc and why its there what problem its for all that stuff".
2. Outline the pyramid. The title, the lead bullets with their Your call strip and side card, then as many chapters as the content needs, following the length rules below. The title is the question the report answers or the decision it supports, in plain words, 14 words or fewer. It is a normal page heading: 24 to 28 px at 1440 (never over 32), weight 600 to 700, no display type, no italic or coloured accent words, no slogan.
   Why: on 2026-10-08 Anshul said of a display headline ("A small model that sees the footage, offline."): "this doesn't help at all. remove it and put something actually useful there. like what is this report for exactly." Of its size he said "it doesn't need to be that fucking huge."
   Directly under the title sits the lead: three or four bullets, one line each (a single wrap at 1440 is the limit). Each bullet carries its one to three key words in bold: names, numbers, verdicts. No paragraphs. Do not gloss terms the reader already knows; plain words still, never codes or job names the reader would not recognise. Emphasis is bold (weight 700, full text colour), never an underline or a fill. Each bullet has a small dot in its hue. Together they say what this is, what was found and what it means; they are the takeaways, and there is no second list. Type: 19 px on desktop, 18 px under 900 px, full text colour (`--txt`). Never the secondary or grey text tokens (`--txt2`, `--txt3`) anywhere in the opening. When there is a decision, the Your call strip follows (an arrow icon, surface background, 3 px left border in the accent): "Your call: **<the decision>**, or say what to change." With nothing to decide it says "Nothing to decide yet" and why. On the right sits the side card, "How we checked": two to four numbered steps with their key words in bold, then a "Not tested: …" line. It stacks under the lead below 900 px. Then straight into the evidence: no recap list, icon list, summary box or before-and-after box that repeats the lead, and no row of stat tiles or headline numbers (a number that matters goes in a bullet or a real figure). Captions are one short line with the names and numbers in bold. Each chapter is figures plus captions plus at most one short list. The markup is `div.lead` with `ul.lead-lines` in `assets/starter/c-body.html`; details in `references/structure.md`.
   Why: on 2026-10-17 Anshul, shown a lead of two paragraphs, said "this is too much text to read, and its not easily scannable. bolden the main words so its easy to scan". Of the icon recap list and the before-and-after box under it he asked "do these still make sense to have? idk if they add any value"; they were dropped, and he approved the page with three or four bold bullets, the Your call strip and the How we checked card. This replaces the 2026-10-10 lead paragraphs and the separate four to six opening bullets. Earlier rules that still hold: on 2026-10-10 he said "it should always be in plain english and not assume the reader knows all context", "do you htink this grey text is easy to read???" and "i have no idea what you actually did you test the runs. why isn't it fucking obvious" (hence the How we checked card); on 2026-10-08, shown a row of stat cards (FACT 740M, FITS 284MB, KEEP 0.885, SPIKE 2s, COST $0, 1 BENT), he said "never put these in the report." Basis: Nielsen Norman Group's finding that bold keywords help scanning only when used sparingly.
3. Turn text into figures. For each block of prose, pick a figure from `references/components.md` using the map in `references/viz-pack.md`. The lead bullets, the Your call strip and the captions stay as text. Use 3D only when it encodes structure and has a 2D fallback.
   Then ask of each figure: does something move from place to place, and is the route, order or timing the point? Yes: build it as a 3D flow figure, `../flow3d/RECIPE.md` (it ships its flat fallback). For example data through a pipeline with a branch and a merge, a timeline whose gaps matter, routes between real places on a map, or money or people moving through steps. No: a flat figure. For example comparing amounts (cost per service, a share of a total) reads faster as bars, a Sankey or a waffle, and a status grid or ranking has nothing moving. If the 3D view shows nothing the flat one hides, ship the flat one.
   Why: on 2026-10-11 Anshul asked for the footage-search report's 3D figures as a recipe "to show flow diagrams and maps, like data flow, time flow, etc. like whatever flows basically", and said "it should be used by reports when appropriate".
4. Build from parts. Copy `assets/starter/` next to your work. Fill `c-body.html`, `d-data.js` and the figure functions in `f-figures.js`. Look for the project's glossary with `node assets/glossary.mjs --repo <project root> --out <starter copy>/h-glossary.js` (see Glossary hover below), then run `sh build.sh` (Node only) to write `index.html` one folder up. One file, inline CSS and JS, libraries and fonts from CDN only (list in `references/structure.md`). The build adds the Ask panel (`h-ask.css`, `i-ask.js`) and runs `assets/ask-build.mjs`, which freezes the report text into the page for Claude and writes `.herenow/proxy.json` next to it. `ASK=off sh build.sh` leaves the panel out. Details in `references/ask-panel.md`.
5. Style with tokens. `assets/starter/b1-tokens.css` holds five palettes, each with a dark and a light theme. Components use tokens only. Category hues go on `--lc`. Large fills blend the hue at 30 to 35 percent into the surface. Details in `references/tokens.md`.
6. Keep motion on a budget. Page-load choreography, scroll reveals, draw-in strokes, spring press. Lights blink only on the active tab count and missing readiness cells. Details in `references/motion-budget.md`.
7. Write the captions last. One takeaway per caption, 12 words or fewer in every edition. The lean edition adds a "Details" link to the appendix entry.
8. Verify. Report tests are OFF unless the project's AGENTS.md turns them on with the line `Report tests: ON (design-flow shoot.mjs and ask-test.mjs)`. When off: don't run `shoot.mjs` or `ask-test.mjs`; after publishing, load the live URL once and confirm the page renders. Either way, look at the first screen yourself: the lead is three or four bullets with bold key words in each, no paragraphs, nothing underlined, and no recap list or box after it that repeats the lead.

   When on: verify with Playwright. Run `node assets/shoot.mjs <index.html> --key <slug> --repo <project root>` (no setup: it finds or installs Playwright itself), read the JSON summary, look at the PNGs yourself, fix, re-shoot. Its `opening` line fails a page with a title over 14 words or 32 px, text over 48 px anywhere or italic text in a heading or the overview; a missing lead, fewer than three or more than four lead bullets, a paragraph in the lead, lead text under 18 px, a bullet without a bold key word, a bullet that runs past two lines at 1440, underlined emphasis, a bold word with a background fill, a recap list or box after the lead, any overview text under 10:1 contrast against what is behind it (dark and light), a missing Your call strip or side card, or a first screen at 1440 by 900 that does not show the title, bullets, strip and card in full; a label, eyebrow, verdict card, stat tiles or a paragraph outside the lead. It lists each failure in plain words under `fails`; its `length` line fails a caption over 12 words and reports page length and chapter count as information only; its `glossary` lines fail a page whose glossary terms do not open on hover, focus and Escape, or whose glossary does not match what `--repo` declares. Details in `references/verification.md`. Open the page in Chrome as sections land so the user sees progress. Its `about` line fails a page without the collapsed "About this report" entry as the last entry of `#appendix`, or one that leaves out a fact from the brief. With the panel on, also run `node assets/ask-test.mjs <index.html>`: it drives every Ask tool against a strict mock of the Messages API, so no key is needed, and writes `shots-ask/`. It fails when the context brief is missing, a field is empty, or the brief does not reach Claude first, before the page text.
9. Publish. Follow `references/publish.md`: publish to here.now with the access mode the door's profile says (the personal door says only-you), verify the gate from outside, and post the link where the work is tracked. The Ask panel stays on unless the user turned it off for this page. Publish the folder with its `.herenow/` manifest. If `ask-build.mjs` says `ANTHROPIC_API_KEY` is not set, tell the owner the one line to set it; never set it yourself. Without here.now credentials the page stays in its folder and you say so.

## Length

- The first screen stays short and scannable: the title, the lead bullets, the Your call strip and the "How we checked" side card are fully visible at 1440 by 900 without scrolling.
- After that, use as many chapters as the content needs to be understood. Each one earns its place: no filler, no chapter that only restates another.
- Detail goes in collapsible parts (closed chapters, click panels) or the appendix.
- Captions are 12 words or fewer, in every edition.

`assets/shoot.mjs` checks the first screen in its `opening` line and captions in its `length` line. It reports page length and chapter count as information only; neither fails the page.

Why: on 2026-10-08 Anshul said "any future reports need to be fucking shorter." On 2026-10-11 he asked "why do all reports now only produce like 3/4 sections" and said "yes" to keeping the first screen short and dropping the five-chapter, three-screen cap.

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

- The page opens with a plain title (the question or decision, 24 to 28 px, never over 32), then the lead: three or four one-line bullets, each with its one to three key words in bold, no paragraphs, bold never underlined. The Your call strip follows ("Your call: **<decision>**, or say what to change") and the "How we checked" side card sits beside it (two to four numbered steps, then "Not tested: …"). Then straight into the evidence: no recap list or box that repeats the lead. Never grey text in the opening: every opening text reaches 10:1 contrast. No verdict label, badge, eyebrow, paragraph outside the lead, stat tiles or row of headline numbers anywhere in the report. Why: on 2026-10-17 Anshul said "this is too much text to read, and its not easily scannable. bolden the main words so its easy to scan" and dropped the recap blocks because they added no value (all the quotes are in step 2). On 2026-10-10 he said "do you htink this grey text is easy to read???"; on 2026-10-08, shown a row of stat cards, he said "never put these in the report."
- No italic display or accent type: no italic headings, no italic serif for emphasis, no italic pull-quotes. Emphasis is weight or colour only. Why: on 2026-10-08 Anshul said "never use that fucking stupid italic font".
- 12 px minimum text, 44 px minimum targets, no horizontal page scroll at 1440 or 800 wide, zero console errors.
- Status is never colour alone. Every light sits next to a word or an icon.
- Text uses text tokens, never the series colour.
- Body background is a solid colour. Patterns and gradients live on `body::before`.
- Theme and palette keys in `localStorage` are namespaced per report: `<slug>-theme`, `<slug>-palette`.
- No emoji as icons. Icons are inline SVG symbols with Lucide shapes.
- No vote widget on a final, no Claude Artifact copies.
- No key in the page, ever. The Ask panel reaches Claude only through the site's here.now proxy routes, which inject `ANTHROPIC_API_KEY` from the owner's account variables. The owner sets that variable; never set it, print it or write it to a file. Why: on 2026-10-08 Anshul asked for a chat in every report that "should just use like a claude session underneath"; the key stays his.
- Every number on the page traces to a source named in the appendix or the sources chapter, and was measured on Anshul's own data or bears directly on him (cost, size, time, quota). Never a vendor benchmark. Why: on 2026-10-08 Anshul said "never use any measures that we haven't either measured or is directly relevant to us".

## Lean edition

Ship the lean edition when the audience is leadership or the page is going into a meeting. Same lead bullets, same figures, captions with a Details link, all other prose moved to a numbered appendix with anchors, and an optional prototypes chapter before the appendix. The steps are in `references/structure.md`.

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
| `assets/brief.mjs` | The context brief's required fields, read by `ask-build.mjs` and `ask-test.mjs` |
| `assets/glossary.mjs` | Finds and parses the project's glossary, writes `h-glossary.js` for the build (empty when there is none) |
| `assets/glossary-runtime.js` | The hover popover code `glossary.mjs` bundles into `h-glossary.js` |
