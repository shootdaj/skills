/* ───────────────────────── ask panel ─────────────────────────
   "Ask about this report": a side sheet that talks to Claude through the site's own proxy route (/api/claude on here.now).
   The Anthropic key is a here.now account variable injected server side by .herenow/proxy.json; nothing secret is in this page.
   Tools run here in the page: scroll_to, highlight, read_figure_data, snapshot_region, ask_about_selection, open_source, save_thread.
   Built in by build.sh unless ASK=off. references/ask-panel.md explains hosting, the key, the Drive copy and the test harness. */
(function(){
'use strict';
const D=document, R=D.documentElement;
const Q=(s,r=D)=>r.querySelector(s), QA=(s,r=D)=>[...r.querySelectorAll(s)];
const E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const SLUG=(R.dataset.key||'report').replace(/[^a-z0-9-]/gi,'-');
const HTTP=/^https?:$/.test(location.protocol);
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const MODEL0='__ASK_MODEL__';
const CFG=Object.assign({
  model:/^claude-/.test(MODEL0)?MODEL0:'claude-fable-5-1',
  effort:'medium', maxTokens:12000, maxHops:6,
  ctxCap:80000,          // stop a thread once one request carries this many input tokens
  costCap:2.00,          // stop a thread at this many dollars; New thread resets
  contextChars:150000,   // cap on the report text sent as the system prompt
  maxImageEdge:1568, maxAtts:4,
  count:'/api/claude-count',  // free token count; doubles as the key check, so a healthy page logs no errors
  drive:{uploads:'/api/drive/uploads',finalize:'/api/drive/finalize',dir:'report-threads/'}
},window.ASK_CONFIG||{});
/* Prices in dollars per million tokens: input, output, cache write (5 min), cache read. Fable 5.1 calls go through the route that
   adds the server-side fallback beta, so a policy decline is re-served by Anthropic's recommended model inside the same call. */
const MODELS={
 'claude-fable-5-1':{label:'Fable 5.1',note:'best answers',in:10,out:50,cw:12.5,cr:0.25,route:'/api/claude-fb',fallbacks:'default'},
 'claude-sonnet-5':{label:'Sonnet 5',note:'about 5x cheaper',in:2,out:10,cw:2.5,cr:0.20,route:'/api/claude'}
};
const PRICE=Object.assign({'claude-opus-4-8':{in:5,out:25,cw:6.25,cr:0.5},'claude-opus-5':{in:5,out:25,cw:6.25,cr:0.5},'claude-opus-5-5':{in:4,out:20,cw:5,cr:0.2},'claude-sonnet-5-5':{in:2,out:10,cw:2.5,cr:0.2}},MODELS);
const LIBS={marked:['https://cdn.jsdelivr.net/npm/marked@18.1.0/lib/marked.umd.js','marked'],h2i:['https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js','htmlToImage']};
const store={get(k){try{return localStorage.getItem(SLUG+'-ask-'+k)}catch(e){return null}},set(k,v){try{localStorage.setItem(SLUG+'-ask-'+k,v);return true}catch(e){return false}},del(k){try{localStorage.removeItem(SLUG+'-ask-'+k)}catch(e){}}};
const fmtK=n=>n>=1000?(n/1000).toFixed(n>=10000?0:1)+'k':String(n||0);
const fmt$=v=>v<0.01?'under $0.01':'$'+v.toFixed(v<1?3:2).replace(/0$/,'');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const loaded={};
function lib(name){if(loaded[name])return loaded[name];const [src,glob]=LIBS[name];if(window[glob])return(loaded[name]=Promise.resolve(window[glob]));
 loaded[name]=new Promise((ok,no)=>{const s=D.createElement('script');s.src=src;s.async=true;s.onload=()=>window[glob]?ok(window[glob]):no(new Error(name+' did not load'));s.onerror=()=>{loaded[name]=null;no(new Error(name+' could not be fetched'))};D.head.appendChild(s)});return loaded[name]}

/* ───────── icons (Lucide shapes) ───────── */
const ICONS={
 spark:'<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/>',
 cam:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
 scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>',
 up:'<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
 stop:'<rect width="12" height="12" x="6" y="6" rx="2"/>',
 x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
 more:'<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
 down:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
 cloud:'<path d="M12 13v8"/><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="m8 17 4-4 4 4"/>',
 plus:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v6"/><path d="M9 10h6"/>',
 aim:'<circle cx="12" cy="12" r="10"/><path d="M22 12h-4"/><path d="M6 12H2"/><path d="M12 6V2"/><path d="M12 22v-4"/>',
 table:'<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
 quote:'<path d="M17 6H3"/><path d="M21 12H8"/><path d="M21 18H8"/><path d="M3 12v6"/>',
 ext:'<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
 save:'<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
 mark:'<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
 key:'<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5"/>',
 copy:'<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
 warn:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>'
};
const ic=n=>`<svg class="i" aria-hidden="true"><use href="#ia-${n}"/></svg>`;
function sprite(){const s=D.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('width','0');s.setAttribute('height','0');s.setAttribute('aria-hidden','true');s.setAttribute('class','ask-ui');s.style.position='absolute';
 s.innerHTML=Object.entries(ICONS).map(([k,v])=>`<symbol id="ia-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('');D.body.prepend(s)}
function H(html){const t=D.createElement('template');t.innerHTML=html.trim();return t.content.firstElementChild}
function clean(html){return window.DOMPurify?DOMPurify.sanitize(html,{ADD_ATTR:['target','data-ref','data-src','data-href']}):E(String(html).replace(/<[^>]*>/g,' '))}

/* ───────── report context: built once at build time (ask-build.mjs freezes it into #ask-context), else read live ───────── */
const tx=el=>(el?el.textContent:'').replace(/\s+/g,' ').trim();
function strip(el,sel){const c=el.cloneNode(true);QA(sel,c).forEach(x=>x.remove());return c}
function dataOf(names){const out={};for(const n of names){if(!/^[A-Za-z_$][\w$]*$/.test(n))continue;try{const v=Function('return (typeof '+n+'!=="undefined")?'+n+':undefined')();if(v!==undefined)out[n]=JSON.parse(JSON.stringify(v))}catch(e){}}return out}
function labelsOf(f){const seen=new Set(),out=[];const add=s=>{s=(s||'').replace(/\s+/g,' ').trim();if(s&&s.length<200&&!seen.has(s)){seen.add(s);out.push(s)}};
 QA('[aria-label]',f).forEach(x=>{if(!x.closest('.ask-ui,.fg-h'))add(x.getAttribute('aria-label'))});QA('svg text',f).forEach(x=>add(x.textContent));
 let n=0;return out.filter(s=>(n+=s.length)<6000).slice(0,160)}
/* Which data blocks each figure draws from: data-ask="A,B" on the figure wins; otherwise the upper-case names its draw function in FIGS uses. */
const CORE=new Set(['KEY','FIGS','LEDK','PANELS','SECTS','HAS','ST','TXTW','CFG','MODELS','PRICE','LIBS','ICONS','TOOLS','INSTRUCTIONS','CORE']);
function inferred(){const out={};try{const F=Function('return typeof FIGS!=="undefined"?FIGS:null')();if(!Array.isArray(F))return out;
 for(const [id,fn] of F){if(typeof fn!=='function')continue;const names=[...new Set(fn.toString().match(/\b[A-Z][A-Z0-9_]{2,}\b/g)||[])].filter(n=>{if(CORE.has(n))return false;
  try{const v=Function('return (typeof '+n+'!=="undefined")?'+n+':undefined')();return v!=null&&typeof v!=='function'&&!(v instanceof Node)}catch(e){return false}});if(names.length)out[id]=names}}catch(e){}return out}
function extract(){
 const meta=n=>{const m=Q(`meta[name="${n}"]`);return m?m.content:''};const inf=inferred();
 const secs=[Q('#overview'),...QA('section.panel')].filter(Boolean);
 const figs=QA('figure.fg[id]').filter(f=>!f.closest('.ask-ui'));
 const sections=secs.map(s=>{const body=Q('.pbi',s)||s;const c=strip(body,'figure,.ask-ui,svg,script,style,template,.ph');
  return {id:s.id,no:s.dataset.no||'',title:s.dataset.title||tx(Q('h2,h1',s)),open:s.classList.contains('open')||!s.classList.contains('panel'),text:tx(c).slice(0,8000),figures:figs.filter(f=>f.closest('section')===s).map(f=>f.id)}});
 const figures=figs.map(f=>{const sec=f.closest('section');const cap=Q('figcaption',f);const capT=cap?tx(strip(cap,'.dlink')):'';
  const names=f.dataset.ask?f.dataset.ask.split(/[\s,]+/).filter(Boolean):(inf[f.id]||[]);
  const bodyText=tx(strip(f,'.fg-h,figcaption,.fg-d,svg,.ask-ui,script,style')).slice(0,3000);
  const o={id:f.id,no:tx(Q('.fgno',f)),section:sec?sec.id:'',title:tx(Q('h3',f)),caption:capT,hint:tx(Q('.hint',f))};
  const d=Q('.fg-d',f);if(d)o.detail=tx(d).slice(0,1200);
  if(names.length)o.data=dataOf(names);
  if(bodyText)o.text=bodyText;
  const lb=labelsOf(f);if(lb.length)o.labels=lb;return o});
 const seen=new Set(),sources=[];QA('a[href^="http"]').forEach(a=>{if(a.closest('.ask-ui'))return;const u=a.href;if(seen.has(u))return;seen.add(u);sources.push({id:'s'+(sources.length+1),title:(tx(a)||a.title||u).slice(0,160),url:u})});
 const ctx={title:D.title,description:meta('description'),headline:tx(Q('#headline')||Q('h1')),opening:QA('#overview ul.opening li').map(tx),sections,figures,sources,footer:tx(Q('footer'))};
 let s=JSON.stringify(ctx);
 if(s.length>CFG.contextChars){ctx.figures.forEach(f=>{delete f.labels});s=JSON.stringify(ctx)}
 if(s.length>CFG.contextChars){ctx.figures.forEach(f=>{delete f.text});s=JSON.stringify(ctx)}
 if(s.length>CFG.contextChars){ctx.figures.forEach(f=>{if(f.data){const j=JSON.stringify(f.data);if(j.length>4000)f.data={note:'Data too large for the prompt; call read_figure_data.'}}});s=JSON.stringify(ctx)}
 if(s.length>CFG.contextChars){ctx.sections.forEach(x=>x.text=x.text.slice(0,2000));ctx.truncated=true}
 return ctx}
let CTX=null,CTXS='',CTXSRC='';
function context(){if(CTX)return CTX;const el=D.getElementById('ask-context');
 if(el){try{CTX=JSON.parse(el.textContent);CTXSRC='frozen'}catch(e){CTX=null}}
 if(!CTX){CTX=extract();CTXSRC='live'}
 CTXS=JSON.stringify(CTX);return CTX}
const INSTRUCTIONS=`You are the "Ask about this report" assistant built into a published report page. The reader is looking at the page while they talk to you, in a side panel.

How to answer:
- Answer from the report context below, from snapshots and selections the reader sends, and from your tools. When the report does not cover something, say so in one line, then give your best general answer and label it as not from the report.
- Keep it short: two to five sentences, or a short list. Plain words for a smart reader who is not technical. Bold the one phrase that answers the question. No em dashes, no preamble.
- Point at the page. Cite a section or figure inline as [[id]], for example [[fig-cost]], and a source as [[src:s2]]. Use only ids that exist in the context. When one place on the page answers the question, also call scroll_to with that id; to point at several places in turn, call highlight.
- Call read_figure_data before quoting a number that is not written in the report text. Call snapshot_region when how a figure looks matters. Call ask_about_selection when the reader says "this", "that" or refers to what they selected. Call open_source to hand over a link. Call save_thread only when the reader asks to save or export.
- Never invent numbers, sources or ids.

The report context is JSON: title, headline, opening bullets, sections (id, number, title, text, figure ids), figures (id, number, section, title, caption, data, labels) and sources (id, title, url). Every section and figure id is also an anchor on the page (#id).`;
function systemBlocks(){context();return [{type:'text',text:INSTRUCTIONS},{type:'text',text:'<report>\n'+CTXS+'\n</report>',cache_control:{type:'ephemeral'}}]}
function target(id){if(!id)return null;id=String(id).replace(/^#/,'');const c=context();
 const f=c.figures.find(x=>x.id===id);if(f)return {kind:'fig',id,short:f.no||'Figure',long:(f.no?f.no+' ':'')+(f.title||''),el:D.getElementById(id)};
 const s=c.sections.find(x=>x.id===id);if(s)return {kind:'sec',id,short:s.no&&s.no!=='00'?'Section '+s.no:(s.title||'Section'),long:(s.no?s.no+' ':'')+(s.title||''),el:D.getElementById(id)};
 const el=D.getElementById(id);if(el&&!el.closest('.ask-ui'))return {kind:'el',id,short:'#'+id,long:'#'+id,el};return null}
const srcById=id=>(context().sources||[]).find(s=>s.id===id);

/* ───────── thread state, kept in localStorage per report ───────── */
let T=null;
function newThread(){const d=new Date(),p=n=>String(n).padStart(2,'0');return {v:1,id:`${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${Math.random().toString(36).slice(2,6)}`,created:d.toISOString(),model:store.get('model')||CFG.model,api:[],view:[],tot:{in:0,cw:0,cr:0,out:0,cost:0},last:0}}
function loadThread(){try{const t=JSON.parse(store.get('thread')||'null');if(t&&t.v===1&&Array.isArray(t.api))return t}catch(e){}return newThread()}
let saveWarned=false;
function persist(){if(!T)return;if(!store.set('thread',JSON.stringify(T))&&!saveWarned){saveWarned=true;note('This thread is too big for the browser to keep. Export it with the menu before you close the page.','bad')}}

/* ───────── UI ───────── */
let fab,sheet,log,ta,sendBtn,pend,meter,statusEl,modelSel,chip,busy,menu;
let pending=[];          // attachments for the next question: {kind:'snap',img,mt,w,h,label,where} | {kind:'sel',text,where}
let running=null;        // AbortController while a question is in flight
let lastSel=null;        // most recent text selection on the page
let status='unknown', docked=false;
function build(){
 sprite();D.body.classList.add('has-ask');
 fab=H(`<button class="ask-fab ask-ui" type="button" aria-haspopup="dialog" aria-controls="askSheet" aria-expanded="false" aria-label="Ask about this report">${ic('spark')}<span>Ask</span></button>`);
 sheet=H(`<aside class="ask-sheet ask-ui" id="askSheet" role="dialog" aria-modal="false" aria-labelledby="askTitle" inert>
  <div class="ask-head"><h2 id="askTitle">${ic('spark')}<span>Ask about this report</span></h2>
   <select class="ask-model" aria-label="Model">${Object.entries(MODELS).map(([k,m])=>`<option value="${k}">${E(m.label)}</option>`).join('')}</select>
   <div class="ask-menu"><button class="ask-ib" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Thread options">${ic('more')}</button>
    <div class="ask-menu-list" role="menu" aria-label="Thread options">
     <button type="button" role="menuitem" data-act="md">${ic('down')}Export as Markdown</button>
     <button type="button" role="menuitem" data-act="drive">${ic('cloud')}Save to here.now Drive</button>
     <button type="button" role="menuitem" data-act="new">${ic('plus')}New thread</button></div></div>
   <button class="ask-ib ask-close" type="button" aria-label="Close the panel">${ic('x')}</button></div>
  <div class="ask-status" role="status"></div>
  <div class="ask-log" role="log" aria-live="polite" aria-relevant="additions" tabindex="-1"></div>
  <form class="ask-comp" novalidate>
   <div class="ask-pend" aria-label="Attached to your next question"></div>
   <label class="sr" for="askTa">Your question</label>
   <textarea class="ask-ta" id="askTa" rows="1" placeholder="Ask about anything on this page"></textarea>
   <div class="ask-bar"><button class="ask-btn ask-snap" type="button" title="Drag a box over part of the page">${ic('scan')}<span>Snapshot</span></button><span class="sp"></span>
    <button class="ask-btn go ask-send" type="submit">${ic('up')}<span>Send</span></button></div></form>
  <div class="ask-meter" aria-live="off"></div></aside>`);
 chip=H(`<button class="ask-selchip ask-ui" type="button" aria-label="Ask about the selected text">${ic('spark')}<span>Ask</span></button>`);
 busy=H(`<div class="ask-busy ask-ui" role="status" aria-live="polite"></div>`);
 D.body.append(fab,sheet,chip,busy);
 log=Q('.ask-log',sheet);ta=Q('.ask-ta',sheet);sendBtn=Q('.ask-send',sheet);pend=Q('.ask-pend',sheet);meter=Q('.ask-meter',sheet);statusEl=Q('.ask-status',sheet);modelSel=Q('.ask-model',sheet);menu=Q('.ask-menu',sheet);
 fab.addEventListener('click',()=>open(true));
 Q('.ask-close',sheet).addEventListener('click',()=>open(false));
 sheet.addEventListener('keydown',e=>{if(e.key==='Escape'){if(menu.classList.contains('open')){menuOpen(false);Q('button',menu).focus();return}e.stopPropagation();open(false)}});
 Q('form',sheet).addEventListener('submit',e=>{e.preventDefault();running?stop():send()});
 ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();running?null:send()}});
 ta.addEventListener('input',grow);
 Q('.ask-snap',sheet).addEventListener('click',()=>snapRegion());
 modelSel.addEventListener('change',()=>{T.model=modelSel.value;store.set('model',T.model);persist();renderMeter();if(HTTP)probe(true)});
 const mb=Q('button',menu);mb.addEventListener('click',e=>{e.stopPropagation();menuOpen(!menu.classList.contains('open'))});
 Q('.ask-menu-list',menu).addEventListener('keydown',e=>{const bs=QA('.ask-menu-list button',menu);const i=bs.indexOf(D.activeElement);if(e.key==='ArrowDown'){e.preventDefault();bs[(i+1)%bs.length].focus()}if(e.key==='ArrowUp'){e.preventDefault();bs[(i-1+bs.length)%bs.length].focus()}});
 QA('.ask-menu-list button',menu).forEach(b=>b.addEventListener('click',()=>{menuOpen(false);mb.focus();const a=b.dataset.act;if(a==='md')exportMd();if(a==='drive')saveAll({download:false,drive:true,announce:true});if(a==='new')resetThread()}));
 D.addEventListener('click',e=>{if(!menu.contains(e.target))menuOpen(false)});
 log.addEventListener('click',onLogClick);
 chip.addEventListener('pointerdown',e=>e.preventDefault());
 chip.addEventListener('click',()=>{if(!lastSel)return;addPending({kind:'sel',text:lastSel.text,where:lastSel.where,section:lastSel.section,figure:lastSel.figure});hideChip();open(true);if(!ta.value)ta.value='What does this mean?';ta.select()});
 D.addEventListener('selectionchange',()=>{clearTimeout(selT);selT=setTimeout(trackSel,140)});
 addEventListener('scroll',()=>{if(chip.classList.contains('show'))placeChip()},{passive:true});
 QA('figure.fg[id]').forEach(f=>{const h=Q('.fg-h',f);if(!h)return;const lab=(tx(Q('.fgno',f))+' '+tx(Q('h3',f))).trim();
  const b=H(`<button class="ask-figbtn ask-ui" type="button" aria-label="Snapshot ${E(lab)} and ask about it" title="Snapshot this figure and ask">${ic('cam')}</button>`);
  b.addEventListener('click',()=>snapFigure(f));f.classList.add('ask-has');f.appendChild(b)});
 addEventListener('resize',()=>{if(sheet.classList.contains('open'))dock(true)});
 addEventListener('keydown',e=>{if(e.key==='Escape'&&chip.classList.contains('show'))hideChip()});
}
function menuOpen(v){menu.classList.toggle('open',v);Q('button',menu).setAttribute('aria-expanded',v);if(v)Q('.ask-menu-list button',menu).focus()}
function grow(){ta.style.height='auto';ta.style.height=Math.min(180,ta.scrollHeight+2)+'px'}
function redraw(){try{if(typeof drawAll==='function')drawAll();if(typeof slideAll==='function')slideAll()}catch(e){}}
/* Dock on wide screens: the page narrows so the sheet never covers what scroll_to points at. The page's own max-width media rules
   are replayed for the narrower width (scoped under body.ask-dock), so its layout matches what it would be on a screen that wide;
   figures then redraw at the new width. */
let emu=null,dockW=0;
function mqAt(m,w){return m.split(',').some(part=>part.split(/\band\b/i).every(f=>{f=f.trim().replace(/^only\s+/i,'');let x;
 if((x=f.match(/max-width\s*:\s*([\d.]+)px/i)))return w<=+x[1];if((x=f.match(/min-width\s*:\s*([\d.]+)px/i)))return w>=+x[1];
 if(!f||/^(screen|all)$/i.test(f))return true;try{return matchMedia(f.startsWith('(')?f:'('+f+')').matches}catch(e){return false}}))}
function emulate(w){if(!emu){emu=D.createElement('style');emu.className='ask-ui';D.head.appendChild(emu)}if(!w){emu.textContent='';return}const out=[];
 for(const sh of D.styleSheets){if(sh.ownerNode===emu)continue;let rules;try{rules=sh.cssRules}catch(e){continue}
  for(const r of rules){if(!(r instanceof CSSMediaRule))continue;const m=r.conditionText||r.media.mediaText;if(/print|ask-/.test(m))continue;
   if(mqAt(m,w)&&!matchMedia(m).matches)for(const ir of r.cssRules)if(ir instanceof CSSStyleRule&&!/ask-/.test(ir.selectorText))out.push(ir.selectorText.split(',').map(x=>'body.ask-dock '+x.trim()).join(',')+'{'+ir.style.cssText+'}')}}
 emu.textContent=out.join('\n')}
function dock(v){const sw=sheet.getBoundingClientRect().width;const want=v&&innerWidth>=1180;const w=want?Math.round(innerWidth-sw):0;if(want===docked&&w===dockW)return;docked=want;dockW=w;
 D.body.style.paddingRight=want?sw+'px':'';D.body.classList.toggle('ask-dock',want);emulate(want?w:0);redraw()}
let firstOpen=true;
function open(v){const isOpen=sheet.classList.contains('open');if(v===isOpen)return;
 sheet.classList.toggle('open',v);sheet.inert=!v;D.body.classList.toggle('ask-open',v);fab.setAttribute('aria-expanded',v);
 if(typeof hideTip==='function')hideTip();
 if(v){dock(true);if(firstOpen){firstOpen=false;renderAll();lib('marked').then(()=>{if(!running)renderAll()}).catch(()=>{});if(HTTP)probe();else setStatus('local')}setTimeout(()=>ta.focus(),RM?0:120);renderMeter()}
 else{dock(false);menuOpen(false);fab.focus()}}
function addPending(a){if(pending.length>=CFG.maxAtts)pending.shift();pending.push(a);renderPending()}
function renderPending(){pend.replaceChildren(...pending.map((a,i)=>{const p=H(`<div class="ask-pill">${a.kind==='snap'?`<img alt="" src="data:${E(a.mt)};base64,${E(a.img)}">`:ic('quote')}<span>${E(a.kind==='snap'?a.label:'"'+a.text.slice(0,80)+'"')}</span><button class="ask-ib" type="button" aria-label="Remove ${a.kind==='snap'?'snapshot':'quote'}">${ic('x')}</button></div>`);
 Q('button',p).addEventListener('click',()=>{pending.splice(i,1);renderPending();ta.focus()});return p}))}

/* ───────── status banners ───────── */
const KEYLINE='In your here.now dashboard open Variables, add ANTHROPIC_API_KEY with allowed upstream api.anthropic.com, then reload this page.';
function setStatus(s,extra){status=s;const S={
  local:['warn','Preview copy','Answers need the published page: Claude is reached through the site\'s /api/claude route on here.now. Everything else here works.'],
  nokey:['bad','Claude key not set',KEYLINE+' The page itself never holds the key. Tip: keep the page on Only you so nobody else spends it.'],
  badkey:['bad','Claude key rejected','here.now has ANTHROPIC_API_KEY, but Anthropic did not accept it. Replace it under Variables in the here.now dashboard.'],
  noroute:['bad','Proxy route missing','This copy was published without .herenow/proxy.json, so /api/claude does not exist. Rebuild with the report recipe and republish the folder.'],
  limit:['warn','Slow down',extra||'Too many questions this hour from this network. Try again later.'],
  neterr:['warn','Cannot reach the proxy',extra||'Check the connection and try again.'],
  cap:['warn','This thread hit its cap',extra||'Start a new thread to keep costs down. Export this one first if you want it.']}[s];
 if(!S){statusEl.className='ask-status';statusEl.replaceChildren();if(ta){ta.disabled=false;sendBtn.disabled=false}return}
 statusEl.className='ask-status show '+S[0];
 statusEl.innerHTML=(`<b><span class="led ${S[0]==='bad'?'miss':'part'} on"></span>${E(S[1])}</b><div>${E(S[2])}</div>`+(s==='nokey'?`<div class="ask-row"><button class="ask-btn" type="button" data-copy="1">${ic('copy')}<span>Copy the instruction</span></button></div>`:'')+(s==='cap'?`<div class="ask-row"><button class="ask-btn go" type="button" data-new="1">${ic('plus')}<span>New thread</span></button></div>`:''));
 const cp=Q('[data-copy]',statusEl);if(cp)cp.addEventListener('click',()=>{try{navigator.clipboard.writeText(KEYLINE);Q('span',cp).textContent='Copied'}catch(e){}});
 const nw=Q('[data-new]',statusEl);if(nw)nw.addEventListener('click',resetThread);
 const block=s==='nokey'||s==='badkey'||s==='noroute'||s==='cap';ta.disabled=block;sendBtn.disabled=block&&!running}
async function classify(res){let txt='';try{txt=await res.text()}catch(e){}let j=null;try{j=JSON.parse(txt)}catch(e){}
 const msg=(j&&j.error&&(j.error.message||j.error))||(j&&j.message)||'';
 if(res.status===401)return /required/i.test(msg)?{s:'nokey'}:{s:'badkey'};
 if(res.status===404&&!(j&&j.type==='error'))return {s:'noroute'};
 if(res.status===403)return {s:'neterr',m:String(msg||'here.now refused the call (403).')};
 if(res.status===429){const ra=+res.headers.get('retry-after')||(j&&j.retry_after)||0;return {s:'limit',m:'Too many questions this hour from this network'+(ra?`. Try again in about ${Math.ceil(ra/60)} min.`:'.')}}
 return {s:'error',status:res.status,m:String(msg||txt.slice(0,200)||('HTTP '+res.status)),type:j&&j.error&&j.error.type}}
let probed=false,ctxTok=0;
async function probe(force){if(probed&&!force)return;probed=true;
 try{const r=await fetch(CFG.count,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model:T.model,system:systemBlocks(),tools:TOOLS,messages:[{role:'user',content:'ping'}]})});
  if(r.ok){try{ctxTok=(await r.json()).input_tokens||0}catch(e){}setStatus(T.last>=CFG.ctxCap||T.tot.cost>=CFG.costCap?'cap':null);renderMeter();return}
  const c=await classify(r);if(c.s==='error'){setStatus(null);return}setStatus(c.s,c.m)}
 catch(e){setStatus('neterr')}}

