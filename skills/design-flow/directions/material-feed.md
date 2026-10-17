# Material feed

Google Material 3, image-led and quick to scan. Dark first.

```json
{
 "id": "material-feed",
 "name": "Material feed",
 "mood": "Material 3, image-led, quick to scan",
 "first": "dark",
 "fonts": {
  "display": "Roboto Flex",
  "body": "Roboto Flex",
  "mono": "Roboto Mono",
  "google": "Roboto+Flex:opsz,wght@8..144,300..900&family=Roboto+Mono:wght@400;500"
 },
 "dark": {
  "bg": "#141218",
  "s1": "#211F26",
  "s2": "#2B2930",
  "line": "#49454F",
  "txt": "#E6E0E9",
  "txt2": "#CAC4D0",
  "accent": "#D0BCFF",
  "accentTxt": "#D0BCFF",
  "onAccent": "#381E72",
  "ok": "#81C995",
  "part": "#FDD663",
  "miss": "#F2B8B5"
 },
 "light": {
  "bg": "#FEF7FF",
  "s1": "#F3EDF7",
  "s2": "#ECE6F0",
  "line": "#CAC4D0",
  "txt": "#1D1B20",
  "txt2": "#49454F",
  "accent": "#6750A4",
  "accentTxt": "#6750A4",
  "onAccent": "#FFFFFF",
  "ok": "#146C2E",
  "part": "#7A5900",
  "miss": "#B3261E"
 },
 "radius": 12,
 "density": "regular",
 "best": [
  "product shortlist",
  "shopping comparison",
  "cart review",
  "app screen"
 ],
 "avoid": [
  "report",
  "tech design",
  "marketing"
 ],
 "palettes": [],
 "files": "directions/material-feed/",
 "source": "recipes/product-shortlist/assets/starter/index.html (report-publisher's Visual Product Shortlist, Material 3 Standard Feed, Template A, validated 2026-08-06)",
 "derived": [
  "fonts.mono"
 ]
}
```

The default look of the product-shortlist recipe (`../recipes/product-shortlist/RECIPE.md`). Everywhere else it is one look among the others, never the default.

Files: `material-feed/` next to this file holds the look's exact code, lifted from the validated shortlist page. `tokens.css` has the full Material 3 role set for both themes (dark on `:root`, light under `[data-theme="light"]`), the shape scale, 4/8 dp spacing, state-layer opacities and type, plus the report recipe's token names mapped onto the Material roles. `look.css` has the components: the interactive base (state layer, focus ring, 48 px targets, ripple), score chip, chips with decision tones, fact chips, filled and tonal buttons, and the standard feed (app bar, cart badge, chip row, 3/2/1 grid, card, rank dot, empty state). `ripple.js` adds the press ripple. Copy all three in (inline them in a single-file page) rather than retyping the values above; skip `look.css`'s page-base block when the page has its own. `demo.html` is the recipe's starter rebuilt from these three files alone (same pixels as the starter, dark and light); the starter itself is `../recipes/product-shortlist/assets/starter/index.html`.

Motion signature: ripple on press (480 ms ease-out); state layers fade in 120 ms on hover, focus and press; cards lift one elevation step on hover (160 ms); filter chips swap the grid instantly; reduced motion turns ripples off.

Forms: Material 3 top app bar (icon, title, cart badge, theme toggle); a row of filter chips that really filter; a 3, 2, 1 column card grid; image-led cards (large uncropped 4:3 photo with a rank dot, title and score chip, price, up to three fact chips, one-line verdict, decision and cart chips, a filled "View on" button plus a tonal cart button); the full M3 role set (surface containers, primary, secondary, tertiary, success, warning, error, each with its "on" colour), shape scale 4 / 8 / 12 / 16 / 28 / full, three elevation shadows, 4/8 dp spacing; Material Symbols Rounded for icons (load them next to the fonts).

3D: none.

Derived values (not in the source, adjust if they look off): fonts.mono. The source sets numbers in Roboto Flex with tabular figures; Roboto Mono only fills the look's mono slot.
