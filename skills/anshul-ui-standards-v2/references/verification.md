# Screenshot self-verification — mandatory before presenting any page

Never present unverified UI. If it wasn't screenshotted, it isn't done.

## Procedure

1. Load the page in Playwright (`file://` or served URL).
2. Screenshot at **1440×900** and one narrow width (**~800px**).
3. Toggle the theme (click the toggle) → screenshot **both themes**.
4. Navigate the primary flows: click each nav item, expand a card, open the palette/dialog → screenshot the money view (e.g. approval queue open).
5. Read the console logs — CDN failures, JS errors, 404 fonts are all defects.
6. Audit against the checklist below. Fix. Re-shoot. Repeat until clean.

## The harsh checklist

**Skeleton & hierarchy**
- [ ] MD3 chassis visible: app bar, rail/drawer, structured card zones — not elements floating on a background
- [ ] Hierarchy obvious at arm's length: you can tell level 1 vs 2 vs 3 by size/weight/spacing alone
- [ ] Consistent radii, elevation scale, spacing grid (no random gaps)

**The rejected failure modes (auto-fail)**
- [ ] No grey soup: panels distinguishable from background and each other in BOTH themes
- [ ] No washed gradient headlines (text stays high-contrast)
- [ ] No overlapping/clipped elements at either width; no horizontal page scroll
- [ ] No dead controls: everything that looks clickable does something
- [ ] No emoji-as-icons; no lorem; no unstyled flash

**Theming**
- [ ] Toggle present in app bar, works, persists on reload, no flash-of-wrong-theme
- [ ] Both themes deliberately designed; charts recolor on toggle; contrast AA in both

**Usability mechanics**
- [ ] Hover/focus/press states visible on interactive elements (spot-check 5)
- [ ] Focus ring visible when tabbing; targets comfortably large
- [ ] Loading/empty/error states exist where data renders

**Motion**
- [ ] Entrance orchestration plays once, ≤400ms feel, staggered; nothing blocks input
- [ ] Reduced-motion query respected (spot-check by emulation if possible)

**Console**
- [ ] Zero errors; all CDNs and fonts loaded

## Sign-off format

Report to the user with: screenshots taken (paths), themes verified, issues found → fixed, remaining known limitations. If any checklist line failed and wasn't fixed, say so explicitly.
