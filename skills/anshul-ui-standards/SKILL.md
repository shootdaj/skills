---
name: anshul-ui-standards
description: MUST be used for ANY UI, frontend, dashboard, report, mock, control surface, or app work. Defines the non-negotiable quality floor (accessibility, interaction mechanics, consistency, verification) and routes to the right visual direction for the surface being built. House rules that hold regardless of aesthetic.
---

# Anshul UI Standards

Two things live here: a **floor** that applies to every interface regardless of how it looks, and a **router** that picks the visual direction.

This file has no opinion about aesthetics. That is the router's job.

**When rules conflict: the floor wins on behavior, the direction wins on looks.** A direction may change what a focus ring looks like. It may not remove it.

---

## 1. Design Read (do this first, always)

Before writing any code, state one line:

> Reading this as: `<surface type>` for `<audience>`, `<direction>`, because `<one clause>`.

Examples:
- *Reading this as: control surface for an ops team, Material direction, because it is a data-dense tool with no named style.*
- *Reading this as: marketing page for design-conscious buyers, taste-skill direction, because the brief is a product launch.*
- *Reading this as: quick mock for a layout decision, light tier, because it is throwaway.*

Pick the direction yourself and say what you picked. Do not ask first unless two readings would produce genuinely different products.

---

## 2. Router

### If the brief names a direction
That direction wins on everything visual. Load its skill or reference. The floor below still applies.

### If it does not, route on surface type

| Surface | Direction | Load |
|---|---|---|
| Dashboard, tool, control surface, full app | Material | [references/direction-material.md](references/direction-material.md) |
| Report, audit, analysis, findings writeup | House report | [references/direction-report.md](references/direction-report.md) |
| Landing page, portfolio, marketing site | Anti-slop editorial | `taste-skill` |
| Redesign of an interface that already exists | Audit first | `redesign-skill` |
| Quick mock to look at and throw away | Your call | any direction; floor drops to **light tier** (§4) |

Named aesthetic directions available as skills: `taste-skill`, `soft-skill` (agency depth and motion), `brutalist-skill` (industrial, tactical, zero-radius), `minimalist-skill` (editorial monochrome).

Supporting knowledge, not directions: load `apple-design` for interaction feel and motion physics, `ui-ux-pro-max` for UX and accessibility depth, `frontend-design` for aesthetic range.

**One direction per project.** Do not blend Material with brutalist, or editorial with agency. Pick and commit.

---

## 3. The floor

Non-negotiable on anything real. Direction-independent.

### 3.1 Interaction mechanics
Full spec: [references/interaction-mechanics.md](references/interaction-mechanics.md)

- Every interactive element has visible hover, focus, pressed, selected, and disabled states. *How* they look is the direction's call; that they exist is not.
- Visual acknowledgment of any press within **100ms**.
- Touch targets **≥44px**, hit area extending past the visual bounds, ≥8px between adjacent targets.
- Visible focus ring on every ground, full keyboard operation, logical tab order.
- Every surface defines **empty, loading, error, and disabled** states. Lists also define filtered-to-zero.
- **No dead controls.** Anything that looks interactive does something. A decorative button is a defect. There is no minimum count of interactive elements: a landing page with two CTAs is complete, a dashboard with two is not.

### 3.2 Consistency locks
Pick one system per project and hold it everywhere. The *choice* belongs to the direction; the *consistency* does not.

- **One radius scale.** Zero-radius, 8px, or 2rem squircles are all valid. Mixing them without a documented rule is not.
- **One accent colour**, used identically in every section. Semantic status colours (success, warning, error) are separate and do not count as the accent.
- **One type pairing.** Display plus body plus optional mono. Not a fourth family because a section felt different.
- **One icon family**, one stroke weight. Never emoji as icons.
- **One theme per page.** Light, dark, or system. Sections do not invert mid-scroll.
- **One depth system.** Shadows, borders, or flat separation. Whichever the direction picks, the whole page uses it.

### 3.3 Colour and tokens
Full spec: [references/theming.md](references/theming.md)

- Components read **semantic tokens**, never raw hex. Starter sheet: `assets/tokens.css`.
- Body text ≥4.5:1, large text ≥3:1, focus ring visible on every ground. Verified per theme actually shipped.
- Never colour alone for meaning. Pair with icon, shape, or label.
- Whether a page ships one theme or two is the **direction's** call. If it ships two, both are designed deliberately, not naively inverted, and the toggle is in `assets/theme-toggle.js`.

### 3.4 Content
Full spec: [references/anti-slop.md](references/anti-slop.md)

- Real project data and vocabulary. Never lorem.
- No fake-perfect numbers (`99.9%`, `50K+`, `4.9/5`). Real figures, or explicitly marked as sample.
- No placeholder names. No `Acme`, `John Doe`, `Nexus`, `SmartFlow`.
- No div-built fake screenshots. Real images, generated images, a real component preview, or no preview.
- Re-read every visible string before shipping. Anything grammatically broken, cute-but-wrong, or hallucinated gets rewritten plain.

### 3.5 Motion
- Animate `transform` and `opacity` only. Never `width`, `height`, `top`, `left`.
- Every animation is justifiable in one sentence: hierarchy, storytelling, feedback, or state change. "It looked cool" is not one.
- `prefers-reduced-motion` respected everywhere. Infinite loops, parallax, and scroll-hijack collapse to static.
- Motion is interruptible and never blocks input.

### 3.6 Verification
Full spec: [references/verification.md](references/verification.md)

Never present unverified UI. Render it, screenshot it, read the console, fix, re-shoot.

---

## 4. Light tier (quick mocks only)

For throwaway visuals built to make a decision, not to ship:

**Still required:** contrast, no dead controls, real content, one screenshot before presenting.

**Dropped:** full keyboard pass, every empty/loading/error state, both-theme verification, narrow-width screenshot.

Say explicitly that you built at the light tier. If the mock survives and becomes real, the full floor applies before it ships.

---

## 5. Charts and data-viz

Where charts exist, regardless of direction: [references/dataviz-motion.md](references/dataviz-motion.md)

d3 v7 for anything beyond a sparkline. Tooltips on hover and focus, colours from theme tokens, `tabular-nums` on aligned digits, `overflow-x: auto` guard, a title and a one-line takeaway.
