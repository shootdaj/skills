#!/usr/bin/env python3
"""Build a swatch board: the same mini UI rendered in up to four looks.
usage: make-swatch.py <id,id,id> [--out swatch.html] [--theme auto|dark|light] [--title "Pick a look"]
Reads ../../directions/<id>.md (first ```json block). Prints a JSON line with the output path."""
import json, os, re, sys, html
here = os.path.dirname(os.path.abspath(__file__))
DIRS = os.path.normpath(os.path.join(here, "..", "..", "directions"))
args = sys.argv[1:]
if not args or args[0].startswith("--"): sys.exit(__doc__)
ids = [i for i in args[0].split(",") if i]
def opt(k, d): return args[args.index(k) + 1] if k in args else d
out = os.path.abspath(opt("--out", "swatch.html")); theme = opt("--theme", "auto"); title = opt("--title", "Pick a look")
extra = os.path.expanduser(os.environ.get("DESIGN_FLOW_DIRECTIONS", "~/.design-flow/directions"))
looks = []
for i in ids:
    p = next((c for c in (os.path.join(DIRS, i + ".md"), os.path.join(extra, i + ".md")) if os.path.exists(c)), None)
    if not p: sys.exit(f"no direction file for {i}")
    m = re.search(r"```json\s*(\{.*?\})\s*```", open(p).read(), re.S)
    looks.append(json.loads(m.group(1)))
