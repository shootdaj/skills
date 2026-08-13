# Visual proof report contract

## Purpose

Make verified engineering evidence understandable at a glance. The report is a proof surface, not a test-log dump or a marketing page.

## Required page order

```text
Compact app bar · report identity · theme toggle
What this change does
Exact test results and proof cards
What remains unproven
What the user must review or decide
Exact PR, CI, artifact, and source links
Collapsed technical evidence
```

## First screen

Show 3–6 decisive facts without scrolling past context:

- what the change actually adds or fixes;
- passed scenarios and total;
- failures;
- exact commit/build/PR state;
- what remains unproven;
- the user's next decision or action.

Use compact facts, not a decorative chart or verdict speech. Do not define `verified`, explain the report, or repeat evidence policy.

## Optional behavior diagram

Omit diagrams by default. Include one only when it explains a specific tested behavior or decision path more clearly than the proof cards. Never include a generic process such as `accept → check → work → verify → report`.

When justified, use a short left-to-right or top-to-bottom flow. Each stage has:

- one SVG icon;
- a 2–4 word title;
- one short explanation;
- a connector showing order.

The diagram must map directly to executed evidence. It must not explain the report, restate the test count, or consume space without changing a user decision.

## Proof cards

Use one consistent responsive grid. Each card contains:

1. SVG icon, plain-English title, and explicit result chip.
2. A small behavior-specific visual: before/after state, progress bar, ordered preference, fallback arrow, capacity count, or decision path.
3. The four fixed fields: `What I tested`, `Why it matters`, `What breaks if it fails`, `Observed proof`.
4. A collapsed evidence row containing exact technical details.

Avoid generic paragraphs. No card field may exceed two short sentences. `Observed proof` must contain a concrete result from the executed test, not an invented scenario. Prefer specific verbs: interrupted, corrupted, removed, replayed, rejected, restored, exceeded.

## Limitations

Place a high-visibility amber panel after the cards. Title it `What this does not prove yet` or equally direct language. List missing environments, workflows, integrations, and user-facing proof. Name the next phase or owner when known.

Never use `passed` to imply that these limitations are complete.

## Technical evidence

Keep it collapsed by default. Include:

- exact commands and exit results;
- test and requirement identifiers;
- commit/build/PR identity;
- CI and preview run links;
- controlled environment details;
- reviewer result and severity scope;
- artifact paths or downloadable evidence.

Provide copy buttons only for commands worth rerunning. Do not expose credentials, tokens, private paths, or sensitive data.

## Visual language

Material Design 3 and Google's clean, information-first design language are **binding requirements**, not optional styling.

- Mostly visual; no walls of text.
- Material 3 adaptive chassis: compact top app bar, persistent navigation rail at wide widths, modal navigation drawer opened from an app-bar menu icon button at narrow widths. Add a FAB only when it carries a real navigation or primary-action purpose — never as decoration.
- Material 3 semantic tokens only inside components: tonal surface tiers (`surface`, `surface-container` low→highest), on-surface roles, primary/on-primary/primary-container, outline roles, and semantic status roles. No hardcoded colors in component rules.
- Restrained Google blue as the single primary. Google-like semantic green (pass), amber (limits), red (fail) status roles. No rainbow branding, no decorative Google-logo imitation.
- Depth mostly through tonal surface hierarchy; a low, coherent elevation scale for the few surfaces that float.
- Dark theme is the default; the light theme is fully designed, not a mechanical inversion.
- Roboto Flex for display and body, Roboto Mono for technical evidence and data, with system fallbacks. Never claim or embed proprietary Google Sans.
- Material type roles (display, headline, title, body, label) with disciplined whitespace on a 4/8dp spacing rhythm.
- Material Symbols Rounded (or equivalent inline SVG) for icons; never emoji as icons or controls.
- Coherent Material shape scale: small radii for chips and code blocks, 12–16dp cards, up to 28dp for hero surfaces, pill-shaped buttons and navigation indicators.
- All interactive targets at least 48px, with visible state layers: hover, focus, pressed, selected, and disabled states.
- Meaningful, restrained motion with Material easing; respect reduced motion.
- No page-level horizontal overflow.
- Technical evidence collapsed by default.
- Self-contained single file except Google Fonts / Material Symbols stylesheet requests.

## Interaction minimum

Provide working navigation, theme toggle, proof-detail toggles, expand/collapse control, and exact source links. On narrow screens, the navigation drawer opens from the app-bar menu button and must dismiss by close button, scrim, and Escape.

## Truth audit

Before the placeholder scan, apply the decision-usefulness gate: every visible block must help the user judge the change, proof, risk, or next action. Delete generic diagrams, definitions of verification, report-about-the-report prose, decorative verdicts, repeated requirement lists, and filler metrics.

Before publication, run the mandatory placeholder-leak gate: scan the final HTML for every sample/template identifier — `Sample Feature`, `Project Name`, placeholder URLs (`ORG/REPO`, `github.com/ORG`, `runs/0000000000`), zero commits (`0000000`, the 40-zero hash), sample dates (`2026-01-01`), `SAMPLE-*` test and requirement IDs, `PR #000`, `TICKET-000`, `TICKET-001`, and sample green-CI or requirement-coverage claims. Any survivor blocks publication until removed and the scan reruns clean.

Then verify:

- every number against raw evidence;
- every proof card against an executed test or runtime observation;
- every example matches the behavior without expanding the claim;
- every limitation is visible and current;
- exact code version and PR/merge state;
- local and live HTML agreement;
- HTTP 200 and exact destinations for all links.
