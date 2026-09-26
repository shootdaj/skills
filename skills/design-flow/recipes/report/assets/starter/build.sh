#!/bin/sh
# Concatenate the parts into ../index.html and check that the inline script parses.
cd "$(dirname "$0")"
cat a-head.html b1-tokens.css b2-components.css b3-figures.css c-body.html d-data.js e-core.js f-figures.js g-boot.js > ../index.html
python3 -c "
s=open('../index.html').read();js=s[s.rfind('<script>')+8:s.rfind('</script>')];open('_check.js','w').write(js)"
node --check _check.js && rm -f _check.js && echo "BUILD_OK $(wc -c < ../index.html) bytes"
