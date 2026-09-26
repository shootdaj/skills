#!/bin/sh
# Concatenate the parts into ../index.html and check that the inline script parses.
cd "$(dirname "$0")"
cat a-head.html b1-tokens.css b2-components.css b3-figures.css c-body.html d-data.js e-core.js f-figures.js g-boot.js > ../index.html
node -e "const fs=require('fs');const s=fs.readFileSync('../index.html','utf8');fs.writeFileSync('_check.js',s.slice(s.lastIndexOf('<script>')+8,s.lastIndexOf('</script>')))"
node --check _check.js && rm -f _check.js && echo "BUILD_OK $(wc -c < ../index.html) bytes"
