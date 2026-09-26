# Component catalog

Every figure the report style has used, what it encodes, and how it was built. The Reference column names the figure id and draw function in the finished Skills Assessment build, which stays with the work copy of this recipe (AyaHelix/skills). With that build at hand, port the mechanics and restyle with tokens; without it, build the figure from its row here and the `drawExample` pattern in `assets/starter/f-figures.js`.

## Page furniture

| Piece | Encodes | Built with | Interaction | Reference |
| --- | --- | --- | --- | --- |
| Status light | One state: ok, part, miss, new, off | `.led` CSS, `led()` helper | Blinks only where the budget allows | `.led` rules in `b-style.css` |
| Stat tile | One headline number with a status word and a jump link | `.tile.brk` | Hover lift, press, count-up, corner brackets light up, ruler draws in | `.tile`, `countUp()` |
| Chapter tabs | The section list with a light and a count each | Generated from `section[data-no]` | Scroll-spy, click scrolls and opens the chapter | `#tabs`, `spy()`, `go()` |
| Collapsible panel | A chapter | `.panel > .ph + .pb > .pbi` | Animated height, chevron, `inert` when closed, Expand all and Collapse all | `setOpen()` |
| Takeaway cards and layer map | Six findings and which layer each belongs to | `.take`, `.lmap`, `.lm-chip` | Hover a chip lights its card, click jumps to it | `fig-lmap` |
| Chips with sliding pill | A filter with counts | `.chips[data-slide] .chip[aria-pressed]` | Pressed state slides between chips with a spring | `press()`, `slide()` |
| Tooltip | The fact behind a mark | `#tip` | Pointer and keyboard focus | `tipOn()`, `tipD()` |
| Detail panel | The evidence behind a click | `.fg-d` | Fades in on update | `detail()` |
| Palette picker | Five palettes, each with dark and light | `.pal-menu` radio menu | Click sets `data-palette`, persists | `setPalette()` |
| Theme doors | Dark and light toggle | `.doors` overlay | Two doors close, theme swaps, doors open | `#themeBtn` handler |
| Back to top | | `.totop` pill | Appears after 700 px | `spy()` |

## Figures

| Figure | Encodes | Built with | Interaction | Reference |
| --- | --- | --- | --- | --- |
| Exploded layer stack | Layers of a system and which plane is new | Isometric SVG, no WebGL | Scrub slider, 3D or flat view, click a plane or a tile, hover traces the beams between planes | `fig-stack`, `buildArch`, `archFrame`, `playStack`, `drawFlat` |
| Swimlane sequence | Calls between systems in order, grouped into bands by status | SVG lifelines and messages | Filter chips with counts, Replay, click a lifeline or arrow for its evidence | `fig-seq`, `drawSeq` |
| System graph | Systems and links, layered left to right | elkjs layout, d3 render | Hover traces links, click for detail, edges draw in | `fig-sys`, `drawSys` |
| Domain layering | Which layer may call which | SVG bands | Hover | `fig-dom`, `drawDomains` |
| Entity diagram | An aggregate, its children and its vocabulary | SVG | Hover | `fig-fds`, `drawFds` |
| API surface treemap | Routes grouped by resource, with ghost tiles for missing ones | CSS grid `.tmg` | Hover, click | `fig-bff`, `drawBff` |
| Readiness grid and stacked bars | Status per layer and capability, and totals per layer | CSS grid plus d3 bars | Click a cell for evidence, cells stagger in, missing cells blink | `fig-grid`, `fig-bars`, `pickCell`, `drawBars` |
| Sankey | Weighted flow from sources to outcomes | d3-sankey | Hover highlights a full path | `fig-evid`, `drawEvid` |
| Principles map | A set of principles and the evidence each rests on | SVG | Click | `fig-princ`, `drawPrinc` |
| State machine | States and transitions with their rules | SVG pills and curved arrows, envelope chips | Click a transition for its rule | `fig-states`, `drawStates` |
| Process flow with a branch | Steps in order with a high-risk branch | SVG | Hover | `fig-ux`, `drawUx` |
| Decision timeline | Dated decisions with status | d3 time axis | Click an event | `fig-hdr`, `drawHdr` |
| Waffle | A share of a total | Squares, each worth a fixed count | Hover | `fig-nova`, `drawNova` |
| Alluvial | Stage totals folding into fewer groups | d3-sankey | Hover | `fig-pilot`, `drawPilot` |
| Roadmap | Ordered next steps | SVG | Hover | `fig-next`, `drawNext` |
| Dependency DAG | Deliverables and their order, longest chain called out | elkjs layout, d3 render | Layer chips, hover, click | `fig-dag`, `drawDag` |
| Bars per layer | A count per category | d3 | Hover | `fig-bar`, `drawBarsBuild` |
| Gantt lanes | Phases over time | d3 | Hover | `fig-gantt`, `drawGantt` |
| Stepper with an inserted step | An existing flow and where the new step goes | HTML | Hover, the new step glows | `fig-steps`, `drawSteps` |
| Beeswarm | Items on two ordinal axes, for example risk level by layer | d3 force | Filter chips, click | `fig-risk`, `drawRisk` |
| Bipartite graph | Which decision unblocks which deliverable | SVG | Click a decision | `fig-dec`, `drawDec` |
| Quadrant | Priority by effort | SVG | Click | `fig-help`, `drawHelp` |
| Lollipop | One value per item, for example commits behind | d3 | Click | `fig-repo`, `drawRepo` |
| Document map | Pages linked to the decisions they cite | d3 force | Drag, hover | `fig-docs`, `drawDocs` |
| Interactive prototype | A proposed user flow with a tap counter | HTML | Click through, reset | prototypes chapter of the reference lean edition |

## Choosing a figure

- Relationships between things: system graph, DAG, document map, bipartite graph.
- Order in time or in a call chain: swimlane sequence, timeline, Gantt, roadmap, stepper, process flow.
- Composition or share: treemap, waffle, bars per layer, alluvial.
- Status across two dimensions: readiness grid with stacked bars.
- Weighted flow: Sankey.
- Allowed states and moves: state machine.
- Two ordinal axes: beeswarm, quadrant.
- Structure with depth: exploded layer stack, domain layering, entity diagram.

## Colour and lights

- Category hue goes on `--lc` per element, from the five slots `--c1` to `--c5`. Text on a full-strength hue uses `--ink`.
- Large fills blend the hue at 30 to 35 percent into the surface, with the full hue on outlines and labels: `color-mix(in srgb, var(--lc) 30%, var(--s1))`.
- Status fills on the readiness grid are solid (`--okf`, `--partf`, `--missf`).
- Marks that exist use the text colour. Marks to build use the accent, dashed. Marks that come later use `--txt3`, dotted.
- Lights: full rules in `motion-budget.md`. Static everywhere except stat tiles, the active tab count and missing readiness cells.
