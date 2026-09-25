---
name: design-flow
description: The engine behind the anshul-design and helix-design-anshul doors. Use for any page, dashboard, report, tech design, mock or control surface. Infers what it can, asks the rest with checkbox questions at one of three levels (quick, medium, detailed), shows the looks you asked for on a swatch board, then builds, verifies with Playwright and publishes the way the door's profile says. Load it through a door when one exists; on its own it uses profiles/default.md.
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

## Live design requests (Claude Code only)

For a design room open in the browser while you work with Claude Code. The user fills the room's New design form; this session builds it.

Set up a room once:
1. Copy `assets/requests/request-form.js` and `requests_api.py` next to the room's server (or run `python3 assets/requests/requests_server.py <room> --port 7333` if it has none).
2. In the room server, route `/requests` through `requests_api.handle(...)`; add `features: ['requests']` to `/ping`.
3. Add `<div data-new-design></div>` where the button should sit, and `<script src="request-form.js" data-api="http://127.0.0.1:<port>" data-room="<name>" data-bases="d1:Name,..." data-screens="id:Label,..."></script>`.
4. Load finished designs from `_requests/designs.js` (`window.EXTRA_DESIGNS`, same shape as the room's design list).

Watch while you work: start the Monitor tool on `sh assets/requests/watch-requests.sh <room>`. Each `NEW_REQUEST <file>` line is one request. Also check `_requests/` for `pending` files whenever you open a room.

Build a request:
1. Set `status` to `building` and `updated` in its JSON file.
2. Read the room's `BRIEF.md`, `CONTENT.md` and `DIRECTIONS.md`, the base design if `base` is set, and the request fields: theme (dark means dark first with light accents), mood, palette, keep, avoid, screens, notes, inspiration.
3. Give it a short name that says what makes it different (the form does not ask for one) and write it to `name`. Write a direction message from the fields and build `<room>/<next id>-<slug>/index.html` with a Fable subagent (`design-bakeoff/references/builder-prompt.md`), or yourself for small changes. Verify and shoot exactly as the room's brief says, with the same shot names as the other designs.
4. Append an entry to `_requests/designs.js` (id, name, fam, dir, line, fonts, dark and light swatches, status `verified`).
5. Set `status` to `done`, `result` to `{ "dir": "<folder>", "verified": true, "message": "<one line>" }`. On failure set `failed` with the reason in `result.message`.
6. Tell the user in one line and open the room in Chrome.



Never ask what you can read.

| Fact | Where to read it |
| --- | --- |
| Profile, when no door was used | git remote under github.com/AyaHelix means aya; otherwise personal |
| Page kind | the request: report, tech design, dashboard, landing, app screen, mock |
| Dark or light | tokens or theme files already in the repo; else the look's `first` |
| Palette in use | an existing tokens.css or theme file; reuse it unless asked to change |
| Last look used | `~/.design-flow/state.json`, key `last.<profile>.<pageKind>`; never offer it first |
| Looks to compare | a number in the request ("show me 5 looks"); else ask |
| Level | "quick", "just make it", "same as last time" mean quick; "options", "let me pick", "walk me through" mean detailed; else `level_default` |
| Publish | the profile |

## Step 2: ask by level

Use AskUserQuestion. One call per screen, at most 4 questions per call, 2 to 4 options each. Every screen's last question offers `Go deeper` (moves up one level, answers carry over). Skip any question step 1 already answered.

Quick, one screen:

| Header | Options |
| --- | --- |
| Page kind | Report or tech design · Dashboard or control surface · Landing or marketing · App screen or mock |
| Mood | Calm and bold · Playful · Editorial · Technical |
| Looks | 3 (Recommended) · 4 · 6 · All |
| Depth | Quick is fine (Recommended) · Go deeper |

Dark or light is not a question: the board flips between them, and the build ships both.

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
| Inspiration | Pull inspiration first · Skip |

If the user wants inspiration and chose it here, ask one more multi-select question for sources (Header: Sources, 4 options per question: Dribbble, Behance, 21st.dev, Awwwards · SaaS Landing Page, Lapa Ninja, Browse links only (Godly, Land-book, Dark Mode Design, SiteInspire), Login sites (Mobbin, Refero, Page Flows)). Only the first six return search results; the rest open in Chrome. Default without asking: every source that fits the page kind in `assets/inspire/sources.json`.

## Step 2.5: inspiration (optional)

Run it when the user asks for inspiration, references or "show me what's out there", when they pick it in the detailed path, or when medium answers point nowhere clear. Offer it in one line at quick; never force it.

```bash
node <this skill>/assets/inspire/inspire.mjs "<page kind> <mood words>" --kind <report|dashboard|landing|app|all> --per 8 --tone dark --out <scratch>/inspire [--sources dribbble,behance,21st]
open -a "Google Chrome" <scratch>/inspire/picker.html
```

Tone defaults to dark: about four dark shots to one light one, with the light ones spread through the grid. Use `--tone light` for a light-first page or `--tone any` for no filter; `--dark-share 0.8` sets the mix. The picker has Dark and Light chips to filter.

The picker is local only: thumbnails link back to their source and are never published. Sites that need a login show as link cards that open in Chrome.

The user likes, skips, tags (layout, colour, type, motion, data viz, density, navigation, illustration) and notes shots, then clicks Done. Keys: arrows or J/K move, L or Space likes, X skips, Enter opens large, O opens the site, U undoes, C compares likes, / filters.

Read the picks from the vote server (`GET http://127.0.0.1:7331/votes`, component `inspire`, the `design` field is JSON), or from the page title (`INSPIRE DONE <n>`) plus the copied JSON the user pastes. Look at the liked images yourself. Then:

1. Say in three bullets what the picks share: layout, colour and type, and the tags and notes.
2. Rank the library looks against that and offer the closest ones on the swatch board.
3. If nothing in the library is close, draft a new look file from the picks (copy `directions/_template.md`), add it to the board, and save it to `extra_directions` if the user keeps it.

## Step 3: swatch board

1. Pick as many looks as asked (default 3) from `directions/` (and `extra_directions`) that match the answers: `best`, `mood`, then palette and type when known. Drop the last look used. No two with the same display font. "All" means every look in the library.
2. Build and show it:

```bash
python3 <this skill>/assets/swatch/make-swatch.py plum-report,swiss-broadsheet,toy-blocks --out <scratch>/swatch.html
open -a "Google Chrome" <scratch>/swatch.html
```

3. Say in one line what differs between them. The user picks on the board (Pick button or number keys) or by name. "Show more" repeats with the next set. Medium and detailed also flip each card to its other theme.
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
| `assets/requests/` | `request-form.js` (New design form), `requests_api.py` and `requests_server.py` (queue), `watch-requests.sh` (Monitor watcher) |
| `assets/inspire/` | `sources.json` (6 galleries scraped: Dribbble, Behance, 21st.dev, Awwwards, SaaS Landing Page, Lapa Ninja; 7 more as Browse links), `inspire.mjs` (scrape to a local board), `picker.html` (the picker) |
| `profiles/default.md` | used when no door is loaded |
