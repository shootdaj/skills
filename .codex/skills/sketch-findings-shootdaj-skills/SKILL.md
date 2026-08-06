---
name: sketch-findings-shootdaj-skills
description: Validated Material 3 shopping-report design decisions, CSS patterns, and visual direction from the shootdaj-skills sketch experiments. Use when creating or updating Lazada, shopping, recommendation, cart-review, or Visual Product Shortlist report UI in this repository.
---

<context>
## Project: shootdaj-skills

All Lazada and shopping shortlists use the validated Material 3 Standard Feed
(Template A): a real app bar, useful filter chips, and an image-led ranked card
grid. The design was selected from three fresh Material directions and is the
required shopping default.

Sketch session wrapped: 2026-08-06
</context>

<design_direction>
## Overall Direction

Use authentic Google Material 3 structure with Roboto Flex, semantic tonal
surfaces, a 4/8dp spacing rhythm, consistent shape/elevation roles, large real
product photos, and concise decision content. Default to dark mode and retain a
deliberate persistent light-theme toggle. Claude Fable owns frontend design.
</design_direction>

<findings_index>
## Design Areas

| Area | Reference | Key Decision |
|------|-----------|--------------|
| Visual Shopping Shortlists | `references/visual-shopping-shortlists.md` | Use Template A's Material app bar, filters, and responsive ranked card grid for every Lazada report. |

## Theme

The winning theme file is at `sources/themes/default.css`.

## Source Files

The A-only reusable HTML is preserved at
`sources/001-material-shopping-shortlist/index.html`.
</findings_index>

<metadata>
## Processed Sketches

- 001-material-shopping-shortlist
</metadata>
