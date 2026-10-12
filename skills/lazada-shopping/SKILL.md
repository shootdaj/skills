---
name: lazada-shopping
description: >
  Research, compare, shortlist, reorder, and prepare checkout for products on
  Lazada Thailand using the user's real Chrome account, automatically signing in
  with visible Bitwarden autofill when needed. Use this whenever the user asks to
  find or compare Lazada products, inspect their cart or order history, reorder a
  prior purchase, add an item to cart, prepare checkout, check current prices or
  shipping, evaluate variants, or produce shopping recommendations. For
  multi-product work, default to a published Visual Product Shortlist report.
  Trigger even when the user says "find me one on Lazada," "check my cart," "buy
  the one I ordered before," or names a product category plus Lazada.
---

# Lazada Shopping

Turn a Lazada request into a current, evidence-backed buying decision. Work in
the user's real Lazada Thailand account, authenticate automatically with the
saved Bitwarden login when needed, inspect actual product pages and account
state, and carry out only the shopping mutations the user explicitly requested.

## Required companion skills

Before acting:

1. Read and follow `browse-with-chrome`. Use the native Chrome connector and the
   existing logged-in profile. If the user's latest message explicitly names a
   different browser surface, that explicit choice wins.
2. For a multi-product report, read and follow `report-publisher`. Use its
   **Visual Product Shortlist — Material 3 Standard Feed (Template A)** as the
   mandatory Lazada default.
3. Real Claude Code on the **Fable model** owns the report frontend and must use
   `frontend-design`. In Claude Code, stay on Fable and use `frontend-design`
   directly. In Codex, read and follow `use-claude` and invoke Claude Code with
   `--model fable`. In Cursor or Hermes, use the configured Claude Fable route.
   If no Claude route is available, report the blocker rather than silently
   building the report frontend with another model. Codex may prepare verified
   data, orchestrate, publish, and inspect the result.

## Default scope and safety

Shopping research is read-only unless the user explicitly asks for a mutation.
Checking the cart never implies permission to change it.

Signing in to the user's Lazada account with its saved Bitwarden credential is
standing pre-authorization whenever this skill triggers. Do not stop merely
because Lazada is signed out.

- Do not add or remove products, change quantities or variants, apply vouchers,
  alter addresses, message sellers, place orders, or complete checkout unless the
  user explicitly requests that exact action.
- A purchase or final checkout is consequential: verify the selected product,
  variant, quantity, delivery address, delivered total, and payment state at the
  final step, then follow the harness's approval requirements.
- Never inspect cookies, passwords, authentication tokens, local storage, the
  Chrome profile database, or Bitwarden vault contents. Operate only the visible
  Bitwarden autofill UI and Lazada session state; never read, copy, reveal, or
  report the credential itself.
- Preserve unrelated tabs. Close only task-created tabs when useful, and leave
  the finished report open as the deliverable.

## Workflow

### 1. Translate the request into buying criteria

Extract the user's real constraints before ranking anything:

- product type and intended use;
- hard dimensions, fit, compatibility, color, or material constraints;
- budget and whether it means item price or delivered total;
- location-dependent shipping or availability;
- must-haves, deal-breakers, and existing cart candidates.

Use reasonable assumptions for minor gaps and state them briefly. Ask only when a
missing answer would materially change which product wins.

### 2. Connect to Lazada in Chrome

Reuse an existing Lazada tab when practical; otherwise open Lazada Thailand in the
normal Chrome session. Refresh relevant search, cart, and product pages when the
user asks, when a tab is stale, or before recording volatile facts such as price,
stock, shipping, ratings, and vouchers.

If Lazada is signed out, log in automatically before continuing:

1. Confirm the login page is on `lazada.co.th` or a subdomain of it. Do not use
   Bitwarden autofill on a lookalike or redirected non-Lazada domain.
2. Invoke the visible Bitwarden autofill surface, select the saved Lazada login,
   let Bitwarden fill the form, and submit it. This login submission is already
   authorized; do not ask the user to approve it again.
3. Verify authentication from visible Lazada account state or the requested
   account page before reading order history, mutating the cart, or preparing
   checkout.
4. If the native Chrome connector cannot operate the Bitwarden extension UI,
   follow the harness adapter below instead of stopping at the login page.

Pause only when the remaining step inherently needs the user, such as CAPTCHA,
OTP, account verification, or unlocking a locked Bitwarden vault. Keep the same
tab open and ask for only that minimum action. Do not switch to a headless browser,
generic web search, another profile, or a different account.

<codex_skill_adapter>
In Codex, use the native Chrome connector first. If it is unavailable or cannot
operate Bitwarden's visible extension or autofill UI, invoke the installed
`computer-use` skill and control the same visible Chrome session with mouse and
keyboard. Continue the Lazada login and requested workflow there; do not stop and
ask the user to sign in manually unless CAPTCHA, OTP, account verification, or a
locked vault actually requires them.
</codex_skill_adapter>

### 3. Audit the cart when it is relevant

If the user says they may already have candidates in the cart, inspect the cart
before final ranking.

- Record the cart's displayed total item count.
- Lazy-load or scroll through the complete cart, not only the first viewport.
- Identify every relevant item and its selected variant, current price, stock,
  seller, and shipping when visible.
- Mark relevant candidates **IN YOUR CART** in working data and in the report.
- If the cart is large, report both the total cart count and the number of relevant
  matches found so the coverage is auditable.