/* ───────── rendering ───────── */
function md(src){let s=String(src||'');
 s=s.replace(/\[\[src:([A-Za-z0-9_-]+)\]\]/g,(m,id)=>{const S=srcById(id);return S?`<span class="ask-ref" data-src="${E(id)}">${E(S.title.length>38?S.title.slice(0,36)+'..':S.title)}</span>`:''});
 s=s.replace(/\[\[([A-Za-z0-9_.:-]+)(?:\|([^\]]{1,60}))?\]\]/g,(m,id,lab)=>{const t=target(id);return t?`<span class="ask-ref" data-ref="${E(t.id)}">${E(lab||t.short)}</span>`:''});
 let html;if(window.marked&&marked.parse){try{html=marked.parse(s,{gfm:true,breaks:false})}catch(e){html=null}}
 if(html==null)html=s.split(/\n{2,}/).map(p=>'<p>'+p.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')+'</p>').join('');
 const box=D.createElement('div');box.innerHTML=clean(html);
 QA('a[href]',box).forEach(a=>{const sp=D.createElement('span');sp.className='ask-ref';sp.dataset.href=a.href;sp.textContent=a.textContent||a.href;a.replaceWith(sp)});
 return box.innerHTML}
function refsOf(parts){const out=[],seen=new Set();for(const p of parts){if(p.t==='text'){const box=D.createElement('div');box.innerHTML=md(p.md);QA('.ask-ref',box).forEach(r=>{const S=r.dataset.src?srcById(r.dataset.src):null;const k=r.dataset.ref||(S&&S.url)||r.dataset.src||r.dataset.href;if(k&&!seen.has(k)){seen.add(k);out.push(r.dataset.ref?{ref:r.dataset.ref}:r.dataset.src?{src:r.dataset.src}:{href:r.dataset.href,label:r.textContent})}})}if(p.t==='act'&&p.url&&!seen.has(p.url)){seen.add(p.url);out.push({href:p.url,label:p.label})}}return out}
function chipFor(r){if(r.ref){const t=target(r.ref);if(!t)return null;return `<button class="ask-chip" type="button" data-ref="${E(t.id)}" title="Show it on the page">${ic('aim')}<span>${E(t.long)}</span></button>`}
 const S=r.src?srcById(r.src):null;const href=S?S.url:r.href;if(!href||!/^https?:/.test(href))return null;
 return `<a class="ask-chip" href="${E(href)}" target="_blank" rel="noopener">${ic('ext')}<span>${E(S?S.title:(r.label||href))}</span></a>`}
