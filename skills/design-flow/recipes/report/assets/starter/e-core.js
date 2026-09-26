/* report recipe core: helpers, tooltip, motion guard, theme doors, palette picker, chips, panels, tabs, scroll spy, in-view, d3 helpers.
   Expects the ids and classes in c-body.html. Report-specific code goes in f-figures.js. */
/* ───────────────────────── helpers ───────────────────────── */
const KEY=document.documentElement.dataset.key||'report';
/* setHTML: sanitize markup with DOMPurify, then insert. Falls back to plain text if DOMPurify did not load. */
function setHTML(el,html){if(window.DOMPurify){el.replaceChildren(DOMPurify.sanitize(String(html),{RETURN_DOM_FRAGMENT:true}));}else{el.textContent=String(html).replace(/<[^>]*>/g,' ');}}

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const HAS=()=>!!window.Motion&&!reduced;
const ST=(n,o)=>(window.Motion&&Motion.stagger)?Motion.stagger(n,o):0;
const tip=$('#tip');
function showTip(html,x,y){setHTML(tip,html);tip.classList.add('show');const r=tip.getBoundingClientRect();let L=x+14,T=y+16;if(L+r.width>innerWidth-12)L=x-r.width-14;if(T+r.height>innerHeight-10)T=y-r.height-14;tip.style.left=Math.max(8,L)+'px';tip.style.top=Math.max(8,T)+'px'}
function hideTip(){tip.classList.remove('show')}
function tipOn(el,html){el.addEventListener('pointerenter',e=>showTip(html(),e.clientX,e.clientY));el.addEventListener('pointermove',e=>showTip(html(),e.clientX,e.clientY));el.addEventListener('pointerleave',hideTip);el.addEventListener('focus',()=>{const r=el.getBoundingClientRect();showTip(html(),r.left,r.bottom)});el.addEventListener('blur',hideTip)}
function anim(el,kf,opt){if(!HAS()||!el||(el.length===0))return Promise.resolve();try{let clear=null;if(opt&&opt.clear){clear=opt.clear;opt=Object.assign({},opt);delete opt.clear}const a=Motion.animate(el,kf,opt);const f=(a&&a.finished)||Promise.resolve();
 if(kf.transform||kf.scale||kf.y||kf.x){const list=(el.length!=null&&!(el instanceof Element))?[...el]:[el];f.then(()=>list.forEach(e=>{if(e&&e.style&&!(e.classList&&e.classList.contains('door')))e.style.transform=''})).catch(()=>{})}
 if(clear){const list=(el.length!=null&&!(el instanceof Element))?[...el]:[el];f.then(()=>list.forEach(x=>clear.forEach(p=>{if(x&&x.style)x.style[p]=''}))).catch(()=>{})}
 return f}catch(e){return Promise.resolve()}}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const topH=()=>$('#top').getBoundingClientRect().height;
const stLabel={ready:'Ready',partial:'Partial',missing:'Missing',na:'n/a'};
const LEDK={ready:'ok',partial:'part',missing:'miss',na:'off',exists:'ok',new:'new',later:'off',confirm:'off'};
const led=(k,on=true)=>`<span class="led ${k}${on?' on':''}"></span>`;
const stWord={exists:'Exists',new:'To build',later:'Later'};
const sLed=(g,k,x,y,r=4.5)=>{const c=g.append('circle').attr('class','sled '+k).attr('cx',x).attr('cy',y).attr('r',r).style('fill',`var(--${k==='new'?'red':k})`);if(k==='new')g.append('circle').attr('class','sbeacon').attr('cx',x).attr('cy',y).attr('r',r);return c};

