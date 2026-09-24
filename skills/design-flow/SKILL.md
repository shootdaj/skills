---
name: design-flow
description: The engine behind the anshul-design and helix-design-anshul doors. Use for any page, dashboard, report, tech design, mock or control surface. Infers what it can, asks the rest with checkbox questions at one of three levels (quick, medium, detailed), shows three looks on a swatch board, then builds, verifies with Playwright and publishes the way the door's profile says. Load it through a door when one exists; on its own it uses profiles/default.md.
---

# design-flow

One engine, two doors. A door hands over a profile block; this skill does the rest. Without a door, use `profiles/default.md`.

## Profile contract

| Field | Meaning |
| --- | --- |
| `name` | personal, aya, default |
| `publish.target` | where pages go: here.now, a folder, a host |
| `publish.access` | public, restricted:<domain>, private |
| `publish.post_to` | where to post the link: Linear, Confluence, none |
| `ui_kit` | skill for product UI (kira) or none |
| `vocabulary.terms` | domain words to keep as they are |
| `vocabulary.hues` | category to hue slot, c1 to c5 |
| `extra_directions` | folder with more look files |
| `mechanics` | the house-rules skill: anshul-ui-standards-v2 |
| `report_recipe`, `bakeoff`, `copy` | skills to call: helix-report, design-bakeoff, humanizer |
| `level_default` | quick, medium or detailed when the wording does not say |

Missing fields fall back to `profiles/default.md`. Skip any skill named in the profile that is not installed, and say so once.

## Step 1: infer before asking

Never ask what you can read.

| Fact | Where to read it |
| --- | --- |
| Profile, when no door was used | git remote under github.com/AyaHelix means aya; otherwise personal |
| Page kind | the request: report, tech design, dashboard, landing, app screen, mock |
| Dark or light | tokens or theme files already in the repo; else the look's `first` |
| Palette in use | an existing tokens.css or theme file; reuse it unless asked to change |
| Last look used | `~/.design-flow/state.json`, key `last.<profile>.<pageKind>`; never offer it first |
| Level | "quick", "just make it", "same as last time" mean quick; "options", "let me pick", "walk me through" mean detailed; else `level_default` |
| Publish | the profile |

## Step 2: ask by level

Use AskUserQuestion. One call per screen, at most 4 questions per call, 2 to 4 options each. Every screen's last question offers `Go deeper` (moves up one level, answers carry over). Skip any question step 1 already answered.

Quick, one screen:

| Header | Options |
| --- | --- |
| Page kind | Report or tech design · Dashboard or control surface · Landing or marketing · App screen or mock |
| Theme | Dark first · Light first · Both, dark default |
| Mood | Calm and bold · Playful · Editorial · Technical |
| Depth | Quick is fine (Recommended) · Go deeper |

Medium, one more screen:

| Header | Options |
| --- | --- |
| Palette | Warm · Cool · Neutral · Candy |
| Type | Grotesk · Serif accent · Mono heavy · Rounded |
| Motion | Calm · Standard · Lively |
| Editions (multi) | Full · Lean with appendix · Prototypes chapter · Go deeper |

If the profile does not fix publishing, add: Publish: Profile default · Local file only · Draft link, private.

Detailed, two more screens:

| Header | Options |
| --- | --- |
| Shape | Soft, 16 px · Regular, 12 px · Sharp, 2 px |
| Density | Airy · Regular · Dense |
| Lights | Tiles only · Every status · None |
| 3D | Isometric SVG · WebGL with fallback · None |
| Forms (multi, one question per block that matters: navigation, headline numbers, takeaways, main diagram, status view, sections) | options from `design-bakeoff/templates/BRIEF-2.md` |
| Fit | Looks in the library fit · None fit, run design-bakeoff |

## Step 3: swatch board

1. Pick three looks from `directions/` (and `extra_directions`) that match the answers: `best`, `mood`, `first`, then palette and type when known. Drop the last look used. No two with the same display font.
2. Build and show it:

```bash
python3 <this skill>/assets/swatch/make-swatch.py plum-report,swiss-broadsheet,toy-blocks --out <scratch>/swatch.html
open -a "Google Chrome" <scratch>/swatch.html
```

3. Say in one line what differs between the three. The user picks on the board (Pick button or keys 1 to 3) or by name. "Show 3 more" repeats with the next three. Medium and detailed also flip each card to its other theme.
4. Read the pick from the page title (`PICKED <id>`) via Playwright, or from the reply. Save it to `~/.design-flow/state.json` under `last.<profile>.<pageKind>`.

## Step 4: build

| Page kind | Recipe |
| --- | --- |
| Report or tech design | the `report_recipe` skill with the chosen look's tokens in place of its default |
| App screen or mock | the `ui_kit` skill when the profile has one; otherwise core mechanics plus the look |
| Dashboard, landing, other | core mechanics plus the look; `frontend-design` for boldness when installed |

Always: `anshul-ui-standards-v2` (its SKILL.md plus `references/material-usability.md`, `theming.md`, `dataviz-motion.md`); the look's tokens, type, radius, motion signature and forms; profile vocabulary; every visible string through the `copy` skill. Open the page in Chrome as sections land.

## Step 5: verify

`anshul-ui-standards-v2/references/verification.md`: both themes, 1440 and 800, zero console errors, 12 px text floor, 44 px targets, no horizontal scroll. Look at the screenshots. Reports use `helix-report/assets/shoot.mjs`.

## Step 6: publish

Do what `publish.*` says, post the link where `post_to` says, state the access mode in the reply. Never print an API key.

## Adding a look

Copy `directions/_template.md`, fill both themes, fonts with the Google Fonts query, radius, `best` and `avoid`, then the prose. Run `make-swatch.py <id>` to see it. A bake-off winner is added the same way.

## Files

| Path | Holds |
| --- | --- |
| `anshul-ui-standards-v2` (sibling skill) | the mechanics: usability, theming cascade, dataviz and motion, verification, tokens, theme toggle. `anshul-ui-standards` (v1) stays untouched for older work |
| `directions/` | one file per look, eleven to start, plus `_template.md` |
| `assets/swatch/` | `make-swatch.py`, `shoot-swatch.mjs`, `vote.js` |
| `profiles/default.md` | used when no door is loaded |
