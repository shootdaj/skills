# Ask panel

Every report built from the starter has an "Ask about this report" panel: a floating Ask button opens a side sheet where the reader asks Claude about the page. Claude answers from the report's own text and data, points at figures on the page, and can look at what the reader is looking at.

Why: on 2026-10-08 Anshul said "add an AI chat in the report, where i can ask questions about the report, with like rich tools, things like snapshot of part of page, etc, other useful tools for interactivity with the report in the ai chat… it should just use like a claude session underneath".

## Switch

| Flag | Effect |
| --- | --- |
| default | Panel on. `build.sh` adds `h-ask.css` and `i-ask.js`, then runs `assets/ask-build.mjs` |
| `ASK=off sh build.sh` | No panel, no build step, no manifest |
| `ASK_MODEL=claude-sonnet-5 sh build.sh` | Default model Sonnet 5 instead of Fable 5.1 |
| `ASK_TOOL=<path>/ask-build.mjs` | Where build.sh finds the build step when the starter was copied out of the skill (it also looks in the skill's own folder and in each harness skill root) |

## Model

Default `claude-opus-5-5` (Anshul, 2026-10-09): strong answers at 2.5x less than Fable 5.1; with the report cached a typical answer costs about 1 to 3 cents. Fable 5.1 stays in the picker for the best answers. The panel has a model picker; `claude-sonnet-5` is about a fifth of the price for routine questions. Thinking is left at its default (always on for Fable 5.1, adaptive for Sonnet 5), effort is `medium`, `max_tokens` 12000. Fable 5.1 calls go through `/api/claude-fb`, which adds the `server-side-fallback-2026-07-01` beta, and send `fallbacks: "default"`, so a policy decline is re-served inside the same call. A `fallback` marker block is dropped before the turn is echoed back. Forced `tool_choice` is never sent (a 400 on Fable 5.1).

## How the key is held

The page never holds a key. here.now proxy routes call Anthropic server side and inject the key from an account variable.

| Route on the site | Upstream | Injected |
| --- | --- | --- |
| `/api/claude` | `https://api.anthropic.com/v1/messages` | `x-api-key: ${ANTHROPIC_API_KEY}`, `anthropic-version` |
| `/api/claude-fb` | same | same plus `anthropic-beta: server-side-fallback-2026-07-01` |
| `/api/claude-count` | `.../v1/messages/count_tokens` | same as `/api/claude`; free, and it is the panel's key check |
| `/api/drive/uploads`, `/api/drive/finalize` | the owner's default Drive | `Authorization: Bearer ${REPORT_THREADS_DRIVE_TOKEN}` |

`ask-build.mjs` writes these into `.herenow/proxy.json` next to `index.html`, keeps any other routes already there, and reports which variables exist (names only; here.now never returns values).

What was measured on 2026-10-08 and the panel relies on:

- An unset variable is sent as an empty string. Anthropic answers 401 `x-api-key header is required`, which the panel shows as "Claude key not set". A wrong key gives 401 `invalid x-api-key`: "Claude key rejected". A missing route is a here.now 404: "Proxy route missing".
- here.now forwards only `content-type`, `accept` and `accept-encoding` from the browser. Every other header (`anthropic-beta`, `origin`, cookies) is dropped, so fixed headers live in the manifest. No `origin` reaches Anthropic, so no CORS header is needed.
- Streaming passes through chunk by chunk.
- An invalid manifest does not fail the publish: the routes just 404. Republishing without `.herenow/proxy.json` drops them. Publish the folder with `.herenow/` in it.

Setting the key is the owner's job, never the agent's. The panel's one line for them: "In your here.now dashboard open Variables, add ANTHROPIC_API_KEY with allowed upstream api.anthropic.com, then reload this page." Never set it for them, never print it, never put it in a page or a file.

A public page with a proxy route lets anyone with the link spend the key (up to the route's `rateLimit`, 120 calls an hour per IP). Say so when you publish, and suggest the page be set to Only you (restricted with empty allowlists) and a spend limit on the Anthropic workspace.

## What Claude gets

The system prompt is two text blocks: fixed instructions, then the report as JSON inside `<report>` tags with a cache breakpoint on it. The request also sets top-level automatic caching so the growing conversation is cached too. Tools come first in the cached prefix and never change.

`ask-build.mjs` opens the built page in headless Chrome and freezes the report into `<script type="application/json" id="ask-context">`: title, headline, opening bullets, every section's text, every figure's number, title, caption, hint, detail text, the data blocks it names and its rendered labels, and every outbound link as a source (`s1`, `s2`, ...). Freezing keeps the prompt byte-identical between visits, which is what lets the cache hit. Without the blob the page reads the same thing live.

Each figure's data blocks come from `data-ask` on the figure when present, naming `d-data.js` blocks; otherwise the panel takes the upper-case names its draw function in `FIGS` uses (10 of 14 figures in the EmbeddingGemma 2 report were found this way):

```html
<figure class="fg" id="fig-cost" data-ask="COST,FOOT">
```

The blob is capped at 150,000 characters; labels, then figure text, then large data blocks are dropped first.

## Tools

All run in the page. Claude calls them; the reader sees each call as a row in the answer.

| Tool | What happens on the page | Returns |
| --- | --- | --- |
| `scroll_to` | Opens the panel section if collapsed, scrolls to the id, pulses it | Confirmation |
| `highlight` | Dashed outline plus a short note for six seconds | Confirmation |
| `read_figure_data` | Nothing visible | The figure's context entry, its live data blocks, labels and current detail text |
| `snapshot_region` | Captures one figure or section as rendered now | The picture as an image block |
| `ask_about_selection` | Nothing visible | The reader's current or last selection and where it sits |
| `open_source` | A link row in the answer | Title and URL |
| `save_thread` | Download of a `.md` file, a copy in Drive | What was saved where |

The reader also attaches context directly: select any text and an Ask chip appears; every figure has a camera button (top right, on hover or focus; always shown on touch); Snapshot in the composer lets them drag a box over any part of the page (a click picks the figure under the pointer, Enter takes the whole screen, Esc cancels). Snapshots use the browser's own renderer through html-to-image (SVG foreignObject), scaled to at most 1568 px on the long edge.

Answers stream in, render as markdown (marked, sanitized with DOMPurify), and cite places as `[[fig-id]]` or `[[src:s2]]`. Citations show inline and as chips under the answer; a chip scrolls to the figure or opens the source.

## Cost guard

Each answer shows cached, new and output tokens and its cost; the meter shows the thread total and the context size. Defaults: a thread stops at 80,000 input tokens in one request or $2.00, and offers a new thread. A stopped answer is still counted. Snapshots are scaled down before sending.

## Saving threads

The thread lives in `localStorage` under `<slug>-ask-thread`, so it survives reloads. The menu exports it as Markdown. Save to Drive (menu or `save_thread`) writes `report-threads/<slug>/<thread id>.md` to the owner's default here.now Drive through the two Drive routes; later saves overwrite it with the ETag. Claude Code reads it in a later session with:

```bash
~/.claude/skills/here-now/scripts/drive.sh ls "My Drive" report-threads/
~/.claude/skills/here-now/scripts/drive.sh cat "My Drive" report-threads/<slug>/<thread id>.md
```

The Drive routes need a token in the `REPORT_THREADS_DRIVE_TOKEN` variable: a write token scoped to `report-threads/`, pinned to `here.now`. One-time setup, with the token piped straight into the variable and never shown:

```bash
KEY=$(grep -Eo '[A-Za-z0-9_-]{20,}' ~/.herenow/credentials | head -1)
DRV=$(curl -s https://here.now/api/v1/drives/default -H "Authorization: Bearer $KEY" | jq -r '.drive.id // .id')
curl -s -X POST "https://here.now/api/v1/drives/$DRV/tokens" -H "Authorization: Bearer $KEY" -H 'content-type: application/json' \
  -d '{"perms":"write","pathPrefix":"report-threads/","label":"report ask panel","ttl":"365d"}' \
 | jq '{value:.secret,allowedUpstreams:["here.now"]}' \
 | curl -s -X PUT https://here.now/api/v1/me/variables/REPORT_THREADS_DRIVE_TOKEN -H "Authorization: Bearer $KEY" -H 'content-type: application/json' -d @- | jq '{name,allowedUpstreams}'
```

Without `ttl` a token lasts 30 days; `365d` was accepted on 2026-10-08. Use `printf '%s'`, not `echo`, if you hold the response in a shell variable: zsh's echo expands the backslashes in it and jq then fails. Revoke with `drive.sh tokens "My Drive"` and `drive.sh revoke "My Drive" <dtok_id>`. Only POST routes are declared, so the page can write threads but cannot list or read the Drive (a GET is a 405), and a path outside `report-threads/` is a 403.

## Docked layout

At 1180 px and wider the open sheet docks: the page narrows by the sheet's width so nothing Claude points at is hidden. The page's own `max-width` media rules are replayed for the narrower width (scoped under `body.ask-dock`), and the figures redraw through `drawAll()`. Below 1180 px the sheet overlays the page, and full screen under 560 px.

## Test

```bash
node assets/ask-test.mjs /path/to/index.html                  # local: page + strict mock of the Messages API + mock Drive
node assets/ask-test.mjs --live https://<slug>.here.now/      # live page: one real check of the key state, then Claude and the key-not-set 401 mocked, Drive real
```

No key is spent: live, the only real Claude-side call is the free count_tokens key check, recorded as `keySet` in the summary. The mock rejects what the Messages API would reject (unknown model, missing stream, system without the cache breakpoint, bad tool schemas, role order, unanswered `tool_use`, bad images, forced `tool_choice`, `fallbacks` off the fallback route) and checks that every earlier assistant turn comes back exactly as streamed, thinking signatures included. It writes screenshots of every tool to `shots-ask/` and a JSON summary; open the pictures. Answers in those screenshots are the mock's, not Claude's.

## Pitfalls

- HTML comments inside a captured element break html-to-image (`--` is illegal in an XML comment). The capture filter drops comment nodes.
- html-to-image logs console errors when it reads a cross-origin stylesheet. The panel fetches the Google Fonts CSS and Latin font files itself and passes them in.
- A probe that sends an invalid body logs a 400 in the console on a healthy page. The key check uses the free `count_tokens` route instead.
- DOMPurify strips SVG `<use>`. Only Claude's markdown goes through it; the panel's own templates are escaped instead.
- A hidden `display:none` grid child shifts the sheet's rows. The sheet uses named grid areas.
