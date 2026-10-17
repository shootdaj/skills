# Product shortlist recipe

A product shortlist is one self-contained `index.html` that answers "which one should I buy?" in seconds: a compact app bar, filter chips that really filter, and a ranked grid of image-led cards, each with a score, the delivered price, a one-line verdict and a direct link to the exact product page. Build from `assets/starter/index.html`. The default look is `material-feed` (`../../directions/material-feed.md`).

Why: this is report-publisher's Visual Product Shortlist (the Material 3 Standard Feed, Template A), picked on 2026-08-06 from three fresh Material directions as the shopping default. It moved into the library on 2026-10-17 so the design knowledge lives in one place; Anshul said "the product shortlist for example should be used when we create product shortlists, so that knowledge shouldn't be lost and it should be continued to be used during the same times when it was previous being used".

## When to use it

Every time the page is a shortlist of discrete things to choose between, with real photos and a link to act on:

- shopping and buying research, on Lazada or any store;
- product comparisons and recommendation reports;
- cart and wishlist reviews;
- vendor, venue or other image-led shortlists, roughly 4 to 12 comparable items.

`design-flow` routes these here on its own (page kind "product shortlist"), and so do `anshul-design`, `report-publisher` and `lazada-shopping`. Not for analytical or evidence-heavy write-ups: those are the report recipe (`../report/RECIPE.md`).

## Look and questions

- Default look: `material-feed`, so a shortlist looks the way it always has. Use another look only when the user picks one; then map its tokens onto the starter's roles (below) and keep the structure.
- Build one design straight away: no level questions, no inspiration picker, no design room, unless the user asks for options or names a number of designs.
- The house mechanics still apply (`anshul-ui-standards-v2`): 44 px targets (the starter uses 48), visible focus, state layers, both themes, never italic, never emoji as icons.

## Structure (keep in every shortlist)

1. **App bar**: an icon, a plain title that says what is being chosen, the store or source, the absolute checked date (for example "Checked 2026-10-17"), a cart badge when cart state matters, and the light/dark toggle. Dark first; the toggle persists in `localStorage` under a key namespaced per page.
2. **Filter chips** that really filter the grid: All, the verdict values (Buy, Keep, Consider, Skip by default) and In cart when the cart was checked. A filter with no matches shows an empty state, never a blank grid.
3. **Ranked card grid**, 3 / 2 / 1 columns at desktop / tablet / phone, ordered by score.
4. **Each card**: one large uncropped photo (4:3 well, `object-fit: contain`, no dimming or overlay, the whole photo links to the product) with a rank dot; the title with a score chip (10-point score, one decimal); the delivered total as the prominent price; up to three fact chips; exactly one one-line verdict; the decision chip (Buy, Keep, Consider or Skip); an IN YOUR CART chip on every item really in the cart and on no other; one filled "View on <store>" button to the exact product page, plus the tonal cart button when cart state matters.
5. **Top pick**: the #1 card is visibly the top pick (a Top pick chip or label next to its rank), with no editorial preamble above the grid.
6. **Minimal prose**: no hero, methodology section, navigation rail, collapsibles, charts or duplicate comparison table unless the user asks for detail.

## Build

1. Collect verified data first: name, exact product URL, a clear product image URL, delivered total (item price plus shown shipping; label it when shipping is unknown), score, up to three facts, verdict, decision and cart state. Invent nothing; replace every sample value, photo and link in the starter.
2. Copy `assets/starter/index.html` next to your work. Edit the title, app bar, `PRODUCTS` array, `DEC` map (when the verdict values differ) and the price formatter (the starter formats Thai baht).
3. Add the checked date to the app bar and the Top pick state on the #1 card, and set `.img-link img` to `object-fit: contain` so photos that are not 4:3 stay uncropped; the starter predates all three rules.
4. For a look other than `material-feed`, map its tokens onto the starter's roles: `--surface` = `bg`, `--surface-container` = `s1`, `--surface-container-high` = `s2`, `--outline-variant` = `line`, `--on-surface` = `txt`, `--on-surface-variant` = `txt2`, `--primary` = `accent`, `--on-primary` = `onAccent`, `--success` / `--warning` / `--error` = `ok` / `part` / `miss`, card radius = `radius`, fonts from the look. Fill the remaining Material roles from the same hues. When the look has a folder (its `files` key), start from its `tokens.css`.

## Verify

Open the page yourself before handing it over:

- the number of cards matches the shortlist, and the #1 card carries Top pick;
- every photo loads with a nonzero natural size and is clearly visible, not cropped or darkened;
- every "View on" button and photo link points to the exact product URL;
- every chip filters correctly, and In cart shows exactly the cart items;
- the theme toggle works and survives a reload;
- no horizontal scroll at 1440 and about 390 wide, 12 px text floor, zero console errors.

## Publish

The door's profile decides where it goes (`anshul-design`: here.now, permanent). Open the live URL in Chrome and leave it open as the deliverable.

## Files

| Path | Holds |
| --- | --- |
| `assets/starter/index.html` | the validated Template A page with six real balcony-table examples: tokens for both themes, app bar, chips, card grid, cart toggle, ripples, image fallback |
| `../../directions/material-feed.md` and `material-feed/` | the default look: its tokens, plus `tokens.css`, `look.css` and `ripple.js` lifted from the starter for reuse in other pages |