const ACTICON={scroll_to:'aim',highlight:'mark',read_figure_data:'table',snapshot_region:'cam',ask_about_selection:'quote',open_source:'ext',save_thread:'save'};
function actHtml(p){const inner=`${ic(ACTICON[p.tool]||'spark')}<span>${p.html}</span>${p.thumb?`<img alt="" src="${E(p.thumb)}">`:''}`;
 if(p.url)return `<a class="ask-act" href="${E(p.url)}" target="_blank" rel="noopener">${inner}</a>`;
 if(p.ref&&!p.err)return `<button class="ask-act" type="button" data-ref="${E(p.ref)}">${inner}</button>`;
 return `<div class="ask-act${p.err?' err':''}">${inner}</div>`}
function userHtml(v){return `<div class="ask-msg ask-u">${v.atts&&v.atts.length?`<div class="ask-atts">${v.atts.map(a=>a.kind==='snap'?`<div class="ask-thumb">${a.thumb?`<img alt="Snapshot: ${E(a.label)}" src="${E(a.thumb)}">`:''}<span>${E(a.label)}</span></div>`:`<div class="ask-quote">"${E(a.text.slice(0,400))}"${a.where?`<small>${E(a.where)}</small>`:''}</div>`).join('')}</div>`:''}${v.text?`<div class="ask-bubble">${E(v.text)}</div>`:''}</div>`}
function botHtml(v,live){const parts=v.parts.map((p,i)=>p.t==='text'?`<div class="ask-md${live&&i===v.parts.length-1?' ask-caret':''}">${md(p.md)}</div>`:p.t==='note'?`<div class="ask-note${p.bad?' bad':''}">${E(p.text)}</div>`:actHtml(p)).join('');
 const lp=v.parts[v.parts.length-1];const waiting=live&&(!lp||lp.t!=='text');
 const refs=!live&&v.refs&&v.refs.length?`<div class="ask-refs" aria-label="Points to">${v.refs.map(chipFor).filter(Boolean).join('')}</div>`:'';
 const use=v.use?`<div class="ask-use">${E(v.use)}</div>`:'';
 return `<div class="ask-msg ask-b"><div class="ask-who">${ic('spark')}<span>Claude${v.model?' · '+E((MODELS[v.model]||{}).label||v.model):''}</span></div>${parts}${waiting?`<div class="ask-think live"><i></i><i></i><i></i><span>${lp?'Working':'Thinking'}</span></div>`:''}${refs}${use}</div>`}
