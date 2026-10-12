# 3D flow figure

A figure where things move through space: places sit on a ground plane, paths arc between them, glowing particles travel the paths, and a Play button flies the camera stop by stop. One include (`flow3d.js`) and one config object. The same config draws the flat fallback and renders to video.

Why: on 2026-10-11 Anshul saw the 3D figures in the footage-search report and said "Turn that into a recipe. I think that's a really good way to show flow diagrams and maps, like data flow, time flow, etc. like whatever flows basically." He added: "it should be used by reports when appropriate."

## Pick it, or a flat figure

Ask one question of the content: **does something move from place to place, and is the route, order or timing the point?**

Use the 3D flow figure for:

- **Data through a pipeline**: a clip from card to search result, a request through services, with branches and a merge. Starter: `starters/data-flow.html`.
- **Time**: a timeline where the gaps matter (decisions, releases, the days of a trip), flown along like a road. Starter: `starters/time-flow.html`.
- **Routes on a map**: travel legs, shipments, where footage was shot, placed by real latitude and longitude. Starter: `starters/map-flow.html`.
- Money or people moving through steps, when the path matters more than the exact amounts.

Use a flat figure instead when:

- **The reader must compare amounts**: cost per service, clips per month, a share of a total. Bars, a Sankey or a waffle read faster than particles.
- **Nothing moves**: a status grid, a list of parts, a ranking, layers of a system (the exploded stack is isometric SVG).

The test: if the 3D view shows nothing the flat one hides (route, order, branching, distance, gaps in time), ship the flat figure. 3D is never decoration.

### Or a similarity space

A second question: **is the meaning in closeness, with no route?** Items as points, where near means alike, clusters form, and the neighbors change with the query: search results, embeddings, recommendations, "what else is like this". Starter: `starters/similarity-space.html`. Pick a query; its marker lands near its cluster, fine lines link it to its matches, the matches brighten in turn, and the top three pull toward the camera with rank labels 1 to 3. A ranked list sits beside the stage (under it on phones), with query chips above.

- Pick the flow starters when the route, order or timing is the point; pick this when proximity, clusters or changing neighbors are.
- The starter's 96 items, two queries and ranks are invented and seeded. In a report, positions come from real similarity data through a documented method (for example a 3D projection of embeddings) and the ranks from the actual retrieval or selection, each with a source; when positions are projected, say on the page that visible 3D closeness only approximates the full data.
- Use a ranked list or table instead when the reader only needs the results, not where they sit among the rest.

## Anatomy

| Part | What it is | Config |
| --- | --- | --- |
| Stage | WebGL canvas with a transparent background, fog in the page's `--bg`, soft lights, drag to orbit, slow auto-turn, arrow keys | `camera`, `fov`, `fog`, `height`, `autoTurn` |
| Places | The stops: a shape, an HTML label and a sub-line, clickable | `places: [{ id, at: [x,y,z] or geo: [lat,lon], shape, hue, label, sub, say, size }]` |
| Paths | Arcs between places as thin glowing tubes; `via` points make a road | `paths: [{ from, to, via, hue, weight, lift, flow }]` |
| Flow | Comets moving along each path; `weight` (0 to 1, from real data) sets thickness and how many | `flow: { comets, speed, size }`, `flowSpeed`, or `flow: false` |
| Zones | Tinted platforms that group places ("On your Mac", "In the cloud") | `zones: [{ x: [x0,x1], z: [z0,z1], hue, label }]` |
| Marks | Labels on the ground: dates, gaps, notes | `marks: [{ at or geo, text, sub }]` |
| Camera tour | Scripted shots the Play button runs, eased, with a bright comet along each leg; it is a function of time, so the video matches | `tour: [{ to: id or [ids], dist, el, az, move, hold, say }]`, `tourEnd`, `tourHue`, `autoplay` |
| Labels | HTML in the page font, projected from 3D every frame; overlaps fade (active first, nearer next) | automatic; `declutter: false` turns it off |
| Map | Lat/long to ground units, a labelled graticule | `map: { center: [lat,lon], scale, grid }` |
| Point cloud | Real vectors as soft points, hover for a tooltip. An active query draws on the flat view too: its marker, links to its matches, badges for ranks 1 to 3 | `cloud: { points: [{ id, p: [x,y,z], hue, size, label }], query: { label, p, matches: [{ id, rank }], hue } }`; after changing `query`, call `redraw()` on the handle `Flow3D.mount` returns |
| Extras | Anything else, with Three.js in hand | `build: (stage, THREE) => {}` |
| Status line | One line under the controls that says what the camera is showing or what was clicked (`aria-live`) | `say` per place or tour step, `hint`, `flatHint`, `onPick(id, place)` |

Shapes: `box` (a machine), `discs` (storage), `gem` (a model or AI step), `slab` (a file, a result), `pillar` (a worker), `orb` (an event, a day), `pin` (a city), or a function `(stage, hue) => [object3D, labelHeight]`. Hues are page tokens (`--c1` to `--c5`, `--red`) or any CSS colour.

Space places at least 3 units apart. A wide shot of a long pipeline is about 26 units across at `dist: 23`.

## Drop it in

Any page:

```html
<div id="fig-pipe"></div>
<script src="flow3d.js"></script>
<script>Flow3D.mount('#fig-pipe', { places: [...], paths: [...], tour: [...] });</script>
```

A report built from `../report/assets/starter/`:

