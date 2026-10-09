#!/bin/sh
# Concatenate the parts into ../index.html and check that the inline script parses.
# The "Ask about this report" panel (h-ask.css, i-ask.js) is on by default. ASK=off sh build.sh leaves it out.
# ASK_MODEL sets the panel's default model: claude-opus-5-5 (default), claude-fable-5-1 (best answers, 2.5x the price) or claude-sonnet-5 (half the price).
# With the panel on, ask-build.mjs then freezes the report text into the page and writes ../.herenow/proxy.json (references/ask-panel.md).
cd "$(dirname "$0")"
if [ "${ASK:-on}" = "off" ]; then
  cat a-head.html b1-tokens.css b2-components.css b3-figures.css c-body.html d-data.js e-core.js f-figures.js g-boot.js > ../index.html
else
  sed "s/__ASK_MODEL__/${ASK_MODEL:-claude-opus-5-5}/" i-ask.js > _ask.js
  cat a-head.html b1-tokens.css b2-components.css b3-figures.css h-ask.css c-body.html d-data.js e-core.js f-figures.js _ask.js g-boot.js > ../index.html
  rm -f _ask.js
fi
node -e "const fs=require('fs');const s=fs.readFileSync('../index.html','utf8');fs.writeFileSync('_check.js',s.slice(s.lastIndexOf('<script>')+8,s.lastIndexOf('</script>')))"
node --check _check.js && rm -f _check.js && echo "BUILD_OK $(wc -c < ../index.html) bytes" || exit 1
[ "${ASK:-on}" = "off" ] && exit 0
for t in "${ASK_TOOL:-}" ../ask-build.mjs "$HOME/.claude/skills/design-flow/recipes/report/assets/ask-build.mjs" "$HOME/.agents/skills/design-flow/recipes/report/assets/ask-build.mjs" "$HOME/.codex/skills/design-flow/recipes/report/assets/ask-build.mjs" "$HOME/.cursor/skills/design-flow/recipes/report/assets/ask-build.mjs" "$HOME/.hermes/skills/design-flow/recipes/report/assets/ask-build.mjs"; do
  if [ -n "$t" ] && [ -f "$t" ]; then node "$t" ../index.html; exit $?; fi
done
echo "ASK_NOTE ask-build.mjs not found: set ASK_TOOL=<design-flow>/recipes/report/assets/ask-build.mjs to freeze the context and write .herenow/proxy.json"
