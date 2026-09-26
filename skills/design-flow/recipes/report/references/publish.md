# Publish

## here.now

Publish the folder that holds `index.html` at its root.

```bash
~/.agents/skills/here-now/scripts/publish.sh <dir> --client claude-code            # new site, prints site_url and slug
~/.agents/skills/here-now/scripts/publish.sh <dir> --client claude-code --slug <slug>   # update in place
```

The path above is where the `skills` CLI installs here-now; use the installed copy wherever it is. The access mode comes from the door's profile (`publish.access`). When restricted is asked for, set it right after publishing and verify. The Bearer key is in `~/.herenow/credentials`; never print it.

No credentials, no problem: when `~/.herenow/credentials` is missing or the here-now skill is not installed, skip publishing, leave the page in its folder, open it in Chrome (`open -a "Google Chrome" <dir>/index.html`, or plain `open` when Chrome is absent) and say in one line that it stayed local because here.now is not set up. Do not sign up or ask for a key unless the user asks for a link.

```bash
KEY=$(grep -Eo '[A-Za-z0-9_-]{20,}' ~/.herenow/credentials | head -1)
curl -s -X PATCH "https://here.now/api/v1/publish/<slug>/access" -H "Authorization: Bearer $KEY" -H 'content-type: application/json' \
  -d '{"mode":"restricted","allowedEmails":[],"allowedDomains":["<domain>"]}'
curl -s "https://here.now/api/v1/publish/<slug>/access" -H "Authorization: Bearer $KEY"   # mode must be "restricted"
```

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