/* ───────────────────────── theme: D6 doors ───────────────────────── */
function renderThemeBtn(){const d=root.dataset.theme!=='light';$('#themeUse').setAttribute('href',d?'#i-sun':'#i-moon');$('#themeBtn').setAttribute('aria-label',d?'Switch to light theme':'Switch to dark theme')}
renderThemeBtn();
let themeBusy=false;
$('#themeBtn').addEventListener('click',async()=>{if(themeBusy)return;themeBusy=true;const n=root.dataset.theme==='light'?'dark':'light';
 const L=$('#doorL'),R=$('#doorR');const cs=getComputedStyle(root);const bg=cs.getPropertyValue('--txt').trim(),fg=cs.getPropertyValue('--bg').trim();[L,R].forEach(d=>{d.style.background=bg;d.style.color=fg});
 if(HAS()){await Promise.all([anim(L,{transform:['translateX(-101%)','translateX(0%)']},{duration:.4,ease:[.7,0,.3,1]}),anim(R,{transform:['translateX(101%)','translateX(0%)']},{duration:.4,ease:[.7,0,.3,1]})])}
 root.dataset.theme=n;try{localStorage.setItem(KEY+'-theme',n)}catch(e){}renderThemeBtn();dispatchEvent(new CustomEvent('themechange'));
 if(HAS()){await wait(90);await Promise.all([anim(L,{transform:['translateX(0%)','translateX(-101%)']},{duration:.5,ease:[.7,0,.3,1]}),anim(R,{transform:['translateX(0%)','translateX(101%)']},{duration:.5,ease:[.7,0,.3,1]})])}
 L.style.transform='translateX(-101%)';R.style.transform='translateX(101%)';themeBusy=false});

/* ───────────────────────── palette picker ───────────────────────── */
const pal=$('#pal');
function renderPal(){const p=root.dataset.palette||'plum';$$('.pal-menu button').forEach(b=>b.setAttribute('aria-checked',b.dataset.pal===p))}
function setPalette(p){root.dataset.palette=p;try{localStorage.setItem(KEY+'-palette',p)}catch(e){}
 if(p==='sand'&&root.dataset.theme!=='light'){root.dataset.theme='light';try{localStorage.setItem(KEY+'-theme','light')}catch(e){}renderThemeBtn()}
 renderPal();dispatchEvent(new CustomEvent('themechange'))}
function palOpen(v){pal.classList.toggle('open',v);$('#palBtn').setAttribute('aria-expanded',v);if(v){const c=$('.pal-menu [aria-checked="true"]')||$('.pal-menu button');c.focus();anim($('.pal-menu'),{opacity:[0,1],y:[-6,0]},{duration:.2})}}
$('#palBtn').addEventListener('click',e=>{e.stopPropagation();palOpen(!pal.classList.contains('open'))});
$$('.pal-menu button').forEach(b=>b.addEventListener('click',()=>{setPalette(b.dataset.pal);palOpen(false);$('#palBtn').focus()}));
$('.pal-menu').addEventListener('keydown',e=>{const bs=$$('.pal-menu button');const i=bs.indexOf(document.activeElement);if(e.key==='ArrowDown'){e.preventDefault();bs[(i+1)%bs.length].focus()}if(e.key==='ArrowUp'){e.preventDefault();bs[(i-1+bs.length)%bs.length].focus()}});
document.addEventListener('click',e=>{if(!pal.contains(e.target))palOpen(false)});
addEventListener('keydown',e=>{if(e.key==='Escape'&&pal.classList.contains('open')){palOpen(false);$('#palBtn').focus()}});
renderPal();
addEventListener('themechange',()=>{setTimeout(()=>{if(typeof slideAll==='function')slideAll()},30)});

/* ───────────────────────── chips: sliding pill ───────────────────────── */
function slide(group){if(!group||!group.hasAttribute('data-slide'))return;let ind=group.querySelector('.pind');if(!ind){ind=document.createElement('span');ind.className='pind';group.prepend(ind)}
 const on=group.querySelector('.chip[aria-pressed="true"]');if(!on||!on.offsetWidth){ind.style.width='0px';return}
 group.style.setProperty('--pl',getComputedStyle(on).getPropertyValue('--lc').trim()||'');ind.style.left=on.offsetLeft+'px';ind.style.top=on.offsetTop+'px';ind.style.width=on.offsetWidth+'px';ind.style.height=on.offsetHeight+'px'}
function press(group,btn){$$('.chip',group).forEach(c=>c.setAttribute('aria-pressed',c===btn));slide(group);if(HAS())anim(btn,{scale:[.92,1]},{type:'spring',stiffness:500,damping:15})}
function slideAll(){$$('.chips[data-slide]').forEach(slide)}
if(!CSS.supports||!CSS.supports('left','1px'))$$('.chips').forEach(c=>c.classList.add('noslide'));

