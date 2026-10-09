#!/usr/bin/env bash
# design-flow test harness: builds the report starter and the page starter (every kind) in a temp folder and runs the publish gate on
# each in dry-run mode, plus the cases the gate must refuse. No network beyond what ask-build.mjs does on its own (it copes offline).
#   sh tests/run.sh [--keep]        --keep leaves the temp folder for a look at the pages and the gate screenshots
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; SK="$(cd "$HERE/.." && pwd)"
REPORT="$SK/recipes/report/assets"; PAGE="$SK/recipes/page/assets"; GATE="$SK/scripts/publish-page.sh"
T="$(mktemp -d "${TMPDIR:-/tmp}/design-flow-tests.XXXXXX")"; KEEP=0; [[ "${1:-}" == "--keep" ]] && KEEP=1
pass=0; failn=0; names=()
say() { printf '%s\n' "$*"; }
ok() { pass=$((pass+1)); say "PASS $1"; }
bad() { failn=$((failn+1)); names+=("$1"); say "FAIL $1"; [[ -n "${2:-}" ]] && sed 's/^/     /' <<< "$2"; }
# expect <name> <want-exit> <grep-for-in-output> -- command...
expect() { local name="$1" want="$2" needle="$3"; shift 3; local out; out="$("$@" 2>&1)"; local code=$?
  if [[ "$code" -eq "$want" && ( -z "$needle" || "$out" == *"$needle"* ) ]]; then ok "$name"; else bad "$name (exit $code, wanted $want${needle:+, wanted text: $needle})" "$out"; fi; }
shot() { node -e "
import('$SK/assets/lib/playwright.mjs').then(async ({launch})=>{const b=await launch({headless:true});const c=await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});const p=await c.newPage();
await p.setContent('<body style=\"margin:0;background:#1b1530;color:#ece8e2;font:600 48px sans-serif;display:grid;place-items:center;height:100vh\">'+process.argv[1]+'</body>');await p.screenshot({path:process.argv[2]});await b.close()})" "$1" "$2"; }

say "temp folder $T"
# ── 1. the report starter ──
mkdir -p "$T/report/src" && cp "$REPORT/starter/"* "$T/report/src/"
sed -i '' 's/REPORT_SLUG/test-report/' "$T/report/src/a-head.html"
expect "report starter builds with the panel" 0 "BUILD_OK" env ASK_TOOL="$REPORT/ask-build.mjs" sh "$T/report/src/build.sh"
[[ -f "$T/report/.herenow/proxy.json" ]] && ok "report build wrote .herenow/proxy.json" || bad "report build wrote .herenow/proxy.json"
grep -q 'data-recipe="report"' "$T/report/index.html" && ok "report build stamps data-recipe=report" || bad "report build stamps data-recipe=report"
expect "gate passes the report with its panel" 0 "GATE PASS" "$GATE" "$T/report" --dry-run --repo none
mkdir -p "$T/report-off/src" && cp "$REPORT/starter/"* "$T/report-off/src/" && sed -i '' 's/REPORT_SLUG/test-report-off/' "$T/report-off/src/a-head.html"
expect "report starter builds with ASK=off" 0 "BUILD_OK" env ASK=off sh "$T/report-off/src/build.sh"
expect "gate refuses a report without its panel" 1 "a report publishes with its Ask panel" "$GATE" "$T/report-off" --dry-run --repo none
expect "gate refuses ASK=off without a reason" 1 "needs ASK_OFF_REASON" env ASK=off "$GATE" "$T/report-off" --dry-run --repo none
expect "gate passes ASK=off with a reason and records it" 0 "recorded in the footer" env ASK=off ASK_OFF_REASON="harness test, no key on this host" "$GATE" "$T/report-off" --dry-run --repo none
grep -q '<span class="ask-off">Ask panel off: harness test, no key on this host</span>' "$T/report-off/index.html" && ok "the reason is in the page footer" || bad "the reason is in the page footer"

