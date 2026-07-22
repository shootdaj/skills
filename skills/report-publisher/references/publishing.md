# Publishing to here.now — permanently

The report only counts as delivered when it's a live, **permanent** URL. here.now
publishes a directory containing `index.html` to `{slug}.here.now`. The catch that
trips people up: **without a saved API key, sites are anonymous and expire in 24
hours.** Permanence requires an API key. This file is about getting that right.

The actual publish is done by the bundled **`here-now` skill** — don't reimplement
its API calls. Compose with it: build the directory, ensure a key exists, run its
`publish.sh`, verify.

## Step 1 — Locate the here-now scripts

The here-now skill lives alongside the other skills. Find it:

```bash
HN="$(ls -d /Users/*/.agents/skills/here-now 2>/dev/null | head -1)"
[ -z "$HN" ] && HN="$(find ~ -maxdepth 6 -type d -ipath '*skills/here-now' 2>/dev/null | head -1)"
echo "$HN"   # should contain scripts/publish.sh
```

If you can't find it, read the `here-now` skill via the Skill tool to get its path
and requirements. Requires `curl`, `file`, `jq` on PATH.

## Step 2 — Ensure permanence: check for an API key

Permanent publishing needs a here.now API key. Check the standard locations:

```bash
[ -n "$HERENOW_API_KEY" ] && echo "key: env" \
 || { [ -s ~/.herenow/credentials ] && echo "key: credentials file" || echo "key: NONE — anonymous only"; }
```

**If a key exists → permanent publish works. Skip to Step 3.**

**If no key exists**, you cannot make it permanent without one. Do the email
sign-in flow — this is a real interaction with the user, so switch out of any
terse mode and be clear:

1. Ask the user for the email on their here.now account (or the one they want to
   use). Don't guess it.
2. Request a one-time code:
   ```bash
   curl -sS https://here.now/api/auth/agent/request-code \
     -H "content-type: application/json" -d '{"email":"USER@EXAMPLE.COM"}'
   ```
3. Tell the user: "Check your inbox for a here.now sign-in code and paste it here."
4. Verify and capture the key:
   ```bash
   curl -sS https://here.now/api/auth/agent/verify-code \
     -H "content-type: application/json" \
     -d '{"email":"USER@EXAMPLE.COM","code":"ABCD-2345"}'
   ```
5. Save the returned `apiKey` yourself — do not ask the user to run this:
   ```bash
   mkdir -p ~/.herenow && printf '%s' "THE_API_KEY" > ~/.herenow/credentials && chmod 600 ~/.herenow/credentials
   ```

If the user can't or won't authenticate right now, you may publish anonymously as
a fallback — but you must clearly tell them the link dies in 24h and share the
one-time claim URL so they can keep it. Don't silently ship a 24h link when they
asked for permanent; surface the tradeoff.

Never commit or print the API key. Never paste `~/.herenow/credentials` contents
back to the user.

## Step 3 — Build the publish directory

`publish.sh` publishes a **directory** whose contents become the site root.
`index.html` must sit at the directory root, not in a subfolder.

```bash
PUBDIR="$(mktemp -d)/report"     # or a named dir in the working area
mkdir -p "$PUBDIR"
cp /path/to/your/report.html "$PUBDIR/index.html"
# copy any local assets alongside it (usually none — report is self-contained)
```

Self-contained single-file reports are ideal: one `index.html`, everything else
via CDN. Then there's nothing else to copy.

## Step 4 — Publish

```bash
"$HN/scripts/publish.sh" "$PUBDIR" --client claude-code
```

- The script prints the live `siteUrl` and emits `publish_result.*` lines on
  stderr. Read them: `publish_result.auth_mode=authenticated` means **permanent**;
  `=anonymous` means 24h + a `publish_result.claim_url`.
- To update an existing report later, re-run with `--slug {slug}` (find the prior
  slug in `.herenow/state.json` in the working dir). Authenticated updates keep the
  same URL.

## Step 5 — Verify it's actually live

Don't report success on the script's word alone — confirm the URL resolves:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' "https://SLUG.here.now/"
```

Expect `200`. If it's not 200, the site isn't live — investigate (finalize step
may have failed; the here-now skill notes a site isn't live until finalize
succeeds) before telling the user it's done.

## Step 6 — Tell the user

- Give the live `siteUrl` from this run.
- State permanence honestly:
  - authenticated → "Published permanently to your here.now account: <url>"
  - anonymous → "Live at <url> — but this expires in 24h. Claim it to keep it:
    <claim_url> (the claim token is shown once and can't be recovered)."
- One line on what's in the report. Don't dump the local build path or the state
  file as if it were the URL.

## Failure modes to watch

- **Missing `jq`/`curl`/`file`** → install or note the blocker; publish will fail.
- **`index.html` nested one level too deep** → site shows a directory listing
  instead of the report. Keep `index.html` at the published dir's root.
- **Reported permanent but key wasn't actually loaded** → always read the
  `auth_mode` from this run's output; don't assume.
- **CDN blocked at view time** — here.now serves real sites so CDNs normally
  load, but if a library fails, the report should still be readable (content in
  HTML, charts degrade gracefully). Prefer inlining critical structure over
  depending on a script that might not load.
