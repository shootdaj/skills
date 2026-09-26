/* ───────────────────────── data blocks ─────────────────────────
   Every fact the page shows lives here, with a comment that names its source. Figures read only from these. */

// Source: EXAMPLE. Replace with a real count and cite where it came from.
const EXAMPLE=[{layer:'Layer A',hue:'c1',count:9,items:['item 1','item 2']},{layer:'Layer B',hue:'c2',count:6,items:['item 3']},{layer:'Layer C',hue:'c3',count:3,items:['item 4']}];

// Source: EXAMPLE. Which layer each takeaway card (data-tk index) belongs to; drives Fig. 0.1.
const LAYERS_MAP=[{layer:'Layer A',hue:'c1',takeaways:[0,3]},{layer:'Layer B',hue:'c2',takeaways:[1]},{layer:'Layer C',hue:'c3',takeaways:[2,4,5]}];