# ── 2. the page starter, every kind ──
mkdir -p "$T/proof/src" && cp "$PAGE/starter/"* "$T/proof/src/"
sed -i '' 's/PAGE_SLUG/test-proof/' "$T/proof/src/page.json"
for i in 01-open 02-search 03-empty 04-filter; do shot "$i" "$T/proof/$i.png"; done
mkdir -p "$T/placeholder/src" && cp "$PAGE/starter/"* "$T/placeholder/src/"
expect "page build refuses the starter placeholder key" 2 "placeholder PAGE_SLUG" env REPO=none PAGE_TOOL="$PAGE/page-build.mjs" sh "$T/placeholder/src/build.sh"
expect "page starter (proof) builds" 0 "BUILD_OK" env REPO=none PAGE_TOOL="$PAGE/page-build.mjs" sh "$T/proof/src/build.sh"
grep -q 'data-recipe="page" data-kind="proof"' "$T/proof/index.html" && ok "page build stamps data-recipe=page" || bad "page build stamps data-recipe=page"
grep -q '__askPanel' "$T/proof/index.html" && bad "page build carries no Ask panel" || ok "page build carries no Ask panel"
expect "gate passes the proof page without a panel and without ASK=off" 0 "ask panel: none, as pages ship" "$GATE" "$T/proof" --dry-run --repo none
mkdir -p "$T/gate-shots" && node "$SK/scripts/check-page.mjs" "$T/proof" --repo none --shots "$T/gate-shots/proof" >/dev/null 2>&1 || true
# a proof item without its URL is refused at build time
python3 - "$T/proof/src/page.json" "$T/proof-nourl/src/page.json" <<'EOF'
import json,sys,os;d=json.load(open(sys.argv[1]));del d['sections'][0]['items'][1]['url'];os.makedirs(os.path.dirname(sys.argv[2]),exist_ok=True);json.dump(d,open(sys.argv[2],'w'))
EOF
cp "$PAGE/starter/build.sh" "$T/proof-nourl/src/"; for i in 01-open 02-search 03-empty 04-filter; do cp "$T/proof/$i.png" "$T/proof-nourl/"; done
expect "page build refuses a proof shot without its URL" 2 "has no url" env REPO=none PAGE_TOOL="$PAGE/page-build.mjs" sh "$T/proof-nourl/src/build.sh"
for kind in approval judging gallery; do
  mkdir -p "$T/$kind/src" && cp "$PAGE/starter/build.sh" "$T/$kind/src/" && for i in 01-open 02-search 03-empty 04-filter; do cp "$T/proof/$i.png" "$T/$kind/"; done
  python3 - "$T/proof/src/page.json" "$T/$kind/src/page.json" "$kind" <<'EOF'
import json,sys;d=json.load(open(sys.argv[1]));k=sys.argv[3];d['kind']=k;d['key']='test-'+k
items=d['sections'][0]['items']
if k=='approval': d['sections'][0]['items']=[{'id':'i%d'%n,'title':it['caption'][:40],'text':it['caption'],'img':it['img'],'url':it['url']} for n,it in enumerate(items)]
if k=='judging': d['sections'][0]['items']=[{'id':'e%d'%n,'name':'Design %d'%n,'img':it['img'],'line':it['caption']} for n,it in enumerate(items)]
if k=='gallery': d['sections'][0]['items']=[{'name':'Direction %d'%n,'img':it['img'],'line':it['caption'],'fonts':'Familjen Grotesk, Martian Mono','url':it['url']} for n,it in enumerate(items)]
json.dump(d,open(sys.argv[2],'w'))
EOF
  expect "page starter ($kind) builds" 0 "BUILD_OK" env REPO=none PAGE_TOOL="$PAGE/page-build.mjs" sh "$T/$kind/src/build.sh"
  expect "gate passes the $kind page" 0 "GATE PASS" "$GATE" "$T/$kind" --dry-run --repo none
  node "$SK/scripts/check-page.mjs" "$T/$kind" --repo none --shots "$T/gate-shots/$kind" >/dev/null 2>&1 || true
