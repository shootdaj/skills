---
name: anshul-ui-standards
description: MUST be used for ANY UI, frontend, dashboard, mock, control surface, or HTML report work — house rules for Material-grade usability, dark/light theming, interactivity minimums, data-viz/motion stack, and mandatory screenshot self-verification. Load alongside frontend-design and ui-ux-pro-max.
---

# Anshul UI Standards — house rules

Binding rules for every page, mock, dashboard, and report. The `frontend-design` skill supplies aesthetic boldness and `ui-ux-pro-max` supplies UX/a11y depth — load both with this skill. When rules conflict: **this file wins**.

## 1. The skeleton is Material Design 3 — always

- Every page gets a real MD3 chassis: top app bar, navigation rail or drawer, card grid, chips, FAB where apt.
- MD3 shape scale (consistent radii), elevation scale, 4/8px spacing grid.
- Distinctive/expressive elements (21st.dev / Dribbble caliber) live **inside** this chassis — never floating-element soup on a bare background.
- The page must have visible structure: clear zones, clear hierarchy levels, obvious what contains what.

## 2. Material usability mechanics (the non-negotiable chassis)

Full spec: `references/material-usability.md`

- **State layers** on every interactive element — hover / focus / press / selected / disabled as consistent tint overlays.
- **Press feedback <100ms** — ripple or equivalent; nothing feels dead.
- **Touch targets ≥44–48px**, hit area extends beyond visual bounds.
- **Visible focus rings**, full keyboard nav, logical tab order.
- **Elevation = meaning** — interactive/overlay surfaces float; consistent shadow scale; never random shadows.
- **Motion-as-meaning** — container transform, directional enter/exit, shared-element continuity; never decoration-only.
- **Every surface has explicit empty / loading / error / disabled states.**

## 3. Dark/light toggle — always

Full spec: `references/theming.md`; starter tokens: `assets/tokens.css`; canonical toggle: `assets/theme-toggle.js`

- Palette lives in semantic CSS custom properties on `:root` (`--surface`, `--on-surface`, `--primary`…) — never raw hex in components.
- Default from `@media (prefers-color-scheme: dark)`; manual toggle stamps `data-theme` on the root element and persists to `localStorage`; `data-theme` overrides the media query in **both** directions.
- Both themes are designed deliberately (desaturated/tonal dark, not naive inversion); contrast verified per theme.

## 4. Interactivity minimums

- Minimum **~8 working interactive elements** per page: nav that actually switches sections, expandable cards, filter chips that filter, toggles with confirmation, tooltips, command palette, ticking feeds, approve/reject that updates state…
- A dead button or decorative-only control is a **defect**, not a placeholder.

## 5. Data-viz + motion stack

Recipes: `references/dataviz-motion.md`

- **d3 v7** for charts — always tooltips/hover, area fills, emphasized endpoints, `tabular-nums` for aligned digits, colors from theme tokens.
- **Motion (motion.dev)** for entrance staggers, springs, micro-interactions.
- `prefers-reduced-motion` respected everywhere.

## 6. Inspiration protocol

- Before building, pull concrete patterns from **21st.dev, Mobbin, Dribbble** (WebSearch/WebFetch); name the patterns being used.
- Banned AI-slop defaults: purple-gradient-on-white hero, Inter/Space Grotesk reflex, centered-everything, `rounded-lg` everywhere, grey-on-grey panels, washed gradient headlines, emoji as icons.

## 7. Real content only

- Actual project/domain data and vocabulary — never lorem ipsum.
- Icons: Material Symbols (or Lucide/Heroicons) — **never emoji-as-icons**.

## 8. Reports use the house report language

- Any *report* page (test reports, design reports, analyses) uses the fierce-waffle design language: bg `#0B0F17`, cyan `#3DC5FF`, green `#3DDC97`, amber `#FFC24B`; Sora (display) / Schibsted Grotesk (body) / JetBrains Mono (data); left-rail nav; collapsible `<details>` sections; dark-first with a light theme still provided via tokens.

## 9. Screenshot self-verification loop — mandatory

Checklist: `references/verification.md`

- Before presenting ANY page: render with Playwright → screenshot at 1440px AND one narrow width → screenshot **both themes** → read console logs for errors → self-audit against the checklist → fix → re-shoot.
- **Never present unverified UI.** If it wasn't screenshotted, it isn't done.
