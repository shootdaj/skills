# Motion and light budget

Motion is visible but calm. It runs once on load, once per section on scroll, and on every press. Nothing loops except the lights that are allowed to.

## Load

Timings from the reference `boot()`; all through `Motion.animate`, all skipped when Motion is missing or the reader prefers reduced motion.

| When | What |
| --- | --- |
| 0 ms | Top bar fades and drops in (400 ms) |
| 100 ms | Tabs stagger in, 30 ms apart |
| 150 ms | Headline words rise in, 60 ms apart |
| 550 ms | Verdict and eyebrow rise in, 120 ms apart |
| 800 ms | Tiles pop with a spring (stiffness 420, damping 20), 70 ms apart; their rulers draw from left to right |
| 850 ms | Numbers count up over 1.1 s, comma-formatted when marked |
| 1050 ms | Tile lights switch on one by one, 140 ms apart |
| 1350 ms | Takeaway cards spring in, 80 ms apart; their lights follow |
| 3200 ms | Failsafe: anything still at opacity 0 is forced visible and the `anim` class is removed |

## Scroll

- Every figure inside a chapter starts at opacity 0 and rises in when 12 percent of it is in view (`onView`, which uses `Motion.inView` and falls back to `IntersectionObserver`).
- The draw function runs at the same moment with `animate = true`: bars grow, edges draw with a dash offset (`drawEdgesIn`), nodes fade in with a stagger (`fadeIn`), grid cells stagger in.
- A section gets the `live` class the first time it enters the viewport. Only `live` sections may animate lights.
- The scroll progress line scales with scroll position. The back-to-top pill appears after 700 px.

## Press and hover

- Buttons, chips, tiles and cards lift 2 to 3 px on hover with the spring curve and compress to 95 to 97 percent on press with an 80 ms transition.
- Pressed chips slide a filled pill behind them (`slide()`), with a small spring scale on the chip.
- Panels animate their height over 450 ms; the chevron overshoots to 200 degrees and settles at 180.
- Theme toggle: two doors in the opposite theme's colour close over 400 ms, the theme swaps, the doors open over 500 ms. `themechange` fires in between so charts recolour.
- Detail panels fade in over 250 ms when their content changes.

## Lights

Lights are the signature of the design and also the first thing to overdo. The reference started with lights everywhere and the user asked for "way fewer blinking lights". The budget that survived:

| Where | Behaviour |
| --- | --- |
| Stat tiles in the overview | Animated: ok breathes over 3.2 s, part double-pulses over 3 s, miss blinks over 2 s |
| Active chapter tab count | Animated with the same timings, only while the tab is current |
| Missing cells in the readiness grid | Blink over 2 s |
| Everything else: takeaway cards, panel headers, timeline statuses, sequence bands, graph nodes | Static, lit, with a glow ring, no animation |
| New-plane glow on the exploded stack | Static drop shadow, no pulse |

The CSS block that enforces this is headed "LED diet" in `b2-components.css`. It turns every light animation off and re-enables the three allowed places with `!important`. Keep it last in the cascade.

Every light sits next to a word or an icon. A light alone is a defect.

## Fallbacks

- `HAS()` is `!!window.Motion && !reduced`. Every animation goes through `anim()`, which returns a resolved promise when `HAS()` is false, so the page renders complete and static without Motion.
- `prefers-reduced-motion: reduce` also disables CSS transitions and animations globally in the stylesheet.
- `<html class="anim">` is added in the head script only when motion will run; entrance states in CSS are scoped to `.anim`, so a page without Motion never hides content.
- Verification aborts the Motion CDN request in one run and checks that all tiles are visible.
