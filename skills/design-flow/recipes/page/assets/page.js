/* page recipe behaviours: boot choreography (the report's, without figures), the lightbox, and one block per kind: proof, approval
   (keep or strike, saved per page), blind judging (scores per entry, names hidden until revealed, saved per page), gallery.
   Runs after e-core.js (the report shell: $, $$, setHTML, esc, anim, HAS, ST, spy, slideAll, press, onView, showTip) and after the
   optional glossary part. PAGE is written by page-build.mjs: {kind, key, lightbox:[{src, cap, url}]}. */
/* ───────────────────────── lightbox ───────────────────────── */
const LB=$('#lb'),LBI=$('#lbImg'),LBC=$('#lbCap');let lbAt=-1,lbFrom=null;
function lbShow(i){const it=PAGE.lightbox[i];if(!it||!it.src)return;lbAt=i;LBI.src=it.src;LBI.alt=it.cap||'';setHTML(LBC,esc(it.cap||'')+(it.url?`<span class="u">${esc(it.url)}</span>`:''));
 if(LB.hidden){lbFrom=document.activeElement;LB.hidden=false;document.body.classList.add('lb-open');anim(LB,{opacity:[0,1]},{duration:.2});$('.lb-x').focus()}}
function lbClose(){if(LB.hidden)return;LB.hidden=true;document.body.classList.remove('lb-open');if(lbFrom&&lbFrom.focus)lbFrom.focus();lbFrom=null}
function lbStep(d){const n=PAGE.lightbox.length;for(let k=1;k<=n;k++){const j=(lbAt+d*k+n*k)%n;if(PAGE.lightbox[j]&&PAGE.lightbox[j].src){lbShow(j);return}}}
$$('.shot-link').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();lbShow(+a.dataset.lb)}));
$('.lb-x').onclick=lbClose;$('.lb-prev').onclick=()=>lbStep(-1);$('.lb-next').onclick=()=>lbStep(1);
LB.addEventListener('click',e=>{if(e.target===LB)lbClose()});
addEventListener('keydown',e=>{if(LB.hidden)return;if(e.key==='Escape')lbClose();if(e.key==='ArrowRight')lbStep(1);if(e.key==='ArrowLeft')lbStep(-1)});

/* ───────────────────────── saved state per page ───────────────────────── */
const load=k=>{try{return JSON.parse(localStorage.getItem(KEY+'-'+k)||'null')||{}}catch(e){return{}}};
const save=(k,v)=>{try{localStorage.setItem(KEY+'-'+k,JSON.stringify(v))}catch(e){}};
function exportText(name,text,btn){let copied=false;if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(()=>{copied=true}).catch(()=>{})}
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();a.remove();
 if(btn){const r=btn.getBoundingClientRect();showTip('<b>Exported</b>'+esc(name)+' downloaded'+(copied?', copied to the clipboard':''),r.left,r.bottom);setTimeout(hideTip,1800)}}

/* ───────────────────────── approval: keep or strike ───────────────────────── */
if(PAGE.kind==='approval'){
 const S=load('approval');const cards=$$('.ap');
 const word={keep:'Kept',strike:'Struck'};
 function paint(c){const v=S[c.dataset.id]||'';c.classList.toggle('keep',v==='keep');c.classList.toggle('strike',v==='strike');
  $('.btn.keep',c).setAttribute('aria-pressed',v==='keep');$('.btn.strike',c).setAttribute('aria-pressed',v==='strike');
  const st=$('.ap-state',c);const led=$('.led',st);led.className='led on '+(v==='keep'?'ok':v==='strike'?'miss':'off');$('.w',st).textContent=word[v]||'Open'}
 function sum(){const n=cards.length,k=cards.filter(c=>S[c.dataset.id]==='keep').length,s=cards.filter(c=>S[c.dataset.id]==='strike').length;
  setHTML($('#apsum'),`<span><b>${k}</b> kept</span><span><b>${s}</b> struck</span><span><b>${n-k-s}</b> open of ${n}</span>`)}
 cards.forEach(c=>{paint(c);['keep','strike'].forEach(v=>$('.btn.'+v,c).addEventListener('click',()=>{S[c.dataset.id]=S[c.dataset.id]===v?'':v;save('approval',S);paint(c);sum();anim(c,{scale:[.995,1]},{duration:.25})}))});
 $('#apExport').onclick=e=>exportText(KEY+'-decisions.json',JSON.stringify({page:KEY,decided:new Date().toISOString(),kept:cards.filter(c=>S[c.dataset.id]==='keep').map(c=>c.dataset.id),struck:cards.filter(c=>S[c.dataset.id]==='strike').map(c=>c.dataset.id),open:cards.filter(c=>!S[c.dataset.id]).map(c=>c.dataset.id)},null,1),e.currentTarget);
 $('#apReset').onclick=()=>{cards.forEach(c=>delete S[c.dataset.id]);save('approval',S);cards.forEach(paint);sum()};
 sum()}

