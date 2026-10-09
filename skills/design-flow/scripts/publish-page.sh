#!/usr/bin/env bash
# The only way a design-flow page goes to here.now. It checks the page, refuses what the recipe would not have built, then publishes.
#
#   publish-page.sh <dir> [--slug <slug>] [--repo <project dir>|none] [--dry-run] [--title <t>] [--description <d>] [--client <name>]
#
#   <dir>          the folder that holds index.html (and .herenow/proxy.json when the page has the Ask panel)
#   --slug         update an existing site in place; without it here.now picks a new slug
#   --repo         the project the page is for, so the glossary can be checked against what it declares; defaults to the git repo
#                  you run this from; "none" skips that comparison
#   --dry-run      run the check and stop (what the tests do)
#   ASK=off ASK_OFF_REASON="why"   a report without its Ask panel is refused unless both are given; the reason is printed here and
#                  written into the page footer before the check, so the page itself says why it has no panel
#
# Refuses: a page without the recipe's data-recipe stamp (hand-rolled HTML), a broken opening, italics, a light default, console
# errors, a missing glossary part when the project declares one, a report without the panel or its manifest, a proof screenshot
# without its URL. The check is scripts/check-page.mjs. Publishing goes through the here-now skill's publish.sh with the same arguments.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR=""; SLUG=""; REPO=""; DRY=0; PASS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --slug) SLUG="$2"; shift 2 ;;
    --repo) REPO="$2"; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    --title|--description|--client|--ttl) PASS+=("$1" "$2"); shift 2 ;;
    --forkable|--spa) PASS+=("$1"); shift ;;
    -h|--help) sed -n '2,19p' "$0"; exit 0 ;;
    -*) echo "publish-page.sh: unknown option $1" >&2; exit 2 ;;
    *) if [[ -z "$DIR" ]]; then DIR="$1"; else echo "publish-page.sh: unexpected argument $1" >&2; exit 2; fi; shift ;;
  esac
done
[[ -n "$DIR" ]] || { sed -n '2,19p' "$0"; exit 2; }
if [[ -f "$DIR" ]]; then DIR="$(dirname "$DIR")"; fi
[[ -d "$DIR" ]] || { echo "publish-page.sh: no such folder $DIR" >&2; exit 2; }
DIR="$(cd "$DIR" && pwd)"
PAGE="$DIR/index.html"
[[ -f "$PAGE" ]] || { echo "REFUSED: no index.html in $DIR (the recipe writes one at the folder root)" >&2; exit 1; }

# The project this page belongs to, for the glossary comparison.
if [[ -z "$REPO" ]]; then REPO="$(git rev-parse --show-toplevel 2>/dev/null || true)"; fi
[[ -n "$REPO" ]] || REPO="none"

# Ask panel left out on purpose: say why, and write it into the page footer so the page says so too.
ASK="${ASK:-on}"; REASON="${ASK_OFF_REASON:-}"
if [[ "$ASK" == "off" ]]; then
  if [[ -z "$REASON" ]]; then
    echo "REFUSED: ASK=off needs ASK_OFF_REASON=\"why this page has no Ask panel\"; the reason is recorded in the page footer" >&2
    exit 1
  fi
  echo "ASK off: $REASON (recorded in the page footer)"
  REASON="$REASON" node -e '
    const fs=require("fs");const f=process.argv[1];let s=fs.readFileSync(f,"utf8");
    const esc=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const span=`<span class="ask-off">Ask panel off: ${esc(process.env.REASON)}</span>`;
    if(/<span class="ask-off">[^<]*<\/span>/.test(s))s=s.replace(/<span class="ask-off">[^<]*<\/span>/,span);
    else if(/<\/footer>/.test(s))s=s.replace(/<\/footer>/,span+"</footer>");
    else{console.error("publish-page.sh: the page has no <footer> to record the reason in");process.exit(1)}
    fs.writeFileSync(f,s);' "$PAGE"
fi

# 1. the check
echo "checking $PAGE"
if ! node "$HERE/check-page.mjs" "$PAGE" --repo "$REPO" ${REASON:+--ask-off-reason "$REASON"}; then
  echo "REFUSED: not published. Fix the FAIL lines above and run again." >&2
  exit 1
fi
if [[ "$DRY" -eq 1 ]]; then echo "DRY RUN: check passed, nothing published"; exit 0; fi

# 2. the publisher: the here-now skill wherever this harness installed it
PUB=""
for p in "${HERENOW_PUBLISH:-}" "$HOME/.claude/skills/here-now/scripts/publish.sh" "$HOME/.agents/skills/here-now/scripts/publish.sh" "$HOME/.codex/skills/here-now/scripts/publish.sh" "$HOME/.cursor/skills/here-now/scripts/publish.sh" "$HOME/.hermes/skills/here-now/scripts/publish.sh"; do
  if [[ -n "$p" && -f "$p" ]]; then PUB="$p"; break; fi
done
if [[ -z "$PUB" ]]; then echo "LOCAL ONLY: the here-now skill is not installed, so the page stays in $DIR. Open it in Chrome and say so." >&2; exit 4; fi
if [[ ! -s "$HOME/.herenow/credentials" && -z "${HERENOW_API_KEY:-}" ]]; then echo "LOCAL ONLY: no here.now credentials (~/.herenow/credentials), so the page stays in $DIR. Open it in Chrome and say so." >&2; exit 4; fi

# 3. publish the whole folder (index.html, its images, and .herenow/proxy.json when the panel is on)
URL="$("$PUB" "$DIR" --client "${CLIENT:-claude-code}" ${SLUG:+--slug "$SLUG"} "${PASS[@]+"${PASS[@]}"}")"
[[ -n "$URL" ]] || { echo "publish failed: no URL came back" >&2; exit 1; }

# 4. look at what went live
RECIPE="$(sed -n 's/.*<html[^>]* data-recipe="\([a-z]*\)".*/\1/p' "$PAGE" | head -1)"
LIVE="$(curl -sL --max-time 30 "$URL" || true)"
if ! grep -q "data-recipe=\"$RECIPE\"" <<< "$LIVE"; then echo "WARNING: the live page at $URL does not show data-recipe=\"$RECIPE\" yet (CDN lag, or the publish did not finalize). Reload it before handing it over." >&2; fi
ASKSTATE="off"
if grep -q "__askPanel" "$PAGE"; then
  ASKSTATE="on"
  CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 -X POST "${URL%/}/api/claude-count" -H 'content-type: application/json' -d '{}' || echo 000)"
  if [[ "$CODE" == "404" || "$CODE" == "000" ]]; then echo "WARNING: $URL/api/claude-count answered $CODE: the proxy routes are not live. The folder must include .herenow/proxy.json (ask-build.mjs writes it)." >&2; else echo "ask routes live: /api/claude-count answered $CODE (401 until the owner sets ANTHROPIC_API_KEY, 400 once it is set)"; fi
fi
GLOSS="$(grep -o 'glossary: [0-9]* terms from [^,]*' "$PAGE" | head -1 | sed 's/glossary: //' || true)"
echo "PUBLISHED $URL (recipe $RECIPE, ask $ASKSTATE, glossary ${GLOSS:-none})"
