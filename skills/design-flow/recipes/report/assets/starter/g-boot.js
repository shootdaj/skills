/* report recipe boot: figure registry, resize redraw, count-up, lights, load choreography. Keep last; it closes the inline script. */
/* ───────────────────────── registry: draw now, draw in on view ───────────────────────── */
function safe(fn){return a=>{try{const r=fn(a);if(r&&r.catch)r.catch(e=>console.error(fn.name,e))}catch(e){console.error(fn.name,e)}}}
const FIGS=[['fig-example',drawExample]]; // add ['fig-id', drawFn] per figure; fn(animate) draws into its host
function drawAll(){FIGS.forEach(([id,fn])=>safe(fn)(false))}
let lastW=innerWidth;
addEventListener('resize',()=>{hideTip();clearTimeout(window.__rz);window.__rz=setTimeout(()=>{if(Math.abs(innerWidth-lastW)<2)return;lastW=innerWidth;drawAll();slideAll()},180)});

/* ───────────────────────── boot choreography ───────────────────────── */
function countUp(){$$('[data-count]').forEach(el=>{const n=+el.dataset.count;const fmt=v=>el.dataset.comma?d3.format(',')(v):v;if(!HAS()){el.textContent=fmt(n);return}el.textContent=fmt(0);Motion.animate(0,n,{duration:1.1,delay:.85,ease:[.2,0,0,1],onUpdate:v=>el.textContent=fmt(Math.round(v))})})}
function lightsOn(sel,start,step){$$(sel).forEach((l,i)=>{if(!HAS()){l.classList.add('on');return}setTimeout(()=>l.classList.add('on'),start+i*step)})}
function boot(){
 if(!window.Motion||reduced)root.classList.remove('anim');
 drawAll();spy();slideAll();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{slideAll()});
 FIGS.forEach(([id,fn])=>{const el=document.getElementById(id);const inPanel=el.closest('.panel');
  if(HAS()&&inPanel){el.style.opacity=0}
  onView(el,()=>{if(HAS()&&inPanel)anim(el,{opacity:[0,1],transform:['translateY(18px)','none']},{duration:.5,ease:[.2,.7,.1,1]});safe(fn)(true)},.12)});
 if(!HAS()){countUp();lightsOn('.tile .led, .take .led',0,0);$$('.anim-hide').forEach(e=>e.style.opacity=1);return}
 anim($('#top'),{opacity:[0,1],transform:['translateY(-10px)','none']},{duration:.4});
 anim($$('.tab'),{opacity:[0,1],transform:['translateY(-6px)','none']},{duration:.3,delay:ST(.03,{start:.1})});
 anim($$('#headline .w'),{opacity:[0,1],transform:['translateY(22px)','none']},{duration:.55,delay:ST(.06,{start:.15}),ease:[.2,.7,.1,1]});
 anim($$('.rv0'),{opacity:[0,1],transform:['translateY(12px)','none']},{duration:.45,delay:ST(.12,{start:.55})});
 anim($$('.tile'),{opacity:[0,1],scale:[.86,1],y:[12,0]},{type:'spring',stiffness:420,damping:20,delay:ST(.07,{start:.8})});
 anim($$('.tile .ruler'),{transform:['scaleX(0)','scaleX(1)']},{duration:.5,delay:ST(.07,{start:1.0})});
 lightsOn('.tile .led',1050,140);countUp();
 anim($$('.take'),{opacity:[0,1],y:[16,0]},{type:'spring',stiffness:300,damping:22,delay:ST(.08,{start:1.35})});
 lightsOn('.take .led',1600,110);
 setTimeout(()=>{$$('#top, #headline .w, .rv0, .tile, .take').forEach(e=>{if(getComputedStyle(e).opacity==='0')e.style.opacity=1});root.classList.remove('anim')},3200)}
if(document.readyState==='complete')boot();else addEventListener('load',boot);
</script>
</body>
</html>
