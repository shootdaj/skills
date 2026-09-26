/* Design-comparison vote widget. Include with: <script src="../_vote/vote.js" data-project="my-page" data-design="d1" data-label="D1 Name"></script>
   Picks are per component (radio across designs) + overall. Persists to localStorage and to a local vote server when it is running. */
(function(){
  const me=document.currentScript||{dataset:{}}; const design=me.dataset.design||'unknown'; const label=me.dataset.label||design;
  const COMPONENTS=[['overall','Overall design'],['hero','Hero + verdict'],['stats','Headline numbers'],['takeaways','Takeaways'],['arch','Architecture view'],['matrix','Readiness view'],['build','Build plan'],['nav','Navigation'],['motion','Motion + feel'],['theme','Theme + type']];
  const KEY='design-votes-'+(me.dataset.project||'default'), API=me.dataset.api||'http://127.0.0.1:7331'; let votes=load(), online=false, open=false;
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(votes))}catch(e){}}
  const css=`
  .sav-tab{position:fixed;right:0;top:50%;transform:translateY(-50%) rotate(180deg);writing-mode:vertical-rl;z-index:2147483000;background:#111;color:#FFD400;border:2px solid #FFD400;border-right:0;border-radius:0 10px 10px 0;padding:12px 8px;font:800 12px/1 system-ui,sans-serif;letter-spacing:.14em;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.35)}
  .sav-tab:hover{background:#FFD400;color:#111}
  .sav{position:fixed;right:14px;top:50%;transform:translateY(-50%) translateX(16px);opacity:0;pointer-events:none;transition:.22s cubic-bezier(.2,0,0,1);z-index:2147483001;width:300px;max-height:86vh;overflow:auto;background:#111;color:#F5F5F5;border:2px solid #FFD400;border-radius:14px;padding:14px;font:500 13px/1.4 system-ui,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.5)}
  .sav.open{opacity:1;transform:translateY(-50%);pointer-events:auto}
  .sav h4{margin:0 0 2px;font:800 15px/1.2 system-ui;color:#fff}.sav .sub{color:#aaa;font-size:12px;margin-bottom:10px}
  .sav .sub b{color:#FFD400}
  .sav .row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid #2a2a2a}
  .sav .row span{flex:1}.sav .row small{display:block;color:#888;font-size:12px}
  .sav button{font:800 12px system-ui;letter-spacing:.04em;border-radius:999px;border:2px solid #FFD400;background:transparent;color:#FFD400;padding:7px 12px;cursor:pointer;min-height:32px}
  .sav button:hover{background:#2a2400}.sav button.on{background:#FFD400;color:#111}
  .sav .big{width:100%;margin:6px 0 10px;padding:12px;font-size:14px;min-height:44px}
  .sav .foot{display:flex;gap:8px;margin-top:10px}.sav .foot button{flex:1;border-color:#555;color:#ddd;font-weight:600}
  .sav .close{position:absolute;right:10px;top:10px;border:0;color:#aaa;background:transparent;font-size:18px;min-height:0;padding:2px 6px}
  .sav .picked{color:#FFD400;font-weight:700}`;
  if(!window.DOMPurify){const dp=document.createElement('script');dp.src='https://cdn.jsdelivr.net/npm/dompurify@3.1.7/dist/purify.min.js';dp.onload=()=>{if(open)render()};document.head.appendChild(dp)}
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const tab=document.createElement('button');tab.className='sav-tab';tab.type='button';tab.textContent='VOTE · '+design.toUpperCase();tab.setAttribute('aria-label','Open design vote panel');
  const panel=document.createElement('aside');panel.className='sav';panel.setAttribute('aria-label','Design vote panel');
  document.body.appendChild(tab);document.body.appendChild(panel);
  tab.onclick=()=>{open=!open;panel.classList.toggle('open',open);if(open)sync()};
  function mine(c){return votes[c]&&votes[c].design===design}
  function setHTML(el,html){if(window.DOMPurify){el.replaceChildren(DOMPurify.sanitize(String(html),{RETURN_DOM_FRAGMENT:true}));}else{el.textContent=String(html).replace(/<[^>]*>/g,' ');}}
  const escH=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(){
    const rows=COMPONENTS.filter(([c])=>c!=='overall').map(([c,name])=>{const v=votes[c];const who=v?(v.design===design?'<span class="picked">picked: this one</span>':'picked: '+(v.label||v.design)):'no pick yet';return `<div class="row"><span>${name}<small>${who}</small></span><button type="button" data-c="${c}" class="${mine(c)?'on':''}">${mine(c)?'Picked':'Pick'}</button></div>`}).join('');
    const ov=votes.overall;const ovWho=ov?(ov.design===design?'this one':(ov.label||ov.design)):'none yet';
    setHTML(panel,`<button class="close" type="button" aria-label="Close">×</button><h4>${escH(label)}</h4><div class="sub">Overall pick so far: <b>${ovWho}</b> · ${online?'saved to Claude':'saved in browser only'}</div>
      <button type="button" class="big ${mine('overall')?'on':''}" data-c="overall">${mine('overall')?'★ Picked as overall favourite':'Pick this design overall'}</button>
      <div style="font:800 12px system-ui;letter-spacing:.12em;color:#888;margin:4px 0 2px">PICK PER ELEMENT</div>${rows}
      <div class="foot"><button type="button" data-act="copy">Copy my picks</button><button type="button" data-act="clear">Clear all</button></div>`);
    panel.querySelector('.close').onclick=()=>{open=false;panel.classList.remove('open')};
    panel.querySelectorAll('button[data-c]').forEach(b=>b.onclick=()=>toggle(b.dataset.c));
    panel.querySelector('[data-act=copy]').onclick=copy; panel.querySelector('[data-act=clear]').onclick=clearAll;
  }
  async function toggle(c){const unset=mine(c);if(unset)delete votes[c];else votes[c]={design,label,ts:Date.now()};save();render();try{const r=await fetch(API+'/vote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(unset?{component:c,design:null}:{component:c,design,label,ts:Date.now()})});if(r.ok){votes=await r.json();online=true;save();render()}}catch(e){online=false;render()}}
  async function sync(){try{const r=await fetch(API+'/votes',{cache:'no-store'});if(r.ok){votes=await r.json();online=true;save();render();return}}catch(e){}online=false;render()}
  function copy(){const lines=COMPONENTS.map(([c,n])=>`${n}: ${votes[c]?(votes[c].label||votes[c].design):'—'}`).join('\n');navigator.clipboard&&navigator.clipboard.writeText(lines);const b=panel.querySelector('[data-act=copy]');b.textContent='Copied';setTimeout(()=>b.textContent='Copy my picks',1200)}
  async function clearAll(){if(!confirm('Clear all picks across every design?'))return;for(const [c] of COMPONENTS){if(votes[c]){try{await fetch(API+'/vote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({component:c,design:null})})}catch(e){}}}votes={};save();render()}
  render();sync();
})();
