/* Material report: press ripple on every .ripple element (needs look.css). Source: demo.html, verbatim. */
document.addEventListener('pointerdown',e=>{
  const t=e.target.closest('.ripple'); if(!t) return;
  const r=t.getBoundingClientRect(), s=Math.max(r.width,r.height);
  const n=document.createElement('span'); n.className='rip';
  n.style.width=n.style.height=s+'px';
  n.style.left=(e.clientX-r.left-s/2)+'px'; n.style.top=(e.clientY-r.top-s/2)+'px';
  t.appendChild(n); setTimeout(()=>n.remove(),560);
});