function emptyHtml(){const c=context();const f=c.figures.find(x=>x.no)||c.figures[0];
 const sug=['Sum this report up in three lines','What should I do next, and why?'];if(f)sug.push(`Explain ${f.no||'the first figure'} in plain words`);
 return `<div class="ask-empty"><h3>Ask about anything on this page</h3><p>Answers point back at the figures. Select text for an Ask chip, or use the camera on any figure.</p><ul>${sug.map(s=>`<li><button class="ask-sugg" type="button" data-sugg="${E(s)}">${E(s)}</button></li>`).join('')}</ul></div>`}
function renderAll(){if(!log)return;const html=T.view.length?T.view.map(v=>v.role==='user'?userHtml(v):botHtml(v,false)).join(''):emptyHtml();log.innerHTML=html;log.scrollTop=log.scrollHeight;renderMeter()}
let liveEl=null,liveRAF=0;
function renderLive(v){cancelAnimationFrame(liveRAF);liveRAF=requestAnimationFrame(()=>{const h=H((botHtml(v,true)));if(liveEl&&liveEl.isConnected)liveEl.replaceWith(h);else log.appendChild(h);liveEl=h;const near=log.scrollHeight-log.scrollTop-log.clientHeight<160;if(near)log.scrollTop=log.scrollHeight})}
function note(text,bad){if(!log)return;log.appendChild(H((`<div class="ask-note${bad?' bad':''}">${E(text)}</div>`)));log.scrollTop=log.scrollHeight}
function renderMeter(){if(!meter||!T)return;const M=MODELS[T.model]||{};modelSel.value=T.model;
 const lastV=[...T.view].reverse().find(v=>v.role==='bot'&&v.cost!=null);
 const capHit=T.last>=CFG.ctxCap||T.tot.cost>=CFG.costCap;
 meter.innerHTML=(`<span>Last answer <b>${lastV?fmt$(lastV.cost):'none yet'}</b></span><span>Thread <b>${fmt$(T.tot.cost)}</b> of ${fmt$(CFG.costCap)} cap</span><span class="${capHit?'cap':''}">Context <b>${fmtK(T.last||ctxTok)}</b> of ${fmtK(CFG.ctxCap)} tokens${!T.last&&ctxTok?' (the report)':''}</span><span>${E(M.label||T.model)}: $${M.in}/$${M.out} per M in/out</span>`)}