/* ───────────────────────── panels ───────────────────────── */
const PANELS=$$('.panel');
function setOpen(p,open,instant){const pb=$('.pb',p),btn=$('.ph',p);if(open===p.classList.contains('open'))return;btn.setAttribute('aria-expanded',open);
 if(instant||!HAS()){p.classList.toggle('open',open);pb.style.height=open?'':'0px';pb.inert=!open;if(open)setTimeout(slideAll,30);return}
 if(open){pb.inert=false;pb.style.height='0px';p.classList.add('open');const h=pb.scrollHeight;pb.style.height='0px';pb.offsetHeight;pb.style.height=h+'px';
  const done=e=>{if(e.target!==pb||e.propertyName!=='height')return;pb.style.height='';pb.removeEventListener('transitionend',done)};pb.addEventListener('transitionend',done);
  anim($('.chev',p),{transform:['rotate(0deg)','rotate(200deg)','rotate(180deg)']},{duration:.45});setTimeout(slideAll,60)}
 else{pb.style.height=pb.scrollHeight+'px';pb.offsetHeight;p.classList.remove('open');pb.style.height='0px';pb.inert=true;anim($('.chev',p),{transform:['rotate(180deg)','rotate(-20deg)','rotate(0deg)']},{duration:.45})}}
PANELS.forEach(p=>{const pb=$('.pb',p);if(!p.classList.contains('open')){pb.style.height='0px';pb.inert=true}$('.ph',p).addEventListener('click',()=>setOpen(p,!p.classList.contains('open')))});
$('#expandAll').onclick=()=>PANELS.forEach(p=>setOpen(p,true));
$('#collapseAll').onclick=()=>PANELS.forEach(p=>setOpen(p,false));

/* ───────────────────────── tabs, scroll spy, progress ───────────────────────── */
const SECTS=[$('#overview'),...PANELS];
const tabs=$('#tabs');
SECTS.forEach(s=>{const b=document.createElement('button');b.type='button';b.className='tab';b.dataset.id=s.id;b.style.setProperty('--lc',`var(--${s.dataset.hue||'c1'})`);
 setHTML(b,`<span class="n">${s.dataset.no}</span>${s.dataset.title}${s.dataset.cnt?`<span class="c">${led(s.dataset.led)}${s.dataset.cnt}</span>`:''}`);
 b.setAttribute('aria-label',`${s.dataset.no} ${s.dataset.title}${s.dataset.cntl?', '+s.dataset.cntl:''}`);if(s.dataset.cntl)b.title=s.dataset.cntl;b.onclick=()=>go(s.id);tabs.appendChild(b)});
function go(id){const s=document.getElementById(id);if(!s)return;hideTip();if(s.classList.contains('panel'))setOpen(s,true);
 requestAnimationFrame(()=>{const y=id==='overview'?0:s.getBoundingClientRect().top+scrollY-topH()-8;scrollTo({top:y,behavior:reduced?'auto':'smooth'})})}
let curTab='';
function spy(){let cur=SECTS[0].id;const lim=topH()+90;SECTS.forEach(s=>{if(s.getBoundingClientRect().top<=lim)cur=s.id});
 if(cur!==curTab){curTab=cur;$$('.tab').forEach(t=>t.setAttribute('aria-current',t.dataset.id===cur));const t=$(`.tab[data-id="${cur}"]`);if(t&&tabs.scrollWidth>tabs.clientWidth)tabs.scrollTo({left:t.offsetLeft-tabs.clientWidth/2+t.offsetWidth/2,behavior:reduced?'auto':'smooth'})}
 const max=root.scrollHeight-innerHeight;$('#prog').style.transform=`scaleX(${max>0?clamp(scrollY/max):0})`;
 $('#totop').classList.toggle('show',scrollY>700)}
addEventListener('scroll',()=>requestAnimationFrame(spy),{passive:true});
$('#totop').onclick=()=>scrollTo({top:0,behavior:reduced?'auto':'smooth'});
$$('.tile[data-go]').forEach(t=>t.addEventListener('click',e=>{e.preventDefault();go(t.dataset.go)}));

/* ───────────────────────── in-view helper ───────────────────────── */
function onView(el,cb,amount){if(!el)return;let seen=false;const fire=()=>{if(seen)return;seen=true;cb()};
 if(window.Motion&&Motion.inView){try{Motion.inView(el,()=>{fire()},{amount:amount||.15});return}catch(e){}}
 if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){fire();io.disconnect()}},{threshold:amount||.15});io.observe(el)}else fire()}
/* LEDs start pulsing when their section enters */
SECTS.forEach(s=>onView(s,()=>s.classList.add('live'),.01));

