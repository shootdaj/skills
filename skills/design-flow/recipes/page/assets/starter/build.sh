#!/bin/sh
# Build ../index.html from page.json on the report shell. One data file, one command:
#   sh build.sh                    glossary found from "repo" in page.json, else REPO, else the git repo you run it from
#   REPO=/path/to/project sh build.sh
#   REPO=none sh build.sh          no glossary lookup
# Finds the page recipe next to this starter when it was copied out of the skill, in each harness skill root, or at PAGE_TOOL.
# Pages carry no Ask panel (that is the report recipe's feature). Publish only through design-flow/scripts/publish-page.sh.
cd "$(dirname "$0")"
for t in "${PAGE_TOOL:-}" ../../assets/page-build.mjs ../page-build.mjs "$HOME/.claude/skills/design-flow/recipes/page/assets/page-build.mjs" "$HOME/.agents/skills/design-flow/recipes/page/assets/page-build.mjs" "$HOME/.codex/skills/design-flow/recipes/page/assets/page-build.mjs" "$HOME/.cursor/skills/design-flow/recipes/page/assets/page-build.mjs" "$HOME/.hermes/skills/design-flow/recipes/page/assets/page-build.mjs"; do
  if [ -n "$t" ] && [ -f "$t" ]; then exec node "$t" page.json --out ../index.html ${REPO:+--repo "$REPO"}; fi
done
echo "build.sh: page-build.mjs not found; set PAGE_TOOL=<design-flow>/recipes/page/assets/page-build.mjs" >&2
exit 2