function onLogClick(e){const s=e.target.closest('[data-sugg]');if(s){ta.value=s.dataset.sugg;send();return}
 const r=e.target.closest('[data-ref]');if(r){e.preventDefault();showOnPage(r.dataset.ref,{pulse:true});return}
 const sr=e.target.closest('.ask-ref[data-src]');if(sr){const S=srcById(sr.dataset.src);if(S)window.open(S.url,'_blank','noopener');return}
 const hr=e.target.closest('.ask-ref[data-href]');if(hr&&/^https?:/.test(hr.dataset.href))window.open(hr.dataset.href,'_blank','noopener')}

/* ───────── pointing at the page ───────── */
function reveal(el){const p=el.closest('section.panel');if(p&&!p.classList.contains('open')){if(typeof setOpen==='function')setOpen(p,true,true);else p.classList.add('open')}}
function topH(){const t=Q('#top');return t?t.getBoundingClientRect().height:0}
function showOnPage(id,{pulse=true,scroll=true,hl=false,note:nt}={}){const t=target(id);if(!t||!t.el)return null;reveal(t.el);
 if(scroll){const r=t.el.getBoundingClientRect();const off=r.top<topH()+8||r.bottom>innerHeight-8;if(off||pulse){const y=Math.max(0,r.top+scrollY-topH()-16);scrollTo({top:y,behavior:RM?'auto':'smooth'})}}
 if(pulse){t.el.classList.remove('ask-pulse');void t.el.offsetWidth;t.el.classList.add('ask-pulse');setTimeout(()=>t.el.classList.remove('ask-pulse'),2600)}
 if(hl){t.el.classList.add('ask-hl');let n=null;nt=String(nt||'').trim();if(nt){n=H(`<div class="ask-hl-note ask-ui"></div>`);n.textContent=nt.slice(0,80);D.body.appendChild(n);
   const place=()=>{const r=t.el.getBoundingClientRect();n.style.left=(r.left+scrollX+8)+'px';n.style.top=Math.max(scrollY+topH()+4,r.top+scrollY-n.offsetHeight-12)+'px'};setTimeout(place,RM?0:450);place()}
  setTimeout(()=>{t.el.classList.remove('ask-hl');if(n)n.remove()},6000)}
 return t}

/* ───────── text selection → Ask chip ───────── */
let selT=0;
function whereOf(node){const el=node&&(node.nodeType===1?node:node.parentElement);if(!el)return {};const f=el.closest('figure.fg[id]'),s=el.closest('section[id]');
 const ft=f?target(f.id):null,st=s?target(s.id):null;return {figure:f?f.id:'',section:s?s.id:'',where:[st&&st.long,ft&&ft.long].filter(Boolean).join(' · ')}}
function trackSel(){const s=getSelection();if(!s||s.isCollapsed||!s.rangeCount){hideChip();return}const t=s.toString().replace(/\s+/g,' ').trim();
 const r=s.getRangeAt(0);const a=r.commonAncestorContainer;const el=a.nodeType===1?a:a.parentElement;
 if(!t||t.length<2||!el||el.closest('.ask-ui,input,textarea')){hideChip();return}
 lastSel=Object.assign({text:t.slice(0,2000),at:Date.now()},whereOf(a));placeChip()}
function placeChip(){const s=getSelection();if(!s||!s.rangeCount||s.isCollapsed){hideChip();return}const rs=[...s.getRangeAt(0).getClientRects()].filter(r=>r.width||r.height);const r=rs[rs.length-1]||s.getRangeAt(0).getBoundingClientRect();
 if(!r||(!r.width&&!r.height)){hideChip();return}chip.classList.add('show');const w=chip.offsetWidth,h=chip.offsetHeight;
 let x=Math.min(innerWidth-w-12,Math.max(12,r.right-w/2)),y=r.bottom+10;if(y+h>innerHeight-12)y=Math.max(12,r.top-h-10);chip.style.left=x+'px';chip.style.top=y+'px'}
function hideChip(){chip&&chip.classList.remove('show')}

/* ───────── snapshots: the browser's own renderer through html-to-image (SVG foreignObject), cropped and scaled ───────── */
let fontCSS=null;
/* Web fonts for snapshots, fetched here (Latin subsets only) so html-to-image never reads a cross-origin stylesheet, which logs errors. */
const asData=b=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(b)});
async function fonts(){if(fontCSS!==null)return fontCSS;fontCSS='';
 try{for(const l of QA('link[rel="stylesheet"][href*="fonts.googleapis.com"]')){const css=await (await fetch(l.href)).text();
  for(const f of css.match(/@font-face\s*\{[^}]*\}/g)||[]){if(/unicode-range/.test(f)&&!/U\+0000-00FF/i.test(f))continue;const m=f.match(/url\((https:[^)]+)\)/);if(!m)continue;
   const r=await fetch(m[1]);if(!r.ok)continue;fontCSS+=f.replace(m[1],await asData(await r.blob()))+'\n'}}}catch(e){}return fontCSS}
function showBusy(t){busy.textContent=t;busy.classList.toggle('show',!!t)}
async function render(el,crop){const h2i=await lib('h2i');const r=el.getBoundingClientRect();const box=crop||{x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height};
 const edge=Math.max(box.w,box.h);const pr=Math.max(.25,Math.min(2,devicePixelRatio||1,CFG.maxImageEdge/edge,Math.sqrt(16e6/Math.max(1,r.width*r.height))));
 const bg=getComputedStyle(D.body).backgroundColor;const filter=n=>n.nodeType!==8&&!(n.classList&&(n.classList.contains('ask-ui')||n.classList.contains('tip')||n.classList.contains('doors')));
 const opts={pixelRatio:pr,backgroundColor:bg,filter,cacheBust:false,imagePlaceholder:'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='};
 const fc=await fonts();const why=e=>new Error(e&&e.message||'the browser could not draw this part of the page');
 let canvas;try{canvas=await h2i.toCanvas(el,Object.assign({fontEmbedCSS:fc},opts))}catch(e){try{canvas=await h2i.toCanvas(el,Object.assign({fontEmbedCSS:''},opts))}catch(e2){throw why(e2)}}
 const ox=r.left+scrollX,oy=r.top+scrollY;const k=canvas.width/Math.max(1,r.width);
 const W=Math.max(1,Math.round(box.w*k)),Hh=Math.max(1,Math.round(box.h*k));
 const c2=D.createElement('canvas');c2.width=Math.min(W,Math.round(CFG.maxImageEdge*W/Math.max(W,Hh)));c2.height=Math.round(c2.width*Hh/W);
 const g=c2.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,c2.width,c2.height);g.drawImage(canvas,(box.x-ox)*k,(box.y-oy)*k,W,Hh,0,0,c2.width,c2.height);
 let url=c2.toDataURL('image/png'),mt='image/png';if(url.length>1500000){url=c2.toDataURL('image/jpeg',.88);mt='image/jpeg'}
 const th=D.createElement('canvas');const ts=Math.min(1,360/Math.max(c2.width,c2.height));th.width=Math.max(1,Math.round(c2.width*ts));th.height=Math.max(1,Math.round(c2.height*ts));th.getContext('2d').drawImage(c2,0,0,th.width,th.height);
 return {img:url.split(',')[1],mt,w:c2.width,h:c2.height,thumb:th.toDataURL('image/jpeg',.8)}}
