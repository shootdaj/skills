# Verification

Never present an unverified page. If it was not screenshotted, it is not done. The loop is the one in `anshul-ui-standards-v2/references/verification.md`, with these thresholds.

## Run

```bash
node assets/shoot.mjs /path/to/index.html --key <slug> --repo <project root> [--sections id,id,...] [--only dark|800|fallback]
```

No setup needed. The script loads Playwright through `design-flow/assets/lib/playwright.mjs`: it looks for an installed `@playwright/test` (current folder, global npm root, `~/.design-flow/playwright`) and, the first time none is found, installs it there itself with Chromium (one line on stderr, a minute or two). It drives installed Google Chrome when there is one and Playwright's Chromium otherwise. Optional overrides: `--playwright <package.json>` or `PLAYWRIGHT_PACKAGE_JSON` to use a project's own copy. It creates `shots/` next to the page and prints a JSON summary on stdout.

## What it checks

| Check | Threshold |
| --- | --- |
| Console errors and page errors | Zero, in every context |
| Horizontal page scroll | `scrollWidth <= clientWidth` at 1440 and 800, with all panels expanded |
| Text size | No visible text under 12 px, SVG text measured after its transform |
| Target size | No button, link or input under 44 px in either direction, outside figure bodies |
| Typography | No em dashes, en dashes or curly quotes in the rendered text |
| Themes | Top of page in dark and light at 1440; light also on the two lead chapters |
| Narrow width | Top and the two lead chapters at 800 in dark, top in light; lead text 18 px or more at 800 |
| Opening | At 1440: `h1` comes first (14 words or fewer, 32 px at most), then `div.lead` right under it: lead paragraphs at 18 px or more (the starter uses 19), no wider than 70ch, with three to five `span.hl` highlights, plus `.ask` (the Your call strip) and `.how-card` (the side card); then `ul.opening`. No highlight or bullet lead has a background fill. Every text in the overview outside its figures reaches 10:1 contrast against what is behind it, in dark and in light. No text over 48 px and no italic text in a heading or the overview; four to six bullets, each led by `b` or `strong`, none wrapping past one line; no `.verdict`, `.eyebrow`, `.tile`, `.tiles` or paragraph outside the lead. Each failure is listed in plain words under `fails` |
| First screen | At 1440 by 900 the title, the lead paragraphs, the Your call strip and the side card are fully visible before scrolling, and the first opening bullet is on that screen |
| Glossary | With a glossary in the page: at least one `.gl-term`, hover opens the popover upright (no italic), moving away closes it, focus opens it, Escape closes it, the footer names the source; screenshots `08-1440-<theme>-glossary-hover.png`. Without one: no glossary markup at all. With `--repo`, the page must match what the project declares |
| About this report | With every chapter open: `#appendix` ends with `details#about-report`, collapsed on load, summary "About this report"; opened, it shows every fact and link in `CONTEXT` and keeps the 12 px and 44 px floors; screenshot `09-1440-dark-about.png`. Each failure is listed under `fails` |
| Length | With every chapter open, at most 3.3 screens of 900 px before `#appendix` (the budget says about three), at most five chapters, no caption over 12 words |
| Fallbacks | WebGL stubbed out: the 3D figure still renders its planes. Motion CDN aborted: no page errors and every opening bullet visible |
| Every chapter | One screenshot each with a representative interaction performed (a cell picked, a chip pressed, a node selected) |

## The Ask panel

```bash
node assets/ask-test.mjs /path/to/index.html          # local page, mock Messages API and mock Drive
node assets/ask-test.mjs --live https://<slug>.here.now/   # live page: one real check of the key state, then Claude and the key-not-set 401 mocked, Drive real
```

Live, it first records whether the real proxy has the key (`keySet` in the summary, true when the free count_tokens check passes) and then plays the key-not-set 401 back by interception; locally the mock returns it. It opens the panel in the key-not-set state, then answers through a strict mock that rejects any request the Messages API would reject and checks that history comes back exactly as streamed. It checks that the lead statement (paragraphs, Your call line, side card) reaches Claude as its own entry between the headline and the opening bullets. It fails when the context brief (`CONTEXT` in `d-data.js`) is missing or a field is empty, or when the brief does not reach Claude unchanged as the first entry, before the page text; then it asks why the report exists, how it was made and what happens next, and checks each answer comes from the brief (`ask-05a` to `ask-05c`). It exercises every tool (scroll_to, highlight, read_figure_data, snapshot_region by camera, by drag and as a tool call, ask_about_selection by chip and as a tool call, open_source, save_thread), the menu export, the model switch, a fallback marker, Stop, a reload, light theme, the cost cap, keyboard open and Escape, and 800 and phone widths. Pass means every step held, the mock saw no violations, panel controls are 44 px and text 12 px or larger, and the console stayed clean apart from the deliberate 401 of the key check. Look at `shots-ask/*.png` yourself; the answers in them are the mock's.

## Look at the pictures

The JSON says whether rules held. Only the PNGs say whether it looks right. Open them and check:

- The title, the lead statement, the Your call strip and the side card fit above the fold at 1440 by 900 and the bullets start on it. The title reads as an ordinary heading, not a poster. The lead reads easily for someone with no context: near-white (or near-black in light) text, no grey, three to five calm underlined phrases that carry the point, every term glossed, each number clear about whether it was measured or worked out. The side card makes it obvious what was actually run or checked. Below 900 px the card stacks under the statement. Nothing labels the bullet list and their bold leads have no filled background. Why: on 2026-10-10 Anshul said "do you htink this grey text is easy to read???", "those highlights are too intense" and "i have no idea what you actually did you test the runs. why isn't it fucking obvious"; on 2026-10-08 he asked for "something i can scan fast, bullet points" and said of stat tiles "never put these in the report."
- Large light text over the page background is painted (an old bug: gradients on `body` made headless Chromium drop the text; gradients belong on `body::before`).
- Nothing clips at 800 px, tabs scroll sideways instead of wrapping, side-by-side figures stack.
- Lights glow only where the budget allows.
- Both themes look designed, not inverted. Category hues do not vibrate on light.
- Sequence and graph labels do not overlap after fonts load. Re-shoot if the first run raced the font.

## Known pitfalls

- `file://` pages share one `localStorage` origin. A theme key left by another page flips yours. Namespace keys per report.
- Fonts arrive late in headless runs. The script waits 3.4 s at the top and 3.8 s before figure screenshots; widen if labels look wrong.
- `scrollIntoView` inside a horizontally scrolling tab strip scrolls the whole page on load. Use `tabs.scrollTo({left})`.
- A rail hidden by a later `max-width` rule needs its desktop rule in a `min-width` query, or source order wins.
- Dark chart palettes need a lightness band check when a validator runs; the reference status and category hues pass.

## Sign-off

Report to the user in this shape: screenshot paths, themes and widths verified, issues found and fixed, remaining limitations. If a check failed and was not fixed, say so.
