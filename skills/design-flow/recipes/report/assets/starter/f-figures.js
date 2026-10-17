/* ───────────────────────── figures ─────────────────────────
   One draw function per figure: fn(animate). It reads a data block, draws into its host, wires tooltip, click detail and keyboard.
   Build richer figures from the rows in references/components.md, following the drawExample pattern below. */

/* Fig. 1.1 example: horizontal bars, one per layer, coloured by its hue */
function drawExample(a){const host=$('#f-example');const w=host.clientWidth;if(!w)return;const W=Math.max(w,420),rowH=44,H=EXAMPLE.length*rowH+8,lw=120;
 const svg=mkSvg(host,W,H,'Count per layer');const x=d3.scaleLinear().domain([0,d3.max(EXAMPLE,d=>d.count)]).range([0,W-lw-70]);
 const g=svg.selectAll('g.row').data(EXAMPLE).join('g').attr('class','row').attr('transform',(d,i)=>`translate(0,${i*rowH+4})`);
 g.append('text').attr('x',lw-10).attr('y',rowH/2).attr('dy','.35em').attr('text-anchor','end').style('font','500 14px var(--f)').style('fill','var(--txt)').text(d=>d.layer);
 const bars=g.append('rect').attr('x',lw).attr('y',8).attr('height',rowH-16).attr('rx',6).style('fill',d=>`color-mix(in srgb,var(--${d.hue}) 32%,var(--s1))`).style('stroke',d=>`var(--${d.hue})`).attr('width',a&&HAS()?0:d=>x(d.count));
 if(a&&HAS())bars.transition().delay((d,i)=>80+i*70).duration(500).ease(d3.easeCubicOut).attr('width',d=>x(d.count));
 g.append('text').attr('class','cnt').attr('x',d=>lw+x(d.count)+8).attr('y',rowH/2).attr('dy','.35em').style('font','600 13px var(--mono)').style('fill','var(--txt2)').text(d=>d.count);
 tipD(g,d=>`<b>${esc(d.layer)}</b>${d.count} items`);
 act(g,d=>`${d.layer}: ${d.count} items`,(e,d)=>{g.classed('sel',x=>x===d);detail('d-example',`<span class="ey">${esc(d.layer)}</span><b>${d.count}</b><span class="tag">${d.items.map(esc).join(' · ')}</span>`)});}