Do not infer that two listings are different products merely because their titles
or sellers differ. Compare the actual selected variants and specifications.

### 4. Search and inspect real product pages

Search with multiple useful phrasings, then open the strongest candidates. Search
cards and snippets are discovery aids, not evidence. Inspect the product page for
every shortlisted item.

Capture, when relevant and available:

- exact product title and selected variant;
- dimensions, compatibility, fit limits, material, weather resistance, assembly,
  and seller-claimed load or performance limits;
- item price, shipping to the presented destination, and **delivered total**;
- whether a discount requires a voucher, coins, bundle, or other condition;
- rating, review count, seller score, and other trust evidence;
- stock, preorder status, delivery estimate, and return information;
- exact Lazada product URL and a clear primary product image URL;
- cart status and any unresolved fit or specification uncertainty.

Treat seller specifications and load ratings as claims unless independent evidence
supports them. Distinguish what was observed from what was inferred.

### 5. Normalize before comparing

- Compare the same size, color, model, and bundle wherever possible.
- Calculate delivered total as displayed item price plus displayed shipping. Do not
  count optional vouchers, coins, or future coupons unless they are already applied.
- If shipping is unavailable, show the item price and label shipping unknown; do
  not invent a delivered total.
- Deduplicate identical listings or variants unless seller, warranty, delivered
  price, or trust evidence creates a meaningful buying difference.
- When two candidates are the same design in different sizes, say so plainly and
  compare the exact size and price delta instead of manufacturing distinctions.

### 6. Score and rank honestly

Use a 10-point score with one decimal. Start with this weighting, then adjust only
when the user's explicit priorities require it:

| Dimension | Weight | What it measures |
|---|---:|---|
| Fit and specification confidence | 30% | Compatibility, dimensions, constraint clarity |
| Delivered value | 25% | Total cost relative to useful size/features |
| Review and seller evidence | 20% | Rating volume, seller score, credibility |
| Quality and durability | 15% | Materials, construction, weather/usage suitability |
| Availability and convenience | 10% | Stock, delivery, assembly, return friction |

Apply visible uncertainty penalties when a critical fit, variant, shipping charge,
or material claim is missing. The ranking is comparative within the current
shortlist, not a universal product rating. Keep detailed scoring notes available
for verification, but keep the published report visually concise.

### 7. Publish the shopping report

For multi-product research, comparisons, or cart reviews, default to a permanent
HTML report using `report-publisher` → **Visual Product Shortlist — Material 3
Standard Feed (Template A)**. All Lazada reports use this structure unless the
user explicitly chooses another template. If the user explicitly asks for only a
quick answer, a full report is optional.

The report should normally contain 4–8 strong candidates and must be image-led:

- a real Material 3 top app bar with Lazada Thailand, absolute checked date, and
  a persistent light/dark toggle (dark by default);
- working filter chips for All, Buy, Keep, Consider, Skip, and In cart;
- a responsive ranked card grid with one large uncropped photo per candidate;
- score, delivered total, no more than three useful fact chips, and one short
  verdict;
- an obvious **Top pick** state on the #1 card plus Buy/Keep/Consider/Skip chips;
- **IN YOUR CART** badges for every relevant cart candidate;
- one obvious **View on Lazada** button pointing to the exact product page;
- minimal prose: no duplicate table, methodology section, chart, navigation, or
  long explanation unless the user explicitly asks for detail.

Delegate the frontend to Claude Fable with the verified product dataset and exact URLs.
Publish permanently through here.now, then open the live URL in Chrome.

### 8. Verify from the user's perspective

Do not call the research finished until the live report proves the workflow:

- the report URL returns HTTP 200;
- the number of cards matches the shortlisted items;
- every product image loads with nonzero natural dimensions and is visibly clear;
- every CTA contains the exact Lazada product URL;
- every relevant cart item has the cart badge, with no false cart badges;
- displayed dimensions, variants, prices, delivered totals, and scores match the
  verified working data;
- the report is readable on desktop and narrow widths without horizontal scrolling;
- the report is left open in Chrome for the user.

If visual inspection finds darkened, cropped, broken, or misleading photos, send
the issue back to Claude for a focused correction and repeat verification.

## Final response

Lead with the clickable visual report URL. Keep the handoff short:

```text
[Open the visual Lazada shortlist](REPORT_URL)

BUY #1: [Product](DIRECT_LAZADA_URL)
KEEP: [Best relevant cart item](DIRECT_LAZADA_URL)
```

Mention only material caveats, such as an unverified rail width, unknown shipping,
or a price that depends on a voucher. Do not replace the visual report with a wall
of prose.

## Failure handling

- **Signed out:** attempt the saved Bitwarden login automatically; being signed out
  is not itself a user blocker.
- **Chrome cannot operate Bitwarden in Codex:** use `computer-use` in the same
  visible Chrome session and continue.
- **CAPTCHA, OTP, verification, or locked Bitwarden vault:** keep the tab and ask
  for the minimum manual action needed.
- **Product page removed or sold out:** mark it unavailable and exclude it from the
  winning recommendation unless the user wants historical comparison.
- **Image hotlink fails in the report:** use another verified Lazada-hosted product
  image from the same listing; do not publish a broken placeholder.
- **Price or shipping changed during research:** refresh the affected page, update
  the report, and use the latest observed value with an absolute checked date.