function holder(rect){const cand=[...QA('figure.fg[id]'),...QA('section[id]'),Q('main'),D.body].filter(Boolean);let best=D.body,area=Infinity;
 for(const el of cand){const r=el.getBoundingClientRect();const x=r.left+scrollX,y=r.top+scrollY;if(x<=rect.x+2&&y<=rect.y+2&&x+r.width>=rect.x+rect.w-2&&y+r.height>=rect.y+rect.h-2&&r.width*r.height<area){best=el;area=r.width*r.height}}return best}
async function snapFigure(f){const t=target(f.id);open(true);showBusy('Capturing '+(t?t.short:'figure')+'...');
 try{const s=await render(f);addPending(Object.assign({kind:'snap',label:t?t.long:'Figure',where:t?t.long:''},s));if(!ta.value)ta.value='Explain this figure in plain words.';ta.focus();ta.select()}
 catch(e){note('Snapshot failed: '+e.message,true)}finally{showBusy('')}}
function pick(){return new Promise(done=>{const wasOpen=sheet.classList.contains('open')&&!docked;if(wasOpen){sheet.classList.remove('open');sheet.inert=true}
 D.body.classList.add('ask-picking');hideChip();
 const ov=H(`<div class="ask-pick ask-ui" tabindex="-1" role="dialog" aria-label="Pick part of the page"><div class="ask-pick-bar"><span>Drag a box over what you want to ask about. Enter takes the whole screen, Esc cancels.</span><button class="ask-btn" type="button">Cancel</button></div><div class="ask-pick-box"></div></div>`);
 D.body.appendChild(ov);ov.focus();const box=Q('.ask-pick-box',ov);let st=null,cur=null;
 const end=v=>{ov.remove();D.body.classList.remove('ask-picking');if(wasOpen){sheet.classList.add('open');sheet.inert=false}done(v)};
 Q('button',ov).addEventListener('click',e=>{e.stopPropagation();end(null)});
 Q('.ask-pick-bar',ov).addEventListener('pointerdown',e=>e.stopPropagation());
 ov.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();end(null)}if(e.key==='Enter'){e.preventDefault();end({x:scrollX,y:scrollY+topH(),w:innerWidth,h:innerHeight-topH()})}});
 ov.addEventListener('pointerdown',e=>{st={x:e.clientX,y:e.clientY};ov.setPointerCapture(e.pointerId);box.style.display='block';upd(e)});
 const upd=e=>{if(!st)return;const x=Math.min(st.x,e.clientX),y=Math.min(st.y,e.clientY),w=Math.abs(e.clientX-st.x),h=Math.abs(e.clientY-st.y);cur={x,y,w,h};Object.assign(box.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'})};
 ov.addEventListener('pointermove',upd);
 ov.addEventListener('pointerup',e=>{if(!st)return;upd(e);st=null;const c=cur;
  if(!c||c.w<16||c.h<16){ov.style.pointerEvents='none';const under=D.elementFromPoint(e.clientX,e.clientY);ov.style.pointerEvents='';const el=under&&(under.closest('figure.fg[id]')||under.closest('section[id]'));
   if(!el){box.style.display='none';return}const r=el.getBoundingClientRect();end({x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height,el});return}
  end({x:c.x+scrollX,y:c.y+scrollY,w:c.w,h:c.h})})})}
async function snapRegion(){const rect=await pick();if(!rect){ta&&ta.focus();return}const el=rect.el||holder(rect);showBusy('Capturing the region...');
 try{const s=await render(el,rect.el?null:rect);const w=whereOf(el);const t=el.id?target(el.id):null;const label=t?(rect.el?t.long:'Region in '+t.long):'Region of the page';
  addPending(Object.assign({kind:'snap',label,where:w.where},s));if(!ta.value)ta.value='What am I looking at here?';ta.focus();ta.select()}
 catch(e){note('Snapshot failed: '+e.message,true)}finally{showBusy('')}}

/* ───────── tools Claude can call; each handler runs in this page ───────── */
const idProp={type:'object',properties:{id:{type:'string',description:'A section or figure id from the report context, for example "fig-cost" or "overview".'}},required:['id']};
const TOOLS=[
 {name:'scroll_to',description:'Scroll the reader\'s page to a section or figure and pulse it so they see it. Use whenever your answer points at one specific place.',input_schema:idProp},
 {name:'highlight',description:'Outline a section or figure for six seconds with an optional short note beside it. Scrolls only when it is off screen. Use to point at several places in turn.',input_schema:{type:'object',properties:{id:idProp.properties.id,note:{type:'string',description:'Up to 80 characters shown next to the outline.'}},required:['id']}},
 {name:'read_figure_data',description:'Return everything behind one figure: title, caption, the data blocks it is drawn from and the labels it renders. Use before quoting an exact number that is not written in the report text.',input_schema:idProp},
 {name:'snapshot_region',description:'Capture a picture of one figure or section exactly as the reader sees it now (theme, open panels, current selection) and return it as an image. Use when how something looks matters.',input_schema:idProp},
 {name:'ask_about_selection',description:'Return the text the reader selected on the page (or selected most recently) and the section and figure it sits in. Use when the reader says "this", "that number" or "what I selected".',input_schema:{type:'object',properties:{}}},
 {name:'open_source',description:'Return the title and URL of one source so the reader gets a link they can click. Use when you say where a fact comes from.',input_schema:{type:'object',properties:{id:{type:'string',description:'A source id from the report context, for example "s2".'}},required:['id']}},
 {name:'save_thread',description:'Save this conversation: it is kept in this browser, downloaded as a Markdown file, and appended to the owner\'s here.now Drive when that is set up. Use only when the reader asks to save or export.',input_schema:{type:'object',properties:{download:{type:'boolean',description:'Also download the .md file. Default true.'}}}}
];
const okId=v=>typeof v==='string'&&v.length>0&&v.length<120;
async function runTool(b){const n=b.name,a=b.input||{};const act={t:'act',tool:n,html:''};
 try{
  if(b._bad)throw new Error('the tool input was not valid JSON');
  if(n==='scroll_to'||n==='highlight'){if(!okId(a.id))throw new Error('id is required');const t=showOnPage(a.id,n==='scroll_to'?{pulse:true}:{pulse:false,scroll:true,hl:true,note:a.note});if(!t)throw new Error(`no section or figure with id "${a.id}"`);
   act.ref=t.id;act.html=`${n==='scroll_to'?'Showed':'Outlined'} <b>${E(t.long)}</b>${a.note&&n==='highlight'?': '+E(String(a.note).slice(0,80)):''}`;return [act,`Done. ${t.long} is ${n==='scroll_to'?'in view and pulsing':'outlined'} on the reader's screen.`]}
  if(n==='read_figure_data'){if(!okId(a.id))throw new Error('id is required');const c=context();const f=c.figures.find(x=>x.id===a.id);const el=D.getElementById(a.id);if(!f&&!(el&&el.matches('figure')))throw new Error(`no figure with id "${a.id}"`);
   const live=el?{labels:labelsOf(el),detail_now:tx(Q('.fg-d',el)).slice(0,1500)}:{};const names=el&&el.dataset.ask?el.dataset.ask.split(/[\s,]+/).filter(Boolean):(inferred()[a.id]||[]);const data=names.length?dataOf(names):(f&&f.data)||null;
   const out=JSON.stringify(Object.assign({},f||{id:a.id},data?{data}:{},live)).slice(0,24000);act.ref=a.id;act.html=`Read the data behind <b>${E((f&&f.no)||a.id)}</b>`;return [act,out]}
  if(n==='snapshot_region'){if(!okId(a.id))throw new Error('id is required');const t=target(a.id);if(!t||!t.el)throw new Error(`no section or figure with id "${a.id}"`);reveal(t.el);showBusy('Claude is looking at '+t.short+'...');
   try{const s=await render(t.el);act.ref=t.id;act.thumb=s.thumb;act.html=`Looked at <b>${E(t.long)}</b>`;return [act,[{type:'text',text:`Snapshot of ${t.long} as the reader sees it (${s.w} x ${s.h} px).`},{type:'image',source:{type:'base64',media_type:s.mt,data:s.img}}]]}finally{showBusy('')}}
  if(n==='ask_about_selection'){const s=lastSel;act.html=s?`Read your selection: <b>"${E(s.text.slice(0,60))}${s.text.length>60?'..':''}"</b>`:'No text is selected on the page';
   return [act,s?JSON.stringify({text:s.text,section:s.section,figure:s.figure,where:s.where,seconds_ago:Math.round((Date.now()-s.at)/1000)}):'The reader has not selected any text on the page.']}
  if(n==='open_source'){const S=okId(a.id)?srcById(a.id):null;if(!S)throw new Error(`no source with id "${a.id}"`);act.url=S.url;act.label=S.title;act.html=`Source: <b>${E(S.title)}</b>`;return [act,JSON.stringify(S)]}
  if(n==='save_thread'){const r=await saveAll({download:a.download!==false,drive:true});act.html=E(r.say);return [act,r.say]}
  throw new Error('unknown tool '+n)}
 catch(e){act.err=true;act.html=`${E(n)} failed: ${E(e.message)}`;return [act,'Error: '+e.message,true]}}

