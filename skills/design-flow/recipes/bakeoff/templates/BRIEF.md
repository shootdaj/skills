# Shared brief: {{PROJECT}} design rebuild, from scratch

You are building ONE design variant of {{PAGE_KIND}} as a single self-contained `index.html`.
The content, data and information architecture are FIXED and already exist in `{{SOURCE_PAGE}}` (read it fully first).
Reuse ALL of its text, tables and JS data blocks verbatim: {{DATA_BLOCKS}}. Do NOT invent new facts or numbers.
You may tighten wording but not change meaning. Every visible string follows `{{HUMANIZER_SKILL}}` (without it: no em or en dashes, straight quotes, sentence case, active voice, no stock AI words, keep every fact).

## What must stay (structure = pyramid)
Order: {{PYRAMID_ORDER}}
Persistent section nav with scroll-spy, expand/collapse all, dark + light theme toggle (persist under a namespaced
localStorage key, default dark unless your direction is light-first). {{ABOVE_THE_FOLD}} visible without scrolling at 1440×900.

## What must change (this is the point)
- From scratch. No {{BANNED_CHASSIS}}. No {{BANNED_FONTS}}. Icons: inline SVG or Lucide (`https://unpkg.com/lucide@latest`), never emoji.
- Brand-new theme per your direction message. Commit hard. Design both dark and light deliberately (no naive inversion).
- Tactile. Everything interactive must feel pressable: hover lift or tilt, press compression, spring settle, cursor changes,
  focus rings. Cards react to the cursor (spotlight, tilt, glow border) where it fits the direction.
- Visible motion.dev choreography using `https://cdn.jsdelivr.net/npm/motion@11/dist/motion.js` (global `Motion`:
  `animate`, `stagger`, `inView`, `scroll`, `spring`). Required, and it must be noticeable:
  1. page-load orchestration (header, title words, verdict, tiles pop with spring, cards stagger),
  2. scroll-triggered reveals for every section (`Motion.inView`),
  3. number count-up tickers,
  4. chart draw-in (bars grow, cells stagger, edges draw with dash offset, "new" marks breathe),
  5. spring hover and press on buttons, chips, cells, nodes,
  6. animated expand and collapse of sections (height and chevron),
  7. a scroll progress indicator,
  8. an animated theme transition.
  Respect `prefers-reduced-motion` (skip entrances, keep function). Guard `if (!window.Motion)` so the page still works.
- At least 10 working interactive elements, each with an obvious affordance. A control that looks clickable and does nothing is a defect.
- Charts via d3 v7 (`https://cdn.jsdelivr.net/npm/d3@7`): tooltips on hover, colours from CSS tokens, direct labels,
  distinct colourblind-safe hues, `tabular-nums`. Re-render on theme change.

## Hard constraints
- Single `index.html`; CSS and JS inline; libraries and fonts via CDN only (Google Fonts, jsdelivr, unpkg).
- 12 px minimum for any readable text. Touch targets at least 44 px. No page-level horizontal scroll at 1440 or 800 wide.
- Page-background gradients, aurora or noise go on a fixed pseudo-element layer (`body::before`); `body` background stays a solid colour.
  (Large light text over a gradient body background failed to paint in headless Chromium.)
- Text uses text tokens, never the series colour. Status colours also carry an icon or a label.
- Plain English: no em or en dashes, straight quotes, sentence case, active voice, no stock AI words.

## Verify before you report (mandatory)
Write a small Node script that loads Playwright through design-flow's shared helper (it finds an installed copy or installs one; nothing to set up):
```js
import { launch } from '{{DESIGN_FLOW}}/assets/lib/playwright.mjs';
const browser = await launch({ headless: true });
```
Load your file via `file://`, wait about 2 s, screenshot 1440×900 top and the lead figure, toggle theme and screenshot again,
resize to 800 and screenshot, collect console errors (must be zero), assert `scrollWidth <= clientWidth`, and scan for text under 12 px.
Fix and re-shoot until clean. Save PNGs in a `shots/` folder next to your index.html. Look at the PNGs yourself.

## Vote widget (mandatory)
Add this as the LAST line before `</body>`:
```html
<script src="../_vote/vote.js" data-project="{{PROJECT_SLUG}}" data-design="{{ID}}" data-label="{{ID_UPPER}} {{NAME}}"></script>
```
It renders a yellow VOTE tab on the right edge. Do not restyle it. Keep nothing critical under the right-middle edge of the viewport.

## Output
`{{DESIGNS_DIR}}/{{ID}}-{{SLUG}}/index.html` plus `shots/`.

## Report back (short)
Path to index.html · one paragraph on the direction and what makes it distinctive · the list of motion moments and interactive
elements · screenshot paths · console status · anything you could not achieve.