1. `cp <this recipe>/flow3d.js <starter copy>/f0-flow3d.js`. `build.sh` inlines it before `f-figures.js` when the file is there.
2. Put the config in `d-data.js` as a named block with its source comment (`const PIPE3D = { places, paths, tour }`).
3. In `c-body.html`, inside the `figure.fg`: `<div id="g-pipe"></div>` under the figure header, `data-ask="PIPE3D"` on the figure.
4. In `f-figures.js`: `Flow3D.mount('#g-pipe', PIPE3D)`. The module brings its own Play, 3D or Flat, and status line, and redraws when the report's theme or palette changes.

The page needs nothing else: no CSS, no Three.js tag. Three.js r134 loads from cdnjs only when the figure comes near the screen.

## House rules

- **The flat figure always ships.** The module draws it from the same config: top-down on desktop, a tall column on phones (rows keep their real spacing where they fit; crowded rows stack). It shows when WebGL is missing, Three.js fails, the figure is under 600 px wide (`minWidth`), or the reader presses Flat. Look at it at 390 px before shipping.
- **Real data drives it.** Positions, gaps, dates, coordinates and `weight` come from the data block, with a source. Same weight for every path when there is no real measure. Label example data as an example on the page.
- **Manners are built in; keep them on.** The loop runs only while the figure is on screen and the tab is visible. Reduced motion: no auto-turn, still particles, camera cuts, no autoplay. Autoplay runs the tour once, when the figure is a third in view.
- **Labels are HTML in Manrope** (the page's `--f`), 13 px with a 12 px sub-line, never text drawn into the canvas. Clicking a place says what it is in the status line.
- **Dark first.** Colours come from the page's CSS tokens; a page without tokens gets the dark defaults. Light theme works by changing the tokens.
- **One caption, 12 words or fewer**, like every report figure. The tour's `say` lines carry the step-by-step story.
- **Verify** at 1440 and 390, dark and light, no console errors: the 3D view, the tour, the Flat button and the phone fallback. With report tests on, `shoot.mjs` covers the page as usual.

## Render it to video

The same config renders to an MP4 with HeyGen's HyperFrames, because the tour and the particles are pure functions of time. `Flow3D.video(host, config)` builds the scene at a fixed size with no loop and returns `renderAt(seconds)`; HyperFrames calls it on every frame through its `hf-seek` event.

Read the official HyperFrames skills first: `hyperframes` (the entry point), `hyperframes-core` (composition contract, determinism rules), `hyperframes-cli`, and `hyperframes-animation/adapters/three.md`. When they are not installed, `$HF skills update` (after the install below) installs the core set. Then:

```bash
mkdir flow-video && cd flow-video && npm init -y >/dev/null
npm i -D hyperframes@0.8.146            # pinned: plain `npx hyperframes@x` flaked with "Unknown command"
HF=$PWD/node_modules/.bin/hyperframes
HYPERFRAMES_SKIP_SKILLS=1 $HF init story --non-interactive
cp <this recipe>/starters/video.html story/index.html
cp <this recipe>/flow3d.js story/
mkdir -p story/assets/fonts && cd story
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
font() { curl -s -A "$UA" "https://fonts.googleapis.com/css2?family=$1" | grep -o 'https://[^)]*\.woff2' | tail -1; }
curl -so assets/fonts/manrope.woff2 "$(font 'Manrope:wght@400..700')"
curl -so assets/fonts/martian-mono.woff2 "$(font 'Martian+Mono:wght@400..600')"
# paste the figure's config into SCENE in index.html; set the root's data-duration (below)
$HF lint && $HF check
$HF snapshot --at 2,8,14                # look at stills before rendering
$HF render --quality draft --output out/draft.mp4
$HF render --quality looks --output out/final.mp4
ffmpeg -i out/final.mp4 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart -an out/final.web.mp4
```

- **Duration.** The tour lasts 0.3 s, plus `move + hold` per step (defaults 1.1 and 0.9), plus 1.6 s back to the home shot. The composition logs it (`flow3d tour length`); `data-duration` on the root must be at least that. Without a tour the camera turns at `videoTurn` radians a second.
- **Determinism.** Time comes only from `renderAt(t)`: no `Date.now`, `performance.now` or animation loop drives the scene, particles are seeded, the size is fixed and the pixel ratio is 1. The overlays (title, status line) animate on the registered GSAP timeline or from the same `t`.
- **Several scenes** in one video: one `Flow3D.video` per act, each in its own layer; fade one out to the background before the next fades in. A cross-dissolve between two 3D scenes double-exposes their labels.
- **Worked example:** the footage-search video (Luminatlas, 2026-10-11), `_handoff/hyperframes/story/` in the luminatlas worktree folder: three acts, 66 s, 1080p30, rendered in 32 s, with `NOTES.md` on what broke and why.

Checked on 2026-10-11 with `starters/video.html`: lint 0 errors and 0 warnings, check passed, draft render 17 s of 1080p30 in 10 s.

## Files

| Path | Holds |
| --- | --- |
| `flow3d.js` | The module: `Flow3D.mount`, `Flow3D.video`, `Flow3D.geo`, the flat fallback, its own CSS |
| `starters/data-flow.html` | A pipeline with a branch and a merge, zones, a tour (the footage-search plan) |
| `starters/time-flow.html` | Days as stations spaced by real dates, same-day items fanned out, the camera flying along (the report recipe's dated rules) |
| `starters/map-flow.html` | Six real cities by latitude and longitude, route arcs, graticule (the route is an example) |
| `starters/similarity-space.html` | 96 invented items in four clusters, two queries with ranked results: a `cloud` plus `build(stage, THREE)` that stages the reveal and pulls the top three forward, `cloud.query` and `redraw()` for the flat view, `ground: false`, `flatRotate: false` |
| `starters/video.html` | The HyperFrames composition for the data-flow starter |