/* ───────── Messages API through the proxy, streamed ───────── */
function readerState(){const secs=QA('#overview,section.panel');let cur=secs[0];const lim=topH()+120;secs.forEach(s=>{if(s.getBoundingClientRect().top<=lim)cur=s});const t=cur&&target(cur.id);
 return `Reader state: viewing ${t?t.long+' (#'+t.id+')':'the top of the page'}; ${R.dataset.theme||'dark'} theme; screen ${innerWidth}x${innerHeight}.`}
async function stream(body,signal,onBlock){const M=MODELS[body.model]||MODELS[CFG.model];
 const res=await fetch(M.route,{method:'POST',headers:{'content-type':'application/json',accept:'text/event-stream'},body:JSON.stringify(body),signal});
 if(!res.ok){const c=await classify(res);const err=new Error(c.m||c.s);err.c=c;throw err}
 const blocks=[];let usage={},stopReason=null,model=body.model,stopDetails=null;
 const rd=res.body.getReader(),dec=new TextDecoder();let buf='';
 const handle=(type,j)=>{
  if(type==='message_start'){model=j.message.model||model;usage=Object.assign({},j.message.usage||{})}
  else if(type==='content_block_start'){const b=Object.assign({},j.content_block);if(b.type==='tool_use'){b._json=''}if(b.type==='text'&&b.text==null)b.text='';if(b.type==='thinking'&&b.thinking==null)b.thinking='';blocks[j.index]=b;onBlock(blocks)}
  else if(type==='content_block_delta'){const b=blocks[j.index],d=j.delta||{};if(!b)return;
   if(d.type==='text_delta'){b.text+=d.text;onBlock(blocks)}else if(d.type==='thinking_delta')b.thinking+=d.thinking;else if(d.type==='signature_delta')b.signature=(b.signature||'')+d.signature;else if(d.type==='input_json_delta')b._json+=d.partial_json}
  else if(type==='content_block_stop'){const b=blocks[j.index];if(b&&b.type==='tool_use'){try{b.input=b._json?JSON.parse(b._json):(b.input||{})}catch(e){b._bad=true;b.input={}}delete b._json}}
  else if(type==='message_delta'){if(j.delta){stopReason=j.delta.stop_reason||stopReason;stopDetails=j.delta.stop_details||stopDetails}if(j.usage)for(const k in j.usage)if(j.usage[k]!=null)usage[k]=j.usage[k]}
  else if(type==='error'){const e=new Error((j.error&&j.error.message)||'stream error');e.c={s:'error',type:j.error&&j.error.type};throw e}};
 try{for(;;){const {done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true}).replace(/\r\n/g,'\n');let i;
  while((i=buf.indexOf('\n\n'))>=0){const raw=buf.slice(0,i);buf=buf.slice(i+2);let ev='',data='';for(const line of raw.split('\n')){if(line.startsWith('event:'))ev=line.slice(6).trim();else if(line.startsWith('data:'))data+=line.slice(5).replace(/^ /,'')}
   if(!data)continue;let j;try{j=JSON.parse(data)}catch(e){continue}handle(j.type||ev,j)}}}
 catch(e){/* a stopped or broken stream is still billed: keep what was used so the cost guard counts it */
  const chars=blocks.reduce((n,b)=>n+((b&&(b.text||b.thinking||b._json))||'').length,0);e.usage=Object.assign({},usage,{output_tokens:Math.max(usage.output_tokens||0,Math.ceil(chars/4))});e.model=model;throw e}
 return {blocks:blocks.filter(Boolean),usage,stopReason,stopDetails,model}}
/* What goes back into history: every block exactly as received, except what the fallback rules say to drop
   (thinking and tool calls before a mid-answer fallback switch, and the fallback marker itself) and empty text. */
function echo(blocks){const last=blocks.map(b=>b.type).lastIndexOf('fallback');const keep=new Set(['thinking','redacted_thinking','text','tool_use']);
 return blocks.filter((b,i)=>{if(b.type==='fallback')return false;if(!keep.has(b.type))return false;if(i<last&&b.type!=='text')return false;if(b.type==='text'&&!b.text)return false;return true}).map(b=>{const o=Object.assign({},b);delete o._json;delete o._bad;if(o.type==='text'&&o.citations==null)delete o.citations;return o})}
function costOf(u,model){const p=PRICE[model]||PRICE[T.model]||MODELS[CFG.model];const i=u.input_tokens||0,cw=u.cache_creation_input_tokens||0,cr=u.cache_read_input_tokens||0,o=u.output_tokens||0;
 return {in:i,cw,cr,out:o,cost:(i*p.in+cw*p.cw+cr*p.cr+o*p.out)/1e6,ctx:i+cw+cr}}
