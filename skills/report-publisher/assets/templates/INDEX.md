# Report templates and style references

Both templates moved into the `design-flow` skill on 2026-10-17, so the design
knowledge lives in one library. This skill still chooses between them and
publishes the result. Paths below are inside the `design-flow` skill.

- A look supplies the visual system; design the report structure for the content
  instead of cloning the demo sections.
- A recipe supplies a reusable information structure for a specific report
  family. Preserve that structure while replacing all sample data.

Each source page opens with a comment block that separates what to REUSE (the
CSS / components / interactions) from what to ADAPT (which sections exist, whether
there are severity tiles, whether a chart earns its place) and the INVARIANTS that
hold no matter the structure (see `../../references/design-system.md`).

| Template | Now lives at | Type | Look | Best for |
|----------|--------------|------|------|----------|
| **Standard Pyramid** | `directions/material-report.md` + `directions/material-report/` (`tokens.css`, `look.css`, `ripple.js`, `demo.html`, formerly `material-dark.html`) | Look: `material-report` | Material 3 dark: tonal surfaces, elevation, pill buttons, stat tiles, collapsible panels, persistent side-nav, optional D3. | Security reviews, audits, research, benchmarks, status reports, post-mortems, and other evidence-heavy reports. Adapt the body structure to the content. |
| **Visual Product Shortlist** | `recipes/product-shortlist/RECIPE.md` + `recipes/product-shortlist/assets/starter/index.html` (formerly `visual-product-shortlist.html`) | Recipe · **shopping/Lazada default**, look `material-feed` | Validated Material 3 Standard Feed (Template A): top app bar, working filter chips, responsive ranked card grid, large uncropped photos, score and decision/cart chips, price, concise facts, verdict, direct CTA, dark-first theme toggle. | All Lazada and shopping research, product comparisons, cart/wishlist reviews, recommendations, vendor or venue shortlists, and image-led comparisons of discrete choices. Preserve the Material feed/card structure; replace every sample value, photo, and link. |
