# Theming — token architecture + dark/light toggle

Every page ships both themes and a working toggle. No exceptions (a deliberately single-theme art piece needs the user's explicit sign-off).

## Token architecture

- Components consume **semantic tokens only** — never raw hex, never palette names:
  `--surface`, `--surface-container`, `--surface-container-high`, `--on-surface`, `--on-surface-variant`, `--primary`, `--on-primary`, `--primary-container`, `--secondary`, `--outline`, `--outline-variant`, `--success`, `--warning`, `--error`, `--elevation-1..5`, `--focus-ring`.
- Semantic status colors (success/warning/error) are separate from the accent hue and don't count as the accent.
- Starter sheet: `../assets/tokens.css` — adapt hues per design direction, keep the token names.

## The three-layer override pattern (order matters)

```css
:root { /* light values (or the design's default) */ }

@media (prefers-color-scheme: dark) {
  :root { /* dark values — OS preference */ }
}

/* Manual toggle wins over the media query, BOTH directions: */
:root[data-theme="light"] { /* light values again */ }
:root[data-theme="dark"]  { /* dark values again */ }
```

- Redefine **tokens only** in these blocks — never restyle components inside media queries.
- Canonical toggle JS: `../assets/theme-toggle.js` (localStorage persistence, falls back to OS preference, stamps `data-theme`).

## Designing the dark theme (not inversion)

- Dark surfaces: desaturated, slightly hue-biased toward the accent — e.g. `#0F1318` family, never pure `#000`.
- Text on dark: ~87% white for primary, ~60% for secondary — not pure `#FFF`.
- Accents on dark: raise lightness / drop saturation vs the light-theme accent so they don't vibrate.
- Elevation on dark: higher surfaces get slightly *lighter* container tones (surface tinting), shadows alone don't read.
- Charts/d3: colors must come from tokens (read via `getComputedStyle`) and re-render or transition on theme change.
- Images/mesh gradients: check both themes; provide per-theme variants if one washes out.

## Contrast checklist (per theme)

- Body text ≥4.5:1; large text ≥3:1; focus ring visible on every ground.
- Status colors keep an icon/text pairing (never color-only meaning).
- Verify the toggle button itself is visible and reachable in both themes, in the app bar (standard position: trailing end).

## Toggle UX

- Icon-button in the top app bar: sun/moon (Material Symbols), swap animates (rotate/fade, ~200ms).
- `aria-label` states the action ("Switch to dark theme"), not the current state.
- No flash-of-wrong-theme: inline the localStorage read in `<head>` before first paint.