fonts = "&family=".join(l["fonts"]["google"] for l in looks)
cards = []
for n, l in enumerate(looks, 1):
    t = l[theme] if theme in ("dark", "light") else l[l["first"]]
    f = l["fonts"]
    style = ";".join([f"--bg:{t['bg']}", f"--s1:{t['s1']}", f"--s2:{t['s2']}", f"--line:{t['line']}", f"--txt:{t['txt']}", f"--txt2:{t['txt2']}",
        f"--acc:{t['accent']}", f"--acct:{t['accentTxt']}", f"--onacc:{t['onAccent']}", f"--ok:{t['ok']}", f"--part:{t['part']}", f"--miss:{t['miss']}",
        f"--r:{l['radius']}px", f"--fd:'{f['display']}',sans-serif", f"--fb:'{f['body']}',sans-serif", f"--fm:'{f['mono']}',monospace"])
    cards.append(f"""
<article class="card" id="{html.escape(l['id'])}" style="{style}" data-name="{html.escape(l['name'])}" data-dark='{html.escape(json.dumps(l['dark']))}' data-light='{html.escape(json.dumps(l['light']))}'>
 <header class="hd"><span class="key">{n}</span><div><h2>{html.escape(l['name'])}</h2><p>{html.escape(l['mood'])} · {f['display']} + {f['mono']} · r{l['radius']}</p></div></header>
 <div class="ui">
  <div class="bar"><i class="dot"></i><b>Title</b><span class="tabs"><em class="on">00 Overview</em><em>01 Build</em><em>02 Risks</em></span></div>
  <div class="row">
   <div class="tile"><div class="th"><i class="led ok"></i>OK <span>01 →</span></div><div class="k">12<small>of 30</small></div><div class="l">cells ready today</div></div>
   <div class="tile"><div class="th"><i class="led miss"></i>Gap <span>04 →</span></div><div class="k">0</div><div class="l">code hits, org wide</div></div>
  </div>
  <div class="chips"><span class="chip on">All 10</span><span class="chip">Exists 4</span><span class="chip">To build 5</span></div>
  <svg class="chart" viewBox="0 0 220 64" aria-hidden="true"><rect x="0" y="8" width="150" height="10" rx="3"/><rect x="0" y="26" width="96" height="10" rx="3"/><rect x="0" y="44" width="60" height="10" rx="3" class="acc"/><text x="156" y="17">9</text><text x="102" y="35">6</text><text x="66" y="53" class="acct">3</text></svg>
  <p class="cap">The caption states the takeaway, not the chart.</p>
  <div class="btns"><button type="button" class="pri">Primary</button><button type="button" class="ghost">Ghost</button></div>
 </div>
 <button type="button" class="pick" data-id="{html.escape(l['id'])}">Pick {n}</button>
</article>""")
page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family={fonts}&display=swap" rel="stylesheet">
<style>
*{{box-sizing:border-box}}body{{margin:0;background:#141318;color:#EDEAF2;font:15px/1.5 system-ui,sans-serif;padding:24px}}
.top{{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:18px}}.top h1{{font-size:20px;margin:0}}.top p{{margin:0;color:#A9A3B8}}.top .sp{{flex:1}}
.top button{{min-height:44px;padding:0 16px;border-radius:999px;border:1px solid #3A3648;background:#1E1C26;color:#EDEAF2;cursor:pointer;font:500 14px system-ui}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:18px}}
.card{{background:var(--bg);color:var(--txt);border-radius:calc(var(--r) + 6px);border:1px solid var(--line);overflow:hidden;display:flex;flex-direction:column;font-family:var(--fb);transition:transform .25s,box-shadow .25s}}
.card.picked{{box-shadow:0 0 0 3px #FFD400}}
.hd{{display:flex;gap:12px;align-items:flex-start;padding:16px 18px 10px}}.hd h2{{margin:0;font:700 20px/1.1 var(--fd)}}.hd p{{margin:4px 0 0;font:500 12.5px var(--fm);color:var(--txt2)}}
.key{{width:28px;height:28px;border-radius:8px;background:var(--acc);color:var(--onacc);display:grid;place-items:center;font:700 14px var(--fm);flex:none}}
.ui{{padding:0 18px 16px;display:grid;gap:12px}}
.bar{{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r);background:var(--s1);border:1px solid var(--line)}}.bar .dot{{width:12px;height:12px;border-radius:4px;background:var(--acc)}}.bar b{{font:700 14px var(--fd)}}
.bar .tabs{{margin-left:auto;display:flex;gap:10px}}.bar em{{font:500 12px var(--fb);font-style:normal;color:var(--txt2);padding:4px 0;border-bottom:2px solid transparent}}.bar em.on{{color:var(--txt);border-color:var(--acc)}}
.row{{display:grid;grid-template-columns:1fr 1fr;gap:10px}}
.tile{{padding:12px 14px;border-radius:var(--r);background:var(--s1);border:1px solid var(--line);display:grid;gap:8px}}
.tile .th{{display:flex;align-items:center;gap:7px;font:700 11px var(--fb);letter-spacing:.1em;text-transform:uppercase;color:var(--txt2)}}.tile .th span{{margin-left:auto;font:500 11px var(--fm)}}
.led{{width:8px;height:8px;border-radius:50%;display:inline-block}}.led.ok{{background:var(--ok);box-shadow:0 0 8px var(--ok)}}.led.miss{{background:var(--miss);box-shadow:0 0 8px var(--miss);animation:blink 2s steps(2,jump-none) infinite}}
@keyframes blink{{0%{{opacity:1}}100%{{opacity:.45}}}}
.tile .k{{font:700 28px/1 var(--fd);letter-spacing:-.02em;font-variant-numeric:tabular-nums}}.tile .k small{{font:500 12px var(--fb);color:var(--txt2);margin-left:4px}}.tile .l{{font-size:12.5px;color:var(--txt2)}}
.chips{{display:flex;gap:6px;flex-wrap:wrap}}.chip{{min-height:34px;padding:0 12px;border-radius:999px;border:1px solid var(--line);display:inline-flex;align-items:center;font:500 12.5px var(--fb);color:var(--txt)}}.chip.on{{background:var(--acc);color:var(--onacc);border-color:transparent}}
.chart{{width:100%;height:auto;display:block;background:var(--s2);border-radius:var(--r);padding:8px}}.chart rect{{fill:var(--txt2)}}.chart rect.acc{{fill:var(--acc)}}.chart text{{font:600 10px var(--fm);fill:var(--txt2)}}.chart text.acct{{fill:var(--acct)}}
.cap{{margin:0;font:500 13px var(--fb);color:var(--txt);border-left:3px solid var(--acc);padding-left:10px}}
.btns{{display:flex;gap:8px}}.btns button{{min-height:40px;padding:0 16px;border-radius:999px;font:600 13px var(--fb);cursor:pointer}}.pri{{background:var(--acc);color:var(--onacc);border:1px solid transparent}}.ghost{{background:transparent;color:var(--txt);border:1px solid var(--line)}}
.pick{{margin:auto 18px 18px;min-height:44px;border-radius:999px;border:2px solid #FFD400;background:#111;color:#FFD400;font:800 13px/1 system-ui;letter-spacing:.06em;cursor:pointer}}.pick:hover,.card.picked .pick{{background:#FFD400;color:#111}}
</style></head><body>
<div class="top"><h1>{html.escape(title)}</h1><p>Same mini UI, {len(looks)} looks. Click Pick or press 1 to {len(looks)}.</p><span class="sp"></span><button type="button" id="flip">Flip dark / light</button><span id="status" style="color:#A9A3B8"></span></div>
<div class="grid">{''.join(cards)}</div>
<script>
const KEY='design-flow-pick', API='http://127.0.0.1:7331';
const cards=[...document.querySelectorAll('.card')]; const status=document.getElementById('status');
function apply(card,t){{const m={{bg:'--bg',s1:'--s1',s2:'--s2',line:'--line',txt:'--txt',txt2:'--txt2',accent:'--acc',accentTxt:'--acct',onAccent:'--onacc',ok:'--ok',part:'--part',miss:'--miss'}};for(const k in m)card.style.setProperty(m[k],t[k]);card.dataset.mode=t===JSON.parse(card.dataset.dark)?'dark':'light'}}
cards.forEach(c=>{{c.dataset.mode=getComputedStyle(c).getPropertyValue('--bg').trim()===JSON.parse(c.dataset.dark).bg?'dark':'light'}});
document.getElementById('flip').onclick=()=>cards.forEach(c=>apply(c,JSON.parse(c.dataset.mode==='dark'?c.dataset.light:c.dataset.dark)));
async function pick(id){{cards.forEach(c=>c.classList.toggle('picked',c.id===id));const card=document.getElementById(id);const rec={{id,name:card.dataset.name,ts:Date.now()}};try{{localStorage.setItem(KEY,JSON.stringify(rec))}}catch(e){{}}
 let saved='saved in this browser';try{{const r=await fetch(API,{{method:'POST',headers:{{'content-type':'application/json'}},body:JSON.stringify({{component:'overall',design:id,label:card.dataset.name,ts:rec.ts}})}});if(r.ok)saved='saved to the vote server'}}catch(e){{}}
 status.textContent='Picked '+card.dataset.name+' ('+saved+')';document.title='PICKED '+id}}
document.querySelectorAll('.pick').forEach(b=>b.onclick=()=>pick(b.dataset.id));
addEventListener('keydown',e=>{{const n=+e.key;if(n>=1&&n<=cards.length)pick(cards[n-1].id)}});
try{{const prev=JSON.parse(localStorage.getItem(KEY)||'null');if(prev&&document.getElementById(prev.id))status.textContent='Last pick: '+prev.name}}catch(e){{}}
</script></body></html>"""
open(out, "w").write(page)
print(json.dumps({"out": out, "looks": [l["id"] for l in looks], "theme": theme}))
