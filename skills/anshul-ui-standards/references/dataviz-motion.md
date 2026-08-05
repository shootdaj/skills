# Data-viz (d3 v7) + Motion recipes for control surfaces

CDN allowed on static hosts: `https://cdn.jsdelivr.net/npm/d3@7` and `https://cdn.jsdelivr.net/npm/motion@latest/dist/motion.js` (vanilla, `window.Motion`). Artifacts (claude.ai) block CDNs — inline there.

## d3 ground rules

- Every chart: tooltips on hover/focus, a11y title/desc, colors via theme tokens (`getComputedStyle(document.documentElement).getPropertyValue('--primary')`), re-render (or transition) on theme change — listen for the `themechange` event the toggle dispatches.
- Areas get faint fills; lines get emphasized endpoints (dot + label on the last value); grids are faint (`--outline-variant`).
- Numbers in axes/labels: `tabular-nums`. Never rely on color alone — pair with shape/label.
- Charts live inside cards with a title, a one-line takeaway, and an `overflow-x: auto` guard.

## Control-surface chart recipes

- **Run timeline / scrubber**: horizontal band per release cycle, run dots colored by status token, brush to zoom a window; click a run → detail panel (container transform).
- **Hierarchy explorer** (NUCC-style Section→Grouping→Classification→Specialization): `d3.partition` sunburst or icicle; click-to-zoom with animated transitions; breadcrumb trail; tooltip shows code + display name.
- **Flow / funnel** (Detected→NeedsReview→Approved→Applied): `d3-sankey`; hover highlights the full path; counts on links.
- **Progress ring / gauge** (run apply progress, pass rate): arc with animated sweep on load (`d3.interpolate` on `attrTween`), value in the center in the display face.
- **Sparkline strips**: 100×28 inline SVGs in table rows/cards; area fill + endpoint dot; no axes.
- **Force graph** (relationships/moves): `d3.forceSimulation`; drag nodes; hover dims non-neighbors; cap node count (<150) for 60fps.

## Motion (motion.dev) recipes

```js
const { animate, stagger, spring } = Motion
```

- **Page-load orchestration** (one well-built sequence beats scattered effects): app bar fades in → rail slides in → cards stagger up
  `animate('.card', { opacity: [0,1], transform: ['translateY(12px)','none'] }, { delay: stagger(0.04), duration: .35, easing: 'ease-out' })`
- **Card expand/collapse**: animate the reveal with transform/opacity on inner content; rotate the chevron; never animate raw height on large lists.
- **Approve → animate away**: `animate(row, { opacity: 0, transform: 'translateX(24px)' }, { duration: .25, easing: 'ease-in' }).finished.then(removeAndReflow)`; siblings settle with a spring; counts tick up via number tween.
- **Springy toggles/FABs**: `{ easing: spring({ stiffness: 400, damping: 28 }) }` for playful directions; plain ease-out for sober ones.
- **Ticking feeds**: new event enters from top with fade+slide, older items shift down; cap DOM nodes (~50), remove oldest.
- **Number counters**: tween textContent for KPI changes (200–400ms); `tabular-nums` so nothing jumps.

## Reduced motion

```js
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
```
If reduced: skip entrance animations and feed slide-ins (appear instantly), keep opacity-only feedback, keep all functionality.
