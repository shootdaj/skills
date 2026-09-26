# Verification

Never present an unverified page. If it was not screenshotted, it is not done. The loop is the one in `anshul-ui-standards-v2/references/verification.md`, with these thresholds.

## Run

```bash
node assets/shoot.mjs /path/to/index.html --key <slug> [--sections id,id,...] [--only dark|800|fallback]
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
| Narrow width | Top and the two lead chapters at 800 in dark, top in light |
| Fallbacks | WebGL stubbed out: the 3D figure still renders its planes. Motion CDN aborted: no page errors and every tile visible |
| Every chapter | One screenshot each with a representative interaction performed (a cell picked, a chip pressed, a node selected) |

## Look at the pictures

The JSON says whether rules held. Only the PNGs say whether it looks right. Open them and check:

- The verdict, tiles and the first takeaways fit above the fold at 1440 by 900.
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
