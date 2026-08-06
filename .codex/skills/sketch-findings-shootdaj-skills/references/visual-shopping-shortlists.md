# Visual Shopping Shortlists

## Design Decisions

- Use Template A, Material 3 Standard Feed, for all Lazada and shopping reports.
- Start with a compact app bar and working filters; avoid editorial hero copy.
- Use a three-column expanded grid that adapts to two and one columns.
- Make every ranked card image-led: large 4:3 photo, rank, score, price, up to
  three fact chips, one-line verdict, decision/cart chips, and direct CTA.
- Default to dark mode with a deliberate persistent light-theme toggle.
- Keep Roboto Flex, Material Symbols, semantic color roles, 4/8dp spacing,
  48px targets, state layers, visible focus, and reduced-motion behavior.

## CSS Patterns

```css
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sp-4);
}

.interactive { position: relative; touch-action: manipulation; }
.interactive::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  pointer-events: none;
}
.interactive:hover::after { opacity: var(--state-hover); }
.interactive:focus-visible::after { opacity: var(--state-focus); }
.interactive:active::after { opacity: var(--state-press); }
```

Consume semantic tokens such as `--surface`, `--surface-container`,
`--primary-container`, and `--on-surface`; do not hardcode component colors.

## HTML Structures

```html
<header class="top-app-bar">…title, cart status, theme toggle…</header>
<nav class="filter-row" aria-label="Filter products">…filter chips…</nav>
<main class="product-grid">
  <article class="product-card">…photo, score, facts, verdict, CTA…</article>
</main>
```

The photo and primary CTA both link to the exact verified product URL.

## What to Avoid

- Do not reuse the rejected custom/editorial shopping designs that preceded the
  fresh Material exercise.
- Do not use Template B's oversized expressive hero or Template C's list-detail
  layout as the default Lazada report.
- Do not add report navigation, methodology, charts, comparison tables, long
  prose, decorative gradients, glassmorphism, or arbitrary non-Material motifs.
- Do not hide or omit direct links and real product photos.

## Origin

Synthesized from sketch 001. Source files are in
`sources/001-material-shopping-shortlist/`.
