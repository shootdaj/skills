# Report templates and style references

This directory contains both **style references** and **layout templates**. Check
the Type column before using one:

- A style reference supplies the visual system; design the report structure for
  the content instead of cloning the demo sections.
- A layout template supplies a reusable information structure for a specific
  report family. Preserve that structure while replacing all sample data.

Read the comment block at the top of each file: it separates what to REUSE (the
CSS / components / interactions) from what to ADAPT (which sections exist, whether
there are severity tiles, whether a chart earns its place) and the INVARIANTS that
hold no matter the structure (see `../design-system.md`).

| Template | Type | Look | Best for |
|----------|------|------|----------|
| **Standard Pyramid** · `material-dark.html` | Style reference | Material 3 dark: tonal surfaces, elevation, pill buttons, stat tiles, collapsible panels, persistent side-nav, optional D3. | Security reviews, audits, research, benchmarks, status reports, post-mortems, and other evidence-heavy reports. Adapt the body structure to the content. |
| **Visual Product Shortlist** · `visual-product-shortlist.html` | Layout template · **shopping/Lazada default** | Validated Material 3 Standard Feed (Template A): top app bar, working filter chips, responsive ranked card grid, large uncropped photos, score and decision/cart chips, price, concise facts, verdict, direct CTA, dark-first theme toggle. | All Lazada and shopping research, product comparisons, cart/wishlist reviews, recommendations, vendor or venue shortlists, and image-led comparisons of discrete choices. Preserve the Material feed/card structure; replace every sample value, photo, and link. |

<!-- Add a row per new asset. Keep each a self-contained HTML file whose top
     comment states its type, reuse rules, adaptations, and invariants. -->
