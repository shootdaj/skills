---
name: design-flow
description: The engine behind the anshul-design and helix-design-anshul doors. Use for any page, dashboard, report, tech design, mock or control surface, and to watch a design room for New design requests ("watch the room", "start the design room"). Infers what it can, asks the rest with checkbox questions at one of three levels (quick, medium, detailed), shows an inspiration picker you can skip in one tap, then builds as many full designs as you asked for. Two or more designs always open the design room (preview, compare, vote, pins, notes, New design). Verifies with Playwright and publishes the way the door's profile says. Load it through a door when one exists; on its own it uses profiles/default.md.
---

# design-flow

One engine, two doors. A door hands over a profile block; this skill does the rest. Without a door, use `profiles/default.md`.

The flow is: infer, ask, inspiration picker, build. One design is a straight build. Two or more designs mean the design room, always: builders never write their own picker or index page.

## Profile contract

| Field | Meaning |
| --- | --- |
| `name` | personal, aya, default |
| `publish.target` | where pages go: here.now, a folder, a host |
| `publish.access` | public, restricted:<domain>, private |
| `publish.post_to` | where to post the link: Linear, Confluence, none |
| `publish.room` | where a design room goes: azure-sso (the azure-static-publish skill), personal host, local |
| `ui_kit` | skill for product UI (kira) or none; `ui_kit_required: all` means every build uses it, room designs included |
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
| How many designs | a number in the request ("show me 5 designs"; "just build it" means 1); else ask |
| Level | "quick", "just make it", "same as last time" mean quick; "options", "let me pick", "walk me through" mean detailed; else `level_default` |
| Publish | the profile |

## Step 2: ask by level

Use AskUserQuestion. One call per screen, at most 4 questions per call, 2 to 4 options each. Every screen's last question offers `Go deeper` (moves up one level, answers carry over). Skip any question step 1 already answered.

Quick, one screen:

| Header | Options |
| --- | --- |
| Page kind | Report or tech design · Dashboard or control surface · Landing or marketing · App screen or mock |
| Mood | Calm and bold · Playful · Editorial · Technical |
| Designs | 1 · 3 (Recommended) · 5 · Other for any number |
| Depth | Quick is fine (Recommended) · Go deeper |

The Designs answer is how many full designs get built. 1 is a straight build of one page. 2 or more scaffold the design room and build that many in parallel (step 4). This is the only count question; do not add another.

Dark or light is not a question: every build ships both, and the room flips the framed design between them.

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
| Sources (multi) | Dribbble, Behance, 21st.dev, Awwwards · SaaS Landing Page, Lapa Ninja · Browse links only (Godly, Land-book, Dark Mode Design, SiteInspire) · Login sites (Mobbin, Refero, Page Flows) |

Only the first six sources return search results; the rest open in Chrome. Default without asking: every source that fits the page kind in `assets/inspire/sources.json`.

## Step 3: inspiration picker (default, skip in one tap)

Run it every time unless the user said "just build it" or step 1 already found references. The picker's first control is Skip, so it costs one tap when the user does not want it.

```bash
node <this skill>/assets/inspire/inspire.mjs "<page kind> <mood words>" --kind <report|dashboard|landing|app|all> --per 8 --tone dark --out <scratch>/inspire [--sources dribbble,behance,21st]
open -a "Google Chrome" <scratch>/inspire/picker.html
```

Tone defaults to dark: about four dark shots to one light one, with the light ones spread through the grid. Use `--tone light` for a light-first page or `--tone any` for no filter; `--dark-share 0.8` sets the mix. The picker has Dark and Light chips to filter.

The picker is local only: thumbnails link back to their source and are never published. Sites that need a login show as link cards that open in Chrome.

The user likes, skips, tags (layout, colour, type, motion, data viz, density, navigation, illustration) and notes shots, then clicks Done or Skip. Keys: arrows or J/K move, L or Space likes, X skips, Enter opens large, O opens the site, U undoes, C compares likes, / filters.

Read the picks from the vote server (`GET http://127.0.0.1:7331/votes`, component `inspire`, the `design` field is JSON), or from the page title (`INSPIRE DONE <n>`, or `INSPIRE SKIPPED` when they skipped) plus the copied JSON the user pastes. Look at the liked images yourself. Then say in three bullets what the picks share: layout, colour and type, and the tags and notes. Those bullets steer the directions in step 4; they never narrow the run to one design.

## Step 4: pick directions and build

Pick as many directions as the Designs answer from `directions/` (and `extra_directions`) that match the answers and the inspiration bullets: `best`, `mood`, then palette and type when known. Drop the last look used. No two with the same display font, palette or layout form. When nothing in the library fits, write a new direction from the picks (copy `directions/_template.md`) and save it to `extra_directions` if the user keeps it.