done
# the interactive parts: keep or strike, a score, the lightbox
node - "$SK" "$T" <<'EOF' && ok "approval, judging and lightbox interactions work" || bad "approval, judging and lightbox interactions work"
const [SK,T]=process.argv.slice(2);
const {launch}=await import(SK+'/assets/lib/playwright.mjs');const b=await launch({headless:true});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
let bad=[];
await p.goto('file://'+T+'/approval/index.html');await p.waitForTimeout(1500);
await p.click('.ap .btn.keep');await p.click('.ap:nth-of-type(3) .btn.strike');await p.waitForTimeout(200);
let s=await p.evaluate(()=>document.getElementById('apsum').textContent);if(!/1 kept/.test(s)||!/1 struck/.test(s))bad.push('approval sum: '+s);
await p.reload();await p.waitForTimeout(1500);s=await p.evaluate(()=>document.getElementById('apsum').textContent);if(!/1 kept/.test(s))bad.push('approval state lost on reload: '+s);
await p.screenshot({path:T+'/gate-shots/approval-decided.png'});
await p.click('.ap .shot-link');await p.waitForTimeout(400);if(await p.evaluate(()=>document.getElementById('lb').hidden))bad.push('lightbox did not open');
await p.keyboard.press('Escape');await p.waitForTimeout(200);if(!await p.evaluate(()=>document.getElementById('lb').hidden))bad.push('Escape did not close the lightbox');
await p.goto('file://'+T+'/judging/index.html');await p.waitForTimeout(1500);
if(await p.evaluate(()=>[...document.querySelectorAll('.jd-name')].some(n=>!n.hidden)))bad.push('judging shows names before reveal');
await p.click('.jd .chip[data-score="4"]');await p.click('#jdReveal');await p.waitForTimeout(300);
if(!await p.evaluate(()=>document.querySelector('.jd .chip[data-score="4"]').getAttribute('aria-pressed')==='true'))bad.push('score not pressed');
if(await p.evaluate(()=>document.querySelector('.jd-name').hidden))bad.push('reveal did not show names');
s=await p.evaluate(()=>document.getElementById('jdsum').textContent);if(!/1 of 4 scored/.test(s))bad.push('judging sum: '+s);
await p.screenshot({path:T+'/gate-shots/judging-scored.png'});
await b.close();if(errs.length)bad.push('console: '+errs.join(' | '));
if(bad.length){console.error(bad.join('\n'));process.exit(1)}
EOF

# ── 3. the glossary, found from a project and checked against it ──
mkdir -p "$T/proj/docs" && printf '## Preview\nAlso: preview deploy\nThe copy of the app built from a pull request so the change can be tried before it merges.\n\n## Count\nThe number of items the library header shows.\n' > "$T/proj/docs/GLOSSARY.md"
mkdir -p "$T/gloss/src" && cp "$PAGE/starter/"* "$T/gloss/src/" && for i in 01-open 02-search 03-empty 04-filter; do cp "$T/proof/$i.png" "$T/gloss/"; done
sed -i '' 's/PAGE_SLUG/test-gloss/' "$T/gloss/src/page.json"
expect "page build finds the project glossary" 0 "GLOSSARY 2 terms" env REPO="$T/proj" PAGE_TOOL="$PAGE/page-build.mjs" sh "$T/gloss/src/build.sh"
expect "gate checks the glossary hover against the project" 0 "wrapped terms on the page from docs/GLOSSARY.md" "$GATE" "$T/gloss" --dry-run --repo "$T/proj"
expect "gate refuses a page missing the glossary its project declares" 1 "declares a glossary" "$GATE" "$T/proof" --dry-run --repo "$T/proj"

# ── 4. what the gate must refuse ──
mkdir -p "$T/handrolled" && printf '<html><body><h1>Proof</h1><img src="x.png"><p>it works</p></body></html>\n' > "$T/handrolled/index.html"
expect "gate refuses a hand-rolled one-line page" 1 "not built through the recipe" "$GATE" "$T/handrolled" --dry-run --repo none
mkdir -p "$T/nothing" && expect "gate refuses a folder without index.html" 1 "no index.html" "$GATE" "$T/nothing" --dry-run --repo none
cp -R "$T/proof" "$T/italic" && sed -i '' 's|<h1 class="title rv0" id="title">|<h1 class="title rv0" id="title" style="font-style:italic">|' "$T/italic/index.html"
expect "gate refuses italics" 1 "italic" "$GATE" "$T/italic" --dry-run --repo none
cp -R "$T/proof" "$T/light" && sed -i '' 's|r.dataset.theme=(t===.light.)?.light.:.dark.|r.dataset.theme="light"|' "$T/light/index.html"
expect "gate refuses a light default" 1 "not dark by default" "$GATE" "$T/light" --dry-run --repo none

say ""; say "$pass passed, $failn failed"; [[ "$failn" -gt 0 ]] && printf '  %s\n' "${names[@]}"
if [[ "$KEEP" -eq 1 || "$failn" -gt 0 ]]; then say "pages and gate screenshots kept in $T"; else mv "$T" "$HOME/.Trash/" 2>/dev/null || true; fi
[[ "$failn" -eq 0 ]]
