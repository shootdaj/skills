# Feedback lessons

What the user said, what it meant, and the fix that stuck. Read this before every iteration round.

| The user said | It meant | Fix that stuck |
| --- | --- | --- |
| "This is just reusing the Material design theme" | The skeleton was fine, the skin was the house default | From-scratch variants with no Material idiom, no Material Symbols, no house fonts |
| "I don't see any interactive elements" and "where are the motion.dev things" | Motion existed but was not noticeable, controls did not read as controls | Eight required, named motion moments per variant; ten working controls minimum; hover lift, press compression, spring settle on everything |
| "Vary the designs a lot" | Variants shared forms even when palettes differed | Round two brief lists every used form and forbids it |
| "Remove the grabby cursor thing" (D4) | Custom cursors get in the way | No custom cursors |
| "The super dark and light makes it look like an old school terminal screen" | Pure black plus pure white is hard to read | Plum page with off-white text as default; Ink kept as a picker option |
| "I liked the colourful contrast of D7, not so much, but a little" then "you didn't change the colors" | Tinted labels and borders at 70 percent read as no change; the user meant filled surfaces | Full-strength hue fills on tiles and sticky-note cards |
| "Way too much!" | Full fills on every surface overwhelmed | Middle setting: full hue on tile top borders, numbers, card edges and icon chips; bodies back to the surface colour |
| "Places where a huge amount of bright colour dominates need toning down" | Large grouped surfaces (treemap groups, lanes) were solid hue | Large fills at 30 to 35 percent into the surface, full hue on outlines and labels |
| "These are fine" (readiness grid) | Solid status fills on small cells work | Readiness cells stay solid |
| "Way too many blinking lights" | Lights everywhere lost their meaning | Lights animate only on the active tab count and missing readiness cells (stat tiles were the third place until 2026-10-08) |
| "I like the little blinking red and yellow lights" | The lights are the signature, keep them | Lights stay on every status, lit and static, glow ring on |
| "Add some themability" | One palette is not enough | Five palettes, each dark and light, picker in the top bar |
| "I prefer final A, drop the other" | Top tabs plus collapsible sections beat a left rail | Final A is the reference |
| "Make it much less wordy, link details into an appendix" | The full edition is for engineers, leadership needs the lean one | Lean edition: captions of 12 words with Details links, appendix per figure |
| "Make it plain English, use the humanizer skill on all text" | AI-flavoured prose is hard to trust | Every string through the humanizer rules; builders get the skill path in their brief |
| "Only dope 3D, don't AI-slop something out" | 3D is welcome when it encodes data and comes from a proven example | 3D allowed for force graphs, value fields, morphs, exploded stacks, each with a 2D fallback; isometric SVG when in doubt |
| "Show them as they get done" | Do not batch the reveal | Open each variant in Chrome the moment it lands |
| "never put these in the report" (2026-10-08, shown a row of stat cards: FACT 740M, FITS 284MB, KEEP 0.885, SPIKE 2s, COST $0, 1 BENT) | Bare numbers on cards do not explain themselves | No stat tiles. A number that matters leads an opening bullet or goes into a real figure |
| "at the top of the report put a plain english thing, no label, just the text", then "that's a huge wall of text at top of report. i need something i can scan fast, bullet points, make it more readable, highlights, other visual things to scan the points easily" (2026-10-08) | Lead with the point in words he can scan, with nothing labelling it | The report opens with four to six one-line bullets, each led by a highlighted key number or phrase |
| "humanize the entire report. i dont understand it." (2026-10-08) | The page was written for engineers | Write for a smart reader who is not technical; every term gets a plain phrase on first use; humanizer on all copy |
| "any future reports need to be fucking shorter." (2026-10-08) | Length buried the point | Length budget: first screen answers everything, about three screens before the appendix, five chapters at most, 12-word captions |
| "never use any measures that we haven't either measured or is directly relevant to us" (2026-10-08) | Vendor benchmarks are not evidence about his work | Only numbers measured on his data or bearing on him (cost, size, time, quota) |

## Technical lessons from the same rounds

- Large light text over a gradient `body` background did not paint in headless Chromium. Gradients go on `body::before`, body stays solid.
- `file://` pages share `localStorage`. Namespace theme keys per page or a variant inherits another's theme.
- A rail hidden by a later `max-width` rule needs its desktop rule in a `min-width` query.
- `scrollIntoView` inside a horizontal strip scrolled the page to section 04 on load. Use `container.scrollTo({left})`.
- Playwright import from a scratch folder fails under ESM. Import `launch` from design-flow's `assets/lib/playwright.mjs`; it finds or installs the package and picks Chrome or Chromium.
- macOS `screencapture` is denied in this environment. Drive Chrome with `open` or AppleScript, and take screenshots with Playwright.