async function send(){const text=ta.value.trim();if(running)return;if(!text&&!pending.length)return;
 if(!HTTP){setStatus('local');note('This is a local preview, so nothing was sent. Publish the page to ask Claude.');return}
 if(T.last>=CFG.ctxCap||T.tot.cost>=CFG.costCap){setStatus('cap');return}
 if(['nokey','badkey','noroute'].includes(status))return;
 const atts=pending.slice();pending=[];renderPending();ta.value='';grow();
 const content=[{type:'text',text:readerState()}];
 for(const a of atts){if(a.kind==='snap'){content.push({type:'text',text:`Snapshot the reader took: ${a.label}${a.where&&a.where!==a.label?' ('+a.where+')':''}.`});content.push({type:'image',source:{type:'base64',media_type:a.mt,data:a.img}})}
  else content.push({type:'text',text:`The reader selected this text${a.where?' in '+a.where:''}:\n<selection>${a.text}</selection>`})}
 content.push({type:'text',text:text||'Tell me about what I attached.'});
 const mark=T.api.length;T.api.push({role:'user',content});
 const uv={role:'user',text,atts:atts.map(a=>a.kind==='snap'?{kind:'snap',label:a.label,thumb:a.thumb}:{kind:'sel',text:a.text,where:a.where})};T.view.push(uv);
 if(T.view.length===1)log.replaceChildren();log.appendChild(H((userHtml(uv))));log.scrollTop=log.scrollHeight;
 const bv={role:'bot',parts:[],model:T.model,refs:[]};const tot={in:0,cw:0,cr:0,out:0,cost:0};
 running=new AbortController();sendBtn.innerHTML=(`${ic('stop')}<span>Stop</span>`);sendBtn.setAttribute('aria-label','Stop the answer');liveEl=null;renderLive(bv);
 let ok=false;
 try{for(let hop=0;hop<CFG.maxHops;hop++){
   const body={model:T.model,max_tokens:CFG.maxTokens,stream:true,system:systemBlocks(),tools:TOOLS,cache_control:{type:'ephemeral'},output_config:{effort:CFG.effort},messages:T.api};
   const M=MODELS[T.model];if(M&&M.fallbacks)body.fallbacks=M.fallbacks;
   const base=bv.parts.length;
   const r=await stream(body,running.signal,blocks=>{bv.parts.length=base;for(const b of blocks)if(b&&b.type==='text')bv.parts.push({t:'text',md:b.text});renderLive(bv)});
   bv.parts.length=base;for(const b of r.blocks)if(b.type==='text'&&b.text)bv.parts.push({t:'text',md:b.text});
   const c=costOf(r.usage,r.model);['in','cw','cr','out','cost'].forEach(k=>tot[k]+=c[k]);T.last=c.ctx;if(r.model&&r.model!==T.model)bv.served=r.model;
   if(r.stopReason==='refusal'){bv.parts.push({t:'note',bad:true,text:'Claude declined to answer this one'+(r.stopDetails&&r.stopDetails.category?` (${r.stopDetails.category})`:'')+'. Try rewording it.'});break}
   if(r.stopReason==='max_tokens'&&r.blocks.some(b=>b.type==='tool_use')){bv.parts.push({t:'note',text:'The answer hit its length limit in the middle of a step, so this question was not kept. Try a narrower question.'});break}
   T.api.push({role:'assistant',content:echo(r.blocks)});
   if(r.stopReason==='max_tokens')bv.parts.push({t:'note',text:'The answer hit its length limit and was cut short.'});
   if(r.stopReason!=='tool_use'){ok=true;break}
   const calls=r.blocks.filter(b=>b.type==='tool_use');const results=[];
   for(const b of calls){const [act,out,isErr]=await runTool(b);bv.parts.push(act);renderLive(bv);results.push(Object.assign({type:'tool_result',tool_use_id:b.id,content:out},isErr?{is_error:true}:{}))}
   T.api.push({role:'user',content:results});
   if(hop===CFG.maxHops-1){bv.parts.push({t:'note',text:'Stopped after '+CFG.maxHops+' tool steps.'});T.api.length=mark}}
 }catch(e){const aborted=e.name==='AbortError';T.api.length=mark;
  if(e.usage){const c=costOf(e.usage,e.model);['in','cw','cr','out','cost'].forEach(k=>tot[k]+=c[k]);bv.partial=true}
  if(aborted)bv.parts.push({t:'note',text:'Stopped. This question was not kept in the thread.'});
  else{const c=e.c||{};if(['nokey','badkey','noroute','limit'].includes(c.s))setStatus(c.s,c.m);bv.parts.push({t:'note',bad:true,text:c.s==='nokey'?'Claude key not set, so nothing was sent.':c.s==='badkey'?'Anthropic rejected the key.':c.s==='noroute'?'The proxy route is missing on this copy.':c.s==='limit'?c.m:(c.type==='overloaded_error'||c.status>=500?'Claude is busy right now. Try again in a moment.':'Something went wrong: '+e.message)})}}
 finally{running=null;sendBtn.innerHTML=(`${ic('up')}<span>Send</span>`);sendBtn.removeAttribute('aria-label')}
 if(!ok&&T.api.length>mark&&T.api[T.api.length-1].role!=='assistant')T.api.length=mark;
 ['in','cw','cr','out','cost'].forEach(k=>T.tot[k]+=tot[k]);
 bv.cost=tot.cost;bv.use=`${fmtK(tot.cr)} cached + ${fmtK(tot.in+tot.cw)} new in, ${bv.partial?'about ':''}${fmtK(tot.out)} out · ${fmt$(tot.cost)}${bv.served?' · served by '+bv.served:''}`;
 bv.refs=refsOf(bv.parts);T.view.push(bv);
 cancelAnimationFrame(liveRAF);if(liveEl&&liveEl.isConnected)liveEl.replaceWith(H((botHtml(bv,false))));else log.appendChild(H((botHtml(bv,false))));liveEl=null;log.scrollTop=log.scrollHeight;
 persist();renderMeter();if(T.last>=CFG.ctxCap||T.tot.cost>=CFG.costCap)setStatus('cap');
 if(T.drivePath&&bv.parts.some(p=>p.tool==='save_thread'&&!p.err))toDrive(toMd()).catch(()=>{});
 ta.focus()}
function stop(){if(running)running.abort()}

/* ───────── export: Markdown download, and a copy in the owner's here.now Drive ───────── */
function toMd(){const c=context(),M=MODELS[T.model]||{};const base=location.href.split('#')[0];
 const ref=s=>String(s||'').replace(/\[\[src:([A-Za-z0-9_-]+)\]\]/g,(m,id)=>{const S=srcById(id);return S?`[${S.title}](${S.url})`:''}).replace(/\[\[([A-Za-z0-9_.:-]+)(?:\|([^\]]+))?\]\]/g,(m,id,l)=>{const t=target(id);return t?`[${l||t.short}](${base}#${t.id})`:''});
 const L=[`# Questions about: ${c.title||D.title}`,'',`- Page: ${base}`,`- Thread: ${T.id}, started ${T.created.slice(0,16).replace('T',' ')}`,`- Model: ${M.label||T.model}`,`- Cost: about ${fmt$(T.tot.cost)} (${fmtK(T.tot.cr)} cached + ${fmtK(T.tot.in+T.tot.cw)} new input tokens, ${fmtK(T.tot.out)} output tokens)`,''];
 for(const v of T.view){if(v.role==='user'){L.push('## You','');for(const a of v.atts||[])L.push(a.kind==='snap'?`_Snapshot: ${a.label}_`:`> ${a.text.replace(/\n/g,' ')}${a.where?`\n> (${a.where})`:''}`,'');if(v.text)L.push(v.text,'')}
  else{L.push('## Claude','');for(const p of v.parts){if(p.t==='text')L.push(ref(p.md),'');else if(p.t==='act')L.push('_'+p.html.replace(/<[^>]+>/g,'').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')+(p.url?` (${p.url})`:'')+'_','');else if(p.t==='note')L.push('_'+p.text+'_','')}if(v.use)L.push(`<sub>${v.use}</sub>`,'')}}
 return L.join('\n')}
function download(name,text){const a=D.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/markdown'}));a.download=name;a.className='ask-ui';D.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
function exportMd(){if(!T.view.length){note('Nothing to export yet.');return}download(`${SLUG}-thread-${T.id}.md`,toMd())}
async function sha(s){const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function toDrive(text){if(!HTTP)return {ok:false,why:'local preview'};const bytes=new TextEncoder().encode(text);
 const tryOnce=async(path,etag)=>{const body={path,size:bytes.length,contentType:'text/markdown',sha256:await sha(text)};if(etag)body.ifMatch=etag;else body.ifNoneMatch='*';
  const r=await fetch(CFG.drive.uploads,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  if(r.status===404)return {ok:false,why:'not set up on this page (no /api/drive route)'};if(r.status===401||r.status===403)return {ok:false,why:'the Drive token is not set (REPORT_THREADS_DRIVE_TOKEN under Variables)'};
  if(r.status===409||r.status===412)return {ok:false,conflict:true};if(!r.ok)return {ok:false,why:'here.now said '+r.status};
  const up=await r.json();const put=await fetch(up.uploadUrl,{method:'PUT',headers:up.headers||{'Content-Type':'text/markdown'},body:bytes});if(!put.ok)return {ok:false,why:'upload failed ('+put.status+')'};
  const f=await fetch(CFG.drive.finalize,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({uploadId:up.uploadId})});if(!f.ok)return {ok:false,why:'finalize failed ('+f.status+')'};
  let fj={};try{fj=await f.json()}catch(e){}const et=(fj.file&&(fj.file.etag||fj.file.sha256))||fj.etag||'';return {ok:true,path,etag:et}};
 const path=T.drivePath||`${CFG.drive.dir}${SLUG}/${T.id}.md`;let r=await tryOnce(path,T.driveEtag);
 if(r.conflict){const p2=`${CFG.drive.dir}${SLUG}/${T.id}-${Date.now().toString(36)}.md`;r=await tryOnce(p2,null)}
 if(r.ok){T.drivePath=r.path;T.driveEtag=r.etag||T.driveEtag;persist()}return r}
async function saveAll({download:dl=true,drive=true,announce=false}={}){const said=['kept in this browser'];
 if(!T.view.length)return {say:'Nothing to save yet.'};persist();const text=toMd();
 if(dl){download(`${SLUG}-thread-${T.id}.md`,text);said.push('downloaded as a .md file')}
 if(drive){const r=await toDrive(text);said.push(r.ok?`copied to here.now Drive at My Drive/${r.path}`:`not copied to Drive: ${r.why||'conflict'}`)}
 const say='Thread '+said.join(', ')+'.';if(announce)note(say);return {say}}
function resetThread(){if(running)return;if(T.view.length&&!confirm('Start a new thread? This one is cleared from the panel. Export it first if you want to keep it.'))return;T=newThread();store.set('thread',JSON.stringify(T));setStatus(null);if(HTTP)probe(true);renderAll();ta.focus()}

/* ───────── boot ───────── */
function init(){if(Q('.ask-sheet'))return;T=loadThread();if(!MODELS[T.model])T.model=CFG.model;build();renderMeter();
 window.__askPanel={clearStatus:()=>setStatus(null),extract,context:()=>context(),open:()=>open(true),close:()=>open(false),state:()=>({status,ctxSource:CTXSRC,thread:T,pending:pending.length,docked}),cfg:CFG,tools:TOOLS.map(t=>t.name),systemBlocks,toMd}}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init);else init();
})();