/* ───────────────────────── judging: blind scores ───────────────────────── */
if(PAGE.kind==='judging'){
 const S=load('judging');const cards=$$('.jd');const btn=$('#jdReveal');
 function paint(c){const v=S[c.dataset.id]||0;$$('.chip',c).forEach(ch=>ch.setAttribute('aria-pressed',+ch.dataset.score===v))}
 function sum(){const done=cards.filter(c=>S[c.dataset.id]).length;setHTML($('#jdsum'),`<span><b>${done}</b> of ${cards.length} scored</span>${done?`<span>top: <b>${esc(cards.map(c=>[S[c.dataset.id]||0,$('.fgno',c).textContent]).sort((a,b)=>b[0]-a[0])[0][1])}</b></span>`:''}`)}
 function reveal(v){S._revealed=v;save('judging',S);btn.setAttribute('aria-pressed',v);$('.lbl-r',btn).textContent=v?'Hide names':'Reveal names';cards.forEach(c=>{$('.jd-name',c).hidden=!v})}
 cards.forEach(c=>{paint(c);$$('.chip',c).forEach(ch=>ch.addEventListener('click',()=>{const g=ch.closest('.chips');S[c.dataset.id]=S[c.dataset.id]===+ch.dataset.score?0:+ch.dataset.score;save('judging',S);paint(c);press(g,S[c.dataset.id]?ch:null);sum()}))});
 btn.onclick=()=>reveal(!S._revealed);
 $('#jdExport').onclick=e=>exportText(KEY+'-scores.json',JSON.stringify({page:KEY,scored:new Date().toISOString(),entries:cards.map(c=>({entry:$('.fgno',c).textContent,id:c.dataset.id,name:c.dataset.name,score:S[c.dataset.id]||0}))},null,1),e.currentTarget);
 $('#jdReset').onclick=()=>{cards.forEach(c=>delete S[c.dataset.id]);save('judging',S);cards.forEach(c=>{paint(c);slide($('.chips',c))});sum()};
 reveal(!!S._revealed);sum()}

/* ───────────────────────── boot: the report's choreography without figures ───────────────────────── */
addEventListener('resize',()=>{hideTip();clearTimeout(window.__rz);window.__rz=setTimeout(slideAll,180)});
function boot(){
 if(!window.Motion||reduced)root.classList.remove('anim');
 spy();slideAll();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(slideAll);
 if(!HAS())return;
 anim($('#top'),{opacity:[0,1],transform:['translateY(-10px)','none']},{duration:.4});
 anim($$('.tab'),{opacity:[0,1],transform:['translateY(-6px)','none']},{duration:.3,delay:ST(.03,{start:.1})});
 anim($$('.rv0'),{opacity:[0,1],transform:['translateY(12px)','none']},{duration:.45,delay:ST(.12,{start:.15})});
 anim($$('.opening li'),{opacity:[0,1],y:[10,0]},{type:'spring',stiffness:300,damping:22,delay:ST(.08,{start:.6})});
 $$('.panel.open .fg, .panel.open .ap, .panel.open .jd, .panel.open .gc').forEach((el,i)=>{if(i>5)return;el.style.opacity=0;onView(el,()=>anim(el,{opacity:[0,1],transform:['translateY(14px)','none']},{duration:.45,ease:[.2,.7,.1,1]}),.08)});
 setTimeout(()=>{$$('#top, .rv0, .opening li, .fg, .ap, .jd, .gc').forEach(e=>{if(getComputedStyle(e).opacity==='0')e.style.opacity=1});root.classList.remove('anim')},3200)}
if(document.readyState==='complete')boot();else addEventListener('load',boot);
