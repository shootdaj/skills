# Theming: token architecture

## Contents
- What is floor, what is direction
- Token architecture
- The three-layer override pattern
- Designing a dark theme
- Contrast checklist

## What is floor, what is direction

**Floor, always:** semantic tokens instead of raw hex; contrast verified in every theme the page actually ships; one theme per page, no mid-scroll inversion.

**Direction's call:** whether the page ships one theme or two, and whether there is a toggle. A brutalist tactical interface is legitimately dark-only. An editorial monochrome page is legitimately light-only. Committing to one substrate is a design decision, not a missing feature.

The Material direction *does* require both themes plus a toggle. See [direction-material.md](direction-material.md).

## Token architecture

Components consume semantic tokens only, never raw hex, never palette names:

`--surface`, `--surface-container`, `--surface-container-high`, `--on-surface`, `--on-surface-variant`, `--primary`, `--on-primary`, `--primary-container`, `--secondary`, `--outline`, `--outline-variant`, `--success`, `--warning`, `--error`, `--elevation-1..5`, `--focus-ring`

Semantic status colours are separate from the accent and do not count as it.

Starter sheet: `../assets/tokens.css`. Adapt the hues per direction; keep the token names.

## The three-layer override pattern

Only relevant when shipping two themes. Order matters.

```css
:root { /* light values, or the design's default */ }

@media (prefers-color-scheme: dark) {
  :root { /* dark values, OS preference */ }
}

/* Manual toggle wins over the media query, in BOTH directions: */
:root[data-theme="light"] { /* light values again */ }
:root[data-theme="dark"]  { /* dark values again */ }
```

Redefine **tokens only** inside these blocks. Never restyle components inside a media query: a colour whose only definition sits behind `[data-theme]` never applies in the unstamped state, and the page renders one theme's text on the other theme's ground.

Canonical toggle: `../assets/theme-toggle.js`. Persists to localStorage, falls back to OS preference, stamps `data-theme`, dispatches a `themechange` event that charts listen for.

## Designing a dark theme

Not an inversion.

- Dark surfaces desaturated and slightly hue-biased toward the accent. The `#0F1318` family, never pure `#000`.
- Text on dark around 87% white for primary, 60% for secondary. Not pure `#FFF`.
- Accents on dark: raise lightness or drop saturation against the light-theme value so they don't vibrate.
- Elevation on dark reads as lighter container tones. Shadows alone don't carry.
- Charts read colours from tokens via `getComputedStyle` and re-render on theme change.
- Check images and gradients in both themes; provide per-theme variants where one washes out.

## Contrast checklist

Per theme shipped:

- Body text ≥4.5:1, large text ≥3:1.
- Focus ring visible on every ground it can land on.
- Status colours always paired with an icon or label, never colour alone.
- If there is a toggle, it is itself visible and reachable in both themes.
