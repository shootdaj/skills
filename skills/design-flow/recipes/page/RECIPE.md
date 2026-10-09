# Page recipe

Every page that is not a report: a proof page (screenshots with the URL under each), an approval page (keep or strike), a blind judging page, a gallery of design directions. One data file, one command, the report's shell. Built this way a page is as quick as hand-rolling one and comes out with everything the report has: the tokens and both themes, dark by default, the top bar, tabs, palette picker and theme doors, the plain title and purpose line, the four to six opening bullets, the glossary hover found from the project, no italics anywhere. It ships without the Ask panel on purpose: the panel is a report feature.

Why: on 2026-10-09 Anshul found a proof page without the shared parts and said "i need to fix the root cause". The cause was that only pages built through the report recipe got the shell; proof, approval and judging pages were hand-built and skipped it, so pages differed by day.

## Build

```bash
mkdir -p <work>/src && cp <this recipe>/assets/starter/* <work>/src/   # page.json and build.sh
# put the screenshots next to <work>/ (the folder index.html lands in), edit page.json, then
REPO=<project root> sh <work>/src/build.sh                                # writes <work>/index.html
```

`build.sh` runs `assets/page-build.mjs`, which reads the report starter's own parts (`../report/assets/starter/`: head, tokens, components, header, `e-core.js`) at build time, adds `assets/page.css` and `assets/page.js`, and runs `../report/assets/glossary.mjs --repo <project>` the way the report recipe does (a `Glossary:` line in `AGENTS.md` or `CLAUDE.md`, then `docs/GLOSSARY.md` and friends, then any `glossary.*` two levels deep). `repo` in `page.json`, else `REPO`, else the git repo you run it from; `REPO=none` skips it. A missing image or a missing URL on a proof item stops the build.

## page.json

| Field | Meaning |
| --- | --- |
| `key` | short slug: namespaces `localStorage` (`<key>-theme`, `<key>-approval`, ...) |
| `kind` | `proof`, `approval`, `judging` or `gallery` |
| `title` | the question or decision the page is for, 14 words or fewer, plain words |
| `purpose` | one line under it (about 90 characters at 1440): where the shots come from, what the reader does now |
| `brand` | `{name, sub}` for the top bar |
| `bullets` | four to six `{lead, text, icon?, hue?}`; the lead is the bold highlighted phrase, one line each at 1440 |
| `sections` | `[{id, title, items, open?, dek?, led?}]`; or a flat `items` for one section |
| `items` | per kind, below |
| `footer` | `{left, right}` |
| `repo`, `palette`, `date` | optional: project root for the glossary, `plum`/`ink`/`slate`/`forest`/`sand`, the build date |

Items by kind:

| Kind | Item | What the page does |
| --- | --- | --- |
| `proof` | `{img, alt, caption, url, title?, label?}` | one full-width figure per step: `Step n`, Open page button, the shot, the caption and the URL it was taken on under it; click opens the full-size lightbox (arrows, Escape) |
| `approval` | `{id?, title, text?, img?, url?}` | a card per item with Keep and Strike, the state saved per page, a kept, struck and open count, Export decisions (JSON download and clipboard), Reset |
| `judging` | `{id?, name, img?, line?, url?}` | entries shown as A, B, C with the names hidden; a 1 to 5 score per entry saved per page; Reveal names; Export scores; Reset |
| `gallery` | `{id?, name, img, line?, fonts?, url?, label?}` | a grid of direction cards with the shot, name, line and fonts, Open page, lightbox |

Captions follow the report copy rules: plain words, straight quotes, no em or en dashes (the build rewrites those), sentence case. Say what the reader sees, not what the test asserted.

## Check and publish

Only through the gate:

```bash
<design-flow>/scripts/publish-page.sh <work> [--slug <slug>] [--repo <project root>]
```

It runs `scripts/check-page.mjs` (the stamp, the opening rules, no italics, dark by default, zero console errors, the glossary hover, a caption and URL under every proof shot) and only then calls the here-now skill's `publish.sh` with the same arguments. A page built by hand has no `data-recipe` stamp and is refused. Pages need no `ASK=off`: the gate expects the panel on reports only.

Look at the page yourself before handing it over: open `<work>/index.html` in Chrome, click a shot, hover a glossary term, flip the theme.

## Files

| Path | Holds |
| --- | --- |
| `assets/page-build.mjs` | the build: `page.json` in, `index.html` out, on the report starter's parts |
| `assets/page.css` | proof, approval, judging, gallery and lightbox styles, tokens only |
| `assets/page.js` | the lightbox, keep or strike, blind scores, the boot choreography |
| `assets/starter/page.json`, `assets/starter/build.sh` | the two files you copy next to the work |