Recipe by page kind, for every design:

| Page kind | Recipe |
| --- | --- |
| Report or tech design | the `report_recipe` skill with the chosen look's tokens in place of its default |
| App screen or mock | the `ui_kit` skill when the profile has one; otherwise core mechanics plus the look |
| Dashboard, landing, other | core mechanics plus the look; `frontend-design` for boldness when installed |

When the profile says `ui_kit_required: all`, every recipe uses the `ui_kit` skill, room designs included.

Always: `anshul-ui-standards-v2` (its SKILL.md plus `references/material-usability.md`, `theming.md`, `dataviz-motion.md`); the look's tokens, type, radius, motion signature and forms; profile vocabulary; every visible string through the `copy` skill.

### One design

Build it yourself, open it in Chrome as sections land, and save the look to `~/.design-flow/state.json` under `last.<profile>.<pageKind>`.

### Two or more designs: the room

1. Scaffold the room next to the work (a `<project>-designs/` folder is the norm):

```bash
python3 <this skill>/assets/room/make-room.py <dir> --project "<Name>" --steps "id:Label,..." --designs "d1:Name,d2:Name,..." [--components "id:Label:hint,..."] [--shots "file:Label:component,..."] [--langs "en:EN,es:ES"] [--ui-kit kira]
```

   It writes `index.html` (the room), `room.js` (its config), `_vote/` (bridge, vote widget, server, request form), `_requests/designs.js` and a `BRIEF.md` skeleton. It opens nothing. `--designs` lists the designs as building stubs so the rail shows them from the start. Pass `--ui-kit kira` when the profile requires the kit. Fill in the brief's TODO lines (product, steps, content pack, direction slots) before builders start. Steps are the screens the room drives from its Step buttons; for a page with no flow, one step is fine.
2. Start the vote server (`python3 <dir>/_vote/server.py &`) and open `<dir>/index.html` in Chrome. Start the watcher (below) so the New design button works.
3. Build the designs in parallel with Fable subagents, one per design. Each prompt carries: the room's `BRIEF.md` path, its direction message, its id and name (`d1`, `d2`, ...), the request-file progress protocol below with a request file you created in `_requests/` for it, and `design-bakeoff/references/builder-prompt.md`. Builders follow `BRIEF.md`: hooks for the bridge, `../_vote/hub-bridge.js` before `../_vote/vote.js`, the room's exact shot names, then register in `_requests/designs.js` (that entry completes the stub). They never create a picker, index or ballot page of their own; the room is the only place designs are compared.
4. As each design lands the watcher reloads the room. Look at the shots yourself. The room stays open for New design (Auto or Guided) and for votes, pins and notes.

## Step 5: verify

`anshul-ui-standards-v2/references/verification.md`: both themes, 1440 and 800, zero console errors, 12 px text floor, 44 px targets, no horizontal scroll. Look at the screenshots. Reports use `helix-report/assets/shoot.mjs`. For a room, also load `index.html` at 1440 in Preview and Compare, dark and light, with zero console errors, and check the framed design answers the room's Step and Theme controls (the ack pill reads "Design follows hub controls").

## Step 6: publish

Do what `publish.*` says, post the link where `post_to` says, state the access mode in the reply. Never print an API key.

A room publishes as a folder: `index.html`, `room.js`, `_vote/*.js`, `_vote/*.py`, `_requests/designs.js` and every finished design folder with its shots. Leave out `_vote/*.json`, `_vote/*.jsonl`, `_requests/*.json`, backups and unfinished design folders. Where it goes is `publish.room`: azure-sso through the azure-static-publish skill, the personal host, or local only.

## Live design requests (Claude Code only)

For a design room you work on with Claude Code. Invoke from the project's own build agent with `/design-flow watch the room` (or "start the design room"). Claude drives a Chrome window; the user picks in it. No server and no network calls: the form saves requests in the page's localStorage, and the watcher reads them out of that window.

### Set up a room once
Rooms made with `assets/room/make-room.py` are ready: the request form and `_requests/designs.js` are in place, and the room lists every design in `room.js` plus `window.EXTRA_DESIGNS`. For a hand-made page, copy `assets/requests/request-form.js` next to it, add `<div data-new-design></div>` where the button should sit plus `<script src="request-form.js" data-room="<name>" data-bases="d1:Name,..." data-screens="id:Label,..."></script>`, and load finished designs from `_requests/designs.js`.

