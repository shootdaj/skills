# Material report

Google Material 3 on graphite with a soft blue accent, tactile and calm. Dark first.

```json
{
 "id": "material-report",
 "name": "Material report",
 "mood": "Material 3, graphite and soft blue, tactile",
 "first": "dark",
 "fonts": {
  "display": "Manrope",
  "body": "Manrope",
  "mono": "JetBrains Mono",
  "google": "Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700"
 },
 "dark": {
  "bg": "#101014",
  "s1": "#17171D",
  "s2": "#1D1D24",
  "line": "#2C2C35",
  "txt": "#E6E1E9",
  "txt2": "#C6C2CC",
  "accent": "#A8C7FA",
  "accentTxt": "#A8C7FA",
  "onAccent": "#0B2A4A",
  "ok": "#6FDCB0",
  "part": "#F5CF6B",
  "miss": "#FF5561"
 },
 "light": {
  "bg": "#F9F9FF",
  "s1": "#FFFFFF",
  "s2": "#EDEDF4",
  "line": "#C4C6D0",
  "txt": "#191C20",
  "txt2": "#44474F",
  "accent": "#415F91",
  "accentTxt": "#2D4A7A",
  "onAccent": "#FFFFFF",
  "ok": "#1E7A55",
  "part": "#8A6400",
  "miss": "#BA1A1A"
 },
 "radius": 18,
 "density": "regular",
 "best": [
  "report",
  "audit",
  "status report",
  "dashboard"
 ],
 "avoid": [
  "marketing",
  "product shortlist"
 ],
 "palettes": [],
 "files": "directions/material-report/",
 "source": "report-publisher's material-dark style reference (the Standard Pyramid look), now material-report/demo.html",
 "derived": [
  "light.*"
 ]
}
```

One look among the others, never the default. Pick it when a report or dashboard should feel like a Material app.

Files: `material-report/` next to this file holds the look's exact code. `tokens.css` has both themes (dark on `:root`, verbatim from the source; light under `[data-theme="light"]`, derived), type and the shared easing, plus the report recipe's token names mapped onto the look. `look.css` has the components, verbatim except that the source's dark-only hard-coded colours now read tokens so the light theme works. `ripple.js` adds the press ripple. `demo.html` is the original page with every component in use, rebuilt from these three files alone (same pixels as the original in dark; add `?theme=light` for light). Copy `tokens.css`, `look.css` and `ripple.js` in (inline them in a single-file page) rather than retyping the values above. In a report, `tokens.css` replaces the starter's `b1-tokens.css` (drop the palette picker) and `look.css` minus its page-base block sits after the starter's CSS.

Motion signature: ripple on every press (0.55 s, shared easing `cubic-bezier(.2,0,0,1)`); chevrons rotate as sections open; cards and tiles lift one elevation step on hover (0.25 s); the narrow-screen drawer eases in over a scrim; one pulsing status dot in the eyebrow.

Forms: compact masthead (pill eyebrow, title, meta chips); a verdict card with a 5 px left accent border; numbered takeaways in tonal circles; filled pill buttons, tonal for the main action; whole-section collapsibles with a circular icon button and ripple; one persistent side nav at 1200 px and up, a floating button plus drawer below; tonal surfaces `--s1` to `--s4` and three elevation shadows instead of borders. The specimen also has stat tiles: a report drops them (house rule, 2026-10-08, "never put these in the report"); a dashboard may keep them.

3D: none.

Derived values (not in the source, adjust if they look off): light.*. The source is dark only; the light theme follows the Material 3 baseline for the same blue.

`demo.html` shows every component in this look as a security-review demo. Lift the visual system, never the demo structure.
