/* glossary hover: wraps glossary terms in body text, bullets, captions and figure labels (not headings, links, code or buttons)
   with a dotted underline. Hover, keyboard focus or a tap shows a small popover with the term and its definition; Escape,
   moving away or a tap elsewhere closes it. Present only when assets/glossary.mjs found the project's glossary. */
(function(){
 if(typeof GLOSSARY==='undefined'||!GLOSSARY||!GLOSSARY.terms||!GLOSSARY.terms.length)return;
 window.REPORT_GLOSSARY=GLOSSARY; // for other page parts, such as an ask panel, to read
 const st=document.createElement('style');
 st.textContent=`.gl-term{text-decoration:underline dotted;text-decoration-thickness:1.5px;text-underline-offset:3px;text-decoration-color:var(--txt2);cursor:help;border-radius:3px}
.gl-term:hover,.gl-term:focus-visible{text-decoration-color:var(--red)}
.gl-term:focus-visible{outline:2px solid var(--red);outline-offset:1px}
tspan.gl-term:focus{outline:none;fill:var(--red-txt)}
#gl-pop{position:fixed;left:0;top:0;z-index:210;max-width:min(280px,calc(100vw - 16px));padding:10px 12px;border-radius:10px;background:var(--s2);border:1px solid var(--line2);color:var(--txt);font:400 13.5px/1.45 var(--f);font-style:normal;box-shadow:0 12px 30px -10px rgba(0,0,0,.5);pointer-events:none;opacity:0;transform:translateY(4px);transition:opacity .12s,transform .12s}
#gl-pop.show{opacity:1;transform:none}
#gl-pop b{display:block;font:700 13.5px/1.3 var(--f);font-style:normal;margin-bottom:3px}`;
 document.head.appendChild(st);
 const pop=document.createElement('div');pop.id='gl-pop';pop.setAttribute('role','tooltip');document.body.appendChild(pop);
 const ft=document.querySelector('footer');if(ft){const s=document.createElement('span');s.className='gl-src';s.textContent='Glossary: '+GLOSSARY.source;ft.appendChild(s)}

 /* index: every name and alias points at its entry; names with two capitals or a digit (acronyms, codes) match case exactly */
 const norm=s=>s.toLowerCase().replace(/\s+/g,' ');
 const byKey=new Map(),names=[];
 GLOSSARY.terms.forEach((e,i)=>[e.t,...(e.a||[])].forEach(n=>{const k=norm(n);if(!byKey.has(k)){byKey.set(k,{i,exact:/[A-Z][^A-Z]*[A-Z]|\d/.test(n)?n:null});names.push(n)}}));
 names.sort((a,b)=>b.length-a.length);
 const escR=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+');
 const re=new RegExp(`(?<![\\p{L}\\p{N}_-])(${names.map(escR).join('|')})(s|es)?(?![\\p{L}\\p{N}_-])`,'giu');
 const SKIP='h1,h2,h3,h4,h5,h6,a,code,pre,button,script,style,textarea,input,select,label,.top,.tip,.doors,.fg-h,.gl-term,#gl-pop,.sr,[contenteditable]';
 const SVGNS='http://www.w3.org/2000/svg';
 function wrapNode(tn){const txt=tn.nodeValue,svg=tn.parentNode instanceof SVGElement;let m,last=0,frag=null;re.lastIndex=0;
  while((m=re.exec(txt))){const hit=byKey.get(norm(m[1]));if(!hit||(hit.exact&&hit.exact!==m[1].replace(/\s+/g,' ')))continue;
   frag=frag||document.createDocumentFragment();if(m.index>last)frag.appendChild(document.createTextNode(txt.slice(last,m.index)));
   const el=svg?document.createElementNS(SVGNS,'tspan'):document.createElement('span');el.setAttribute('class','gl-term');el.setAttribute('tabindex','0');el.setAttribute('data-gl',hit.i);el.textContent=m[0];frag.appendChild(el);last=m.index+m[0].length}
  if(!frag)return;if(last<txt.length)frag.appendChild(document.createTextNode(txt.slice(last)));
  /* in a flex or grid parent (a figure caption, say) keep the sentence one item so the wrapped word does not split off */
  if(!svg&&/flex|grid/.test(getComputedStyle(tn.parentNode).display)){const box=document.createElement('span');box.appendChild(frag);frag=box}
  tn.parentNode.replaceChild(frag,tn)}
 function scan(el){if(el.nodeType===3){const p=el.parentElement;if(p&&!p.closest(SKIP)&&el.nodeValue.trim())wrapNode(el);return}
  if(el.nodeType!==1||el.closest(SKIP))return;
  const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;return(!p||!n.nodeValue.trim()||p.closest(SKIP))?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});
  const list=[];let n;while((n=w.nextNode()))list.push(n);list.forEach(wrapNode)}
 const host=document.querySelector('main')||document.body;
 /* figures redraw on load, resize and theme change, and detail panels refill on click: wrap whatever lands */
 let pending=new Set(),raf=0;
 const mo=new MutationObserver(rs=>{rs.forEach(r=>r.addedNodes.forEach(n=>pending.add(n)));if(!raf)raf=requestAnimationFrame(flush)});
 function flush(){raf=0;mo.disconnect();pending.forEach(n=>{if(n.isConnected)scan(n)});pending.clear();mo.observe(host,{childList:true,subtree:true})}
 scan(host);mo.observe(host,{childList:true,subtree:true});

 /* popover */
 let cur=null,hideT=0;
 const termOf=t=>t&&t.closest?t.closest('.gl-term'):null;
 function place(el){const r=el.getBoundingClientRect(),p=pop.getBoundingClientRect();const L=Math.min(Math.max(8,r.left),innerWidth-p.width-8);let T=r.bottom+8;if(T+p.height>innerHeight-8)T=r.top-p.height-8;pop.style.left=L+'px';pop.style.top=Math.max(8,T)+'px'}
 function show(el){const e=GLOSSARY.terms[+el.getAttribute('data-gl')];if(!e)return;clearTimeout(hideT);if(cur&&cur!==el)cur.removeAttribute('aria-describedby');cur=el;
  const b=document.createElement('b');b.textContent=e.t;pop.replaceChildren(b,document.createTextNode(e.d));el.setAttribute('aria-describedby','gl-pop');pop.classList.add('show');place(el)}
 function hide(){clearTimeout(hideT);if(cur)cur.removeAttribute('aria-describedby');cur=null;pop.classList.remove('show')}
 document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const t=termOf(e.target);if(t)show(t)});
 document.addEventListener('pointerout',e=>{if(e.pointerType==='touch')return;const t=termOf(e.target);if(t&&!t.contains(e.relatedTarget)&&document.activeElement!==t)hideT=setTimeout(hide,80)});
 document.addEventListener('pointerdown',e=>{const t=termOf(e.target);if(e.pointerType==='touch'&&t){e.preventDefault();if(cur===t)hide();else show(t);return}if(!t)hide()});
 document.addEventListener('focusin',e=>{const t=termOf(e.target);if(t)show(t)});
 document.addEventListener('focusout',e=>{if(termOf(e.target)===cur)hide()});
 addEventListener('keydown',e=>{if(e.key==='Escape'&&cur)hide()});
 addEventListener('scroll',()=>{if(cur)place(cur)},{passive:true});
})();
