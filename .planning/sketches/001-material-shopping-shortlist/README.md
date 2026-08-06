---
sketch: 001-material-shopping-shortlist
design_question: Which authentic Material 3 layout should become the default for visual shopping reports?
winner: A — Standard Feed
tags: [shopping, lazada, report, material-3, product-cards]
---

# 001 — Material Shopping Shortlist

Three switchable Material 3 templates over same six Lazada balcony-table products. Open `index.html`; use top toolbar for template (A/B/C), frame width (412/840/full), theme toggle (dark default, persisted).

**Selected:** A — Standard Feed. This is the required default for future Lazada and shopping reports.

- **A — Standard Feed.** Top app bar with cart badge, working filter chips (All/Buy/Keep/Consider/Skip/In cart), elevated card grid, rank badges, score chips, facts, verdicts, Lazada CTA + cart toggle per card.
- **B — Expressive Feed.** Primary-container hero with wide Roboto Flex display type, #1 pick as full-width tonal hero card, alternating asymmetric corner radii, circular score badges, larger price type. Same data and actions, louder M3.
- **C — List–Detail.** Selectable product list (secondary-container selection) synced to detail pane with hero image, chips, facts, verdict, CTA. Stacks at ≤700px frame width with back button.

Everywhere: product photo and CTA open exact Lazada URL in new tab, semantic tokens only, state layers + ripple, 48px targets, visible focus, reduced-motion respected, cart state shared across templates.
