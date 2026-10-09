# Publish

## The gate is the only path

Every page goes live through `design-flow/scripts/publish-page.sh`, never through the here-now script directly. The gate runs the check and then publishes the folder that holds `index.html` at its root.

```bash
<design-flow>/scripts/publish-page.sh <dir> --repo <project root>                 # new site, prints PUBLISHED <url>
<design-flow>/scripts/publish-page.sh <dir> --repo <project root> --slug <slug>   # update in place
<design-flow>/scripts/publish-page.sh <dir> --dry-run                             # check only
```

`<design-flow>` is wherever this harness installed the skill (`~/.claude/skills/design-flow`, `~/.agents/skills/design-flow`, `~/.codex/skills/design-flow`, ...). The gate finds the here-now skill's `publish.sh` in the same roots and passes `--slug`, `--title`, `--description` and `--client` through.

What the check (`scripts/check-page.mjs`) refuses, with the line it prints:

| Refused | Line |
| --- | --- |
| No `data-recipe` stamp on `<html>` (hand-rolled HTML) | `not built through the recipe: no data-recipe stamp on <html>` |
| A broken opening: title over 14 words or 32 px, no purpose line, fewer than four or more than six bullets, a bullet without a bold lead or wrapping past one line, anything above the bullets | `opening: ...` one line per rule |
| Italic text anywhere | `italic text on the page: ...` |
| Light by default | `not dark by default` |
| Console or page errors at 1440 or 800 | `console errors: ...` |
| Text under 12 px, a target under 44 px, horizontal scroll, em or en dashes or curly quotes | one line each |
| A glossary part that does not open on hover, focus and Escape, or a missing part when `--repo` declares a glossary | `glossary part broken` or `the project declares a glossary ... but the page has no glossary part` |
| A report without its Ask panel, its 44 px button or `.herenow/proxy.json` with `/api/claude`, `/api/claude-fb`, `/api/claude-count` | `a report publishes with its Ask panel and this one has none` or the missing route |
| A proof page screenshot without a caption, its URL, alt text or the image file | `proof figures missing ...` |

A report with the panel left out on purpose: set both `ASK=off` and `ASK_OFF_REASON="why"` on the gate call. The gate prints the reason, writes `Ask panel off: <reason>` into the page footer, and passes the check with that line. Pages built by the page recipe (proof, approval, judging, gallery) carry no panel and need no reason.

The access mode comes from the door's profile (`publish.access`). When restricted is asked for, set it right after publishing and verify. The Bearer key is in `~/.herenow/credentials`; never print it.

No credentials, no problem: when `~/.herenow/credentials` is missing or the here-now skill is not installed, the gate runs the check, stops with `LOCAL ONLY` (exit 4), and the page stays in its folder. Open it in Chrome (`open -a "Google Chrome" <dir>/index.html`, or plain `open` when Chrome is absent) and say in one line that it stayed local because here.now is not set up. Do not sign up or ask for a key unless the user asks for a link.

```bash
KEY=$(grep -Eo '[A-Za-z0-9_-]{20,}' ~/.herenow/credentials | head -1)
curl -s -X PATCH "https://here.now/api/v1/publish/<slug>/access" -H "Authorization: Bearer $KEY" -H 'content-type: application/json' \
  -d '{"mode":"restricted","allowedEmails":[],"allowedDomains":["<domain>"]}'
curl -s "https://here.now/api/v1/publish/<slug>/access" -H "Authorization: Bearer $KEY"   # mode must be "restricted"
```

## The Ask panel's routes

A page built with the Ask panel publishes `.herenow/proxy.json` with it (written by `assets/ask-build.mjs`). here.now reads it at finalize and serves `/api/claude`, `/api/claude-fb`, `/api/claude-count` and, when the owner's Drive is set up, `/api/drive/uploads` and `/api/drive/finalize`. The manifest is never served to visitors.

- The gate publishes the whole folder and, after publishing, posts to `/api/claude-count` on the live site: an Anthropic answer (401 while the key is unset, 400 once it is set) means the routes are live; a here.now 404 prints a WARNING, because republishing without `.herenow/proxy.json` drops every route and an invalid manifest disables them silently.
- The key is the owner's `ANTHROPIC_API_KEY` account variable. When `ask-build.mjs` reports it missing, give the owner this one line and stop: "In your here.now dashboard open Variables, add ANTHROPIC_API_KEY with allowed upstream api.anthropic.com, then reload the page." Never set it, print it or put it in a file.
- A page anyone can open lets anyone spend that key, up to 120 calls an hour per IP. Say so in the reply when the page is public, and suggest Only you (restricted, empty allowlists) and a spend limit on the Anthropic workspace.

Rules:

- Say the access mode in the reply and record it with the slug in project memory.
- The full and the lean edition each get their own slug. Keep the slugs in the project memory so later updates reuse them.
- A restricted gate sends a sign-in email. Company mail gateways have dropped these before. Check that the email arrived before relying on it.
- Microsoft Teams blocks here.now links in chat. For a meeting, screen-share the page, and put the key figures where the audience already goes (a wiki page, the ticket).
- Do not publish Claude Artifacts as a substitute. The user does not want them for these reports.

## Where to post the link

Only where `publish.post_to` says; `none` means nowhere.

- The Linear ticket that tracks the work: one comment with the link, the edition, the access mode and a one-line summary.
- Confluence, when the report answers a question a page raised: a short comment with the link.
- Project memory: the URL, the slug, the source folder and the access mode.

## Sharing figures elsewhere

Each figure is its own `<figure>` with an id. To lift one into a slide or a page, screenshot it from the verification run (`shots/1N-1440-dark-0N-<section>.png`) or export the SVG from the DOM. Keep the caption with it.
