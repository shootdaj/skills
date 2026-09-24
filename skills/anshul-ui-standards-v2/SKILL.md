---
name: anshul-ui-standards-v2
description: Anshul's UI house mechanics, version 2, used by the design-flow engine. Same rules as anshul-ui-standards (Material-grade usability, Apple-style fluid interaction, dark/light theming, interactivity minimums, data-viz/motion, screenshot self-verification) minus the fixed Material chassis and the fixed report palette, because the look comes from design-flow. Load through anshul-design or helix-design-anshul. Older work keeps using anshul-ui-standards.
---

# Anshul UI Standards v2 — house mechanics

Version 2 of `anshul-ui-standards`, for pages built through `design-flow`. The look (palette, type, shape, motion signature, component forms) comes from the chosen direction; these rules govern how the page behaves. Binding rules for every page, mock, dashboard, and report. Load `frontend-design` for aesthetic boldness, `ui-ux-pro-max` for UX/a11y depth, and `apple-design` for fluid, physical interaction and motion. When rules conflict: **this file wins**.

## Claude Fable owns frontend design

- For every frontend design or implementation task, use real Claude Code with the `fable` model and load `frontend-design` alongside this skill.
- In Codex or another orchestrating harness, invoke Claude Code explicitly with `--model fable`; the orchestrator may prepare inputs, review, test, and integrate, but must not substitute another model for the frontend design work.
- In Claude Code, keep the task on Fable. If Fable is unavailable, stop and report the blocker instead of silently falling back to Sonnet, Opus, or another model.
- A user may explicitly override the model for a specific task; otherwise Fable is mandatory.

## 1. Visible structure — always

- Every page has a real chassis from the chosen look: a top bar or rail, clear zones, a consistent card or panel grid, obvious containment.
- Consistent radii, one elevation scale, a 4/8px spacing grid. The look sets the values; this rule says they must be consistent.
- Distinctive/expressive elements (21st.dev / Dribbble caliber) live **inside** that chassis — never floating-element soup on a bare background.
- Material Design 3 is one valid chassis, not the default. `design-flow` picks the chassis with the user.

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

## 6. Apple-style fluid interaction

- Load and apply `apple-design` to every UI design, implementation, and review task.
- Keep the chosen look's structure as the chassis; use Apple’s principles for interaction feel: immediate pointer-down feedback, 1:1 direct manipulation, interruptible motion, velocity handoff, momentum projection, soft boundaries, and spatially consistent enter/exit paths.
- Use critically damped springs by default. Add bounce only when a physical gesture supplies momentum; never add decorative bounce to passive transitions.
- Gesture-driven elements must start from their live on-screen value, remain grabbable mid-animation, and preserve velocity when redirected.
- Apply Apple’s material, typography, and reduced-motion guidance only where it strengthens this house system; it does not replace the required hierarchy, semantic tokens, accessibility, or verification rules.

## 7. Inspiration protocol

- Before building, pull concrete patterns from **21st.dev, Mobbin, Dribbble** (WebSearch/WebFetch); name the patterns being used.
- Banned AI-slop defaults: purple-gradient-on-white hero, Inter/Space Grotesk reflex, centered-everything, `rounded-lg` everywhere, grey-on-grey panels, washed gradient headlines, emoji as icons.

## 8. Real content only

- Actual project/domain data and vocabulary — never lorem ipsum.
- Icons: Material Symbols (or Lucide/Heroicons) — **never emoji-as-icons**.

## 9. Reports use the look design-flow chose

- Report pages (test reports, design reports, analyses) take their look from `design-flow` and their structure from the `helix-report` recipe.
- The old fierce-waffle report language (bg `#0B0F17`, cyan `#3DC5FF`, green `#3DDC97`, amber `#FFC24B`; Sora / Schibsted Grotesk / JetBrains Mono; left-rail nav; collapsible `<details>`) survives as the `fierce-waffle` look in `design-flow/directions/` and as the `[data-report]` block in `assets/tokens.css`. Use it when picked, not by default.

## 10. Screenshot self-verification loop — mandatory

Checklist: `references/verification.md`

- Before presenting ANY page: render with Playwright → screenshot at 1440px AND one narrow width → screenshot **both themes** → read console logs for errors → self-audit against the checklist → fix → re-shoot.
- **Never present unverified UI.** If it wasn't screenshotted, it isn't done.
