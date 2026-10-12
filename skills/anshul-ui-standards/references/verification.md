# Verification

## Contents
- The two tiers
- Full tier procedure
- The checklist
- Light tier procedure
- Sign-off

Never present unverified UI. If it wasn't rendered and looked at, it isn't done.

## The two tiers

| Tier | For | Cost |
| --- | --- | --- |
| **Full** | Anything real: shipped pages, apps, dashboards, reports | Several screenshots, console read, full checklist |
| **Light** | Quick mocks built to make a decision and throw away | One screenshot, contrast and dead-control check |

Say which tier you used. A mock that survives and becomes real gets the full pass before it ships.

## Full tier procedure

1. Render the page (Playwright, or headless Chrome via `--screenshot`).
2. Screenshot at **1440×900** and one narrow width (**~800px**).
3. Screenshot **every theme the page ships**. If it ships one, one is correct and complete.
4. Exercise the primary flows: each nav item, expand a card, open a dialog or palette. Screenshot the money view.
5. Read the console. CDN failures, JS errors, and 404 fonts are defects.
6. Audit against the checklist. Fix. Re-shoot. Repeat until clean.

## The checklist

**Structure and hierarchy**
- [ ] Hierarchy readable at arm's length: levels distinguishable by size, weight, and spacing alone
- [ ] The direction's chassis is actually present and consistent
- [ ] Consistency locks held: one radius scale, one accent, one type pairing, one icon family, one depth system

**Auto-fail**
- [ ] No grey soup: surfaces distinguishable from the ground and from each other
- [ ] No washed gradient headlines
- [ ] No overlapping or clipped elements at either width; no horizontal page scroll
- [ ] No dead controls
- [ ] No emoji-as-icons, no lorem, no fake-perfect numbers, no unstyled flash

**Theme**
- [ ] Every theme shipped is deliberately designed and contrast-verified
- [ ] If there is a toggle: it works, persists on reload, no flash of wrong theme, charts recolour

**Mechanics**
- [ ] Hover, focus, and press states visible on interactive elements (spot-check five)
- [ ] Focus ring visible when tabbing; targets comfortably large
- [ ] Loading, empty, and error states exist wherever data renders

**Motion**
- [ ] Entrance plays once, ≤400ms feel, staggered, never blocking input
- [ ] `prefers-reduced-motion` respected

**Console**
- [ ] Zero errors; all fonts and CDNs loaded

## Light tier procedure

1. Render and screenshot once at 1440px.
2. Check: contrast readable, nothing overlapping, no dead controls, no lorem.
3. Say it was built at the light tier.

## Sign-off

Report: screenshots taken (paths), themes verified, tier used, issues found and fixed, remaining known limitations.

If a checklist line failed and was not fixed, say so explicitly. Do not present a page as verified when it isn't.
