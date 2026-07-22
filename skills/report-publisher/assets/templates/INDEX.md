# Style references

These are **look-and-feel references**, not layouts to clone. Each is a self-
contained HTML page demonstrating a complete visual system — theme tokens,
components, motion, navigation. Reuse the *style* so every report reads as one
coherent system; **build the structure to fit the report**, don't copy the demo's
sections slot-for-slot.

Read the comment block at the top of each file: it separates what to REUSE (the
CSS / components / interactions) from what to ADAPT (which sections exist, whether
there are severity tiles, whether a chart earns its place) and the INVARIANTS that
hold no matter the structure (see `../design-system.md`).

| Reference | Look | Reuse for |
|-----------|------|-----------|
| `material-dark.html` | Material 3 dark: tonal surfaces, elevation, pill buttons, stat tiles, collapsible panels with a circular icon-button + ripple, persistent side-nav (FAB+drawer on narrow), D3 bar. Signal-red accent. | Any dark, modern, professional report — security reviews, audits, research writeups, benchmarks, status updates, teardowns. The demo content is findings/severity-shaped only because that was the first report; the *style* suits any of them. Adapt the structure to what you're actually writing. |

<!-- Add a row per new style reference. Keep each a self-contained single HTML file
     whose top comment separates REUSE (the look) from ADAPT (the structure). -->