/* ───────────────────────── diagram helpers (D6) ───────────────────────── */
const uid=(()=>{let n=0;return p=>p+(++n)})();
function mkSvg(host,w,h,label){host.replaceChildren();return d3.select(host).append('svg').attr('width',w).attr('height',h).attr('role','img').attr('aria-label',label)}
function arrows(svg){const id=uid('ar');const defs=svg.append('defs');[['ink','mk-ink'],['red','mk-red'],['grey','mk-grey']].forEach(([n,c])=>defs.append('marker').attr('id',id+n).attr('class',c).attr('viewBox','0 0 10 10').attr('refX',9).attr('refY',5).attr('markerWidth',7).attr('markerHeight',7).attr('orient','auto-start-reverse').append('path').attr('d','M0,0 L10,5 L0,10 z'));return k=>`url(#${id}${k==='new'?'red':(k==='later'||k==='confirm')?'grey':'ink'})`}
function act(sel,label,fn){sel.attr('tabindex',0).attr('role','button').attr('aria-label',label).on('click.a',fn).on('keydown.a',function(e,d){if(e.key==='Enter'||e.key===' '){e.preventDefault();fn.call(this,e,d)}})}
function tipD(sel,html){sel.on('pointerenter.t pointermove.t',(e,d)=>showTip(html(d),e.clientX,e.clientY)).on('pointerleave.t',hideTip).on('focus.t',function(e,d){const r=this.getBoundingClientRect();showTip(html(d),r.left,r.bottom)}).on('blur.t',hideTip)}
function detail(id,h){const el=document.getElementById(id);if(!el)return;setHTML(el,h);anim(el,{opacity:[0,1],transform:['translateY(4px)','none']},{duration:.25})}
function wrap(sel,width,maxLines){sel.each(function(){const t=d3.select(this);const words=t.text().split(/\s+/);const x=t.attr('x');const lh=+(t.attr('data-lh')||15);t.text(null);let line=[],ts=t.append('tspan').attr('x',x),n=1;
 for(const w of words){line.push(w);ts.text(line.join(' '));if(ts.node().getComputedTextLength()>width&&line.length>1){line.pop();ts.text(line.join(' '));if(maxLines&&n>=maxLines){ts.text(ts.text()+'…');return}line=[w];ts=t.append('tspan').attr('x',x).attr('dy',lh).text(w);n++}}
 if(ts.node().getComputedTextLength()>width){let s=ts.text();while(s.length>3&&ts.node().getComputedTextLength()>width){s=s.slice(0,-1);ts.text(s+'…')}}})}
function fit(sel,width){sel.each(function(){const t=d3.select(this);let s=t.text();if(this.getComputedTextLength()<=width)return;while(s.length>3&&this.getComputedTextLength()>width){s=s.slice(0,-1);t.text(s+'…')}})}
function fadeIn(sel,a,step){if(a&&HAS())sel.style('opacity',0).transition().delay((d,i)=>60+i*(step||40)).duration(320).style('opacity',1).on('end',function(){d3.select(this).style('opacity',null)})}
function drawEdgesIn(sel,a){if(!(a&&HAS()))return;sel.each(function(d,i){const p=d3.select(this);const L=this.getTotalLength?this.getTotalLength():0;if(!L)return;p.style('stroke-dasharray',`${L} ${L}`).style('stroke-dashoffset',L).transition().delay(150+i*50).duration(520).ease(d3.easeCubicOut).style('stroke-dashoffset',0).on('end',()=>p.style('stroke-dasharray',null).style('stroke-dashoffset',null))})}
const elk=window.ELK?new ELK():null;
function elkLayout(children,edges,opts){return elk.layout({id:'root',layoutOptions:Object.assign({'elk.algorithm':'layered','elk.direction':'RIGHT','elk.edgeRouting':'ORTHOGONAL','elk.layered.spacing.nodeNodeBetweenLayers':'56','elk.spacing.nodeNode':'22','elk.spacing.edgeLabel':'3','elk.spacing.edgeNode':'14','elk.layered.spacing.edgeNodeBetweenLayers':'14','elk.edgeLabels.placement':'CENTER','elk.layered.nodePlacement.strategy':'BRANDES_KOEPF'},opts||{}),children,edges})}
function elkPath(e){const s=e.sections&&e.sections[0];if(!s)return '';const pts=[s.startPoint,...(s.bendPoints||[]),s.endPoint];return 'M'+pts.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' L')}
const TXTW=(s,px)=>s.length*px;