### Watch
Start the Monitor tool (30 minute timeout, re-arm on expiry while the user is working) on:
`node <this skill>/assets/requests/browser-watch.mjs <room url or index.html> --room <room dir> 2>&1 | grep --line-buffered -E "WATCHING|NEW_REQUEST|DONE|WATCH_ENDED|rror"`
It opens the room in a Chrome window with its own profile (`~/.design-flow/browser`, so a hosted room's SSO sign-in is remembered), mirrors each new request to `<room>/_requests/<id>.json` and prints `NEW_REQUEST <file>`, copies `status`, `name`, `stage`, `percent`, `progress` and `result` back into the page every 2 seconds, and reloads it when a design is done. Tell the user to use that window. `WATCH_ENDED` means they closed it; offer to reopen. Only one watcher per room at a time.

### Progress protocol (the room shows it live)
The rail shows each request's stage, a progress bar, an ETA (from `eta`, else estimated from percent and elapsed time) and the latest line; clicking it opens a timeline. Whoever builds writes these fields into the request file (read it, keep every field, write it back):
- `started` (ISO time when building begins), optional `eta` (ISO time you expect to finish; a full design is about 35 minutes) or `estimateMin`, `stage` (short label), `percent` (0 to 100), and append `{ "t": "<ISO time>", "msg": "<one plain-English line>" }` to `progress`.
- Milestones: picked up (5), reading brief (10), direction locked (20, name the look), frame and first screens built (40), all screens built (60), verifying (75), fixing (85, say what), shots done (95), registered and done (100).
- A builder subagent gets the request file path and this protocol in its prompt. The main agent sets `status` to `done` only after registering the design.

### Build a request
1. Set `status` to `building`, `stage` to `picked up`, `percent` to 5, and add a progress line.
2. If `mode` is `auto`: list every design already in the room (`room.js`, `DIRECTIONS.md`, `_requests/designs.js`) and every look in `directions/`, then pick or invent a direction that shares none of their palettes, display fonts, layout forms or motion signatures. Respect `theme` if set; treat inspiration picks as a nudge. Otherwise (`guided`), read the room's `BRIEF.md`, `CONTENT.md` and `DIRECTIONS.md`, the base design if `base` is set, and the request fields: theme (dark means dark first with light accents), mood, palette, keep, avoid, screens, notes, inspiration.
3. Give it a short name that says what makes it different (the form does not ask for one) and write it to `name`. Write a direction message from the fields and build `<room>/<next id>-<slug>/index.html` with a Fable subagent (`design-bakeoff/references/builder-prompt.md`), or yourself for small changes. Verify and shoot exactly as the room's brief says, with the same shot names as the other designs.
4. Append an entry to `_requests/designs.js` (id, name, fam, dir, line, fonts, dark and light swatches, status `verified`).
5. Set `status` to `done`, `result` to `{ "dir": "<folder>", "verified": true, "message": "<one line>" }`. On failure set `failed` with the reason in `result.message`.
6. Add a final progress line, tell the user in one line, and leave the room window open (the watcher reloads it).

## Adding a look

Copy `directions/_template.md`, fill both themes, fonts with the Google Fonts query, radius, `best` and `avoid`, then the prose. A room winner is added the same way.

## Files

| Path | Holds |
| --- | --- |
| `anshul-ui-standards-v2` (sibling skill) | the mechanics: usability, theming cascade, dataviz and motion, verification, tokens, theme toggle. `anshul-ui-standards` (v1) stays untouched for older work |
| `directions/` | one file per look, eleven to start, plus `_template.md` |
| `assets/room/` | the design room template: `index.html` (preview in device frames, compare as grid, pair or duel, blind mode, per-element votes, pins, notes, export, Expand and Full screen, New design with progress and ETA), `_vote/` (`hub-bridge.js`, `vote.js`, `server.py`, README), `make-room.py` (scaffolds a room, `room.js`, `_requests/designs.js` and a `BRIEF.md` skeleton) |
| `assets/requests/` | `request-form.js` (New design form, localStorage only; `make-room.py` copies it into a room's `_vote/`), `browser-watch.mjs` (opens the room in a Claude-driven Chrome window and bridges its queue to files), `requests_api.py` (the request queue the room's `server.py` imports), `requests_server.py` / `watch-requests.sh` (older file-queue path, optional) |
| `assets/inspire/` | `sources.json` (6 galleries scraped: Dribbble, Behance, 21st.dev, Awwwards, SaaS Landing Page, Lapa Ninja; 7 more as Browse links), `inspire.mjs` (scrape to a local board), `picker.html` (the picker) |
| `profiles/default.md` | used when no door is loaded |
