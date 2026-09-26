# Addendum for round two: totally different component vocabulary

Read `BRIEF.md` first (content, data, pyramid order, hard constraints, verification). This addendum overrides its
"what must stay" list in one way: the information must stay, the component forms must change. The user wants to compare
different presentations of the same content, so round two must NOT reuse the component forms or motion signatures round one used.

## Already used, do not repeat any of these forms
- Layout: {{USED_LAYOUT_FORMS}}
- Motion and effects: {{USED_MOTION_BY_VARIANT}}
- Themes: {{USED_THEMES}}

## Required: alternative forms for each content block
Pick the form assigned in your direction message. Each must still be readable, interactive and data-faithful.
- Navigation: top masthead tabs with page-style transitions · right-edge vertical dot timeline with labels ·
  command palette (Cmd/Ctrl-K) plus breadcrumb progress · bottom dock with magnification.
- Headline numbers: giant typographic figures column with footnotes · d3-force bubble cluster sized by value (draggable) ·
  scroll-scrubbed counter wall · sparkline chips · receipt-style tally.
- Takeaways: numbered pull-quotes across columns · sticky-notes wall (rotated, draggable, pinnable) ·
  horizontal scroll-snap gallery · vertical timeline with connectors.
- Architecture: swimlane sequence diagram (lifelines plus animated messages) · CSS isometric city blocks with roads and
  "under construction" tape on new blocks · subway map with lines and stations · layered stack (exploded view).
- Status matrix: stacked horizontal bars per row plus punch-card dot grid · d3 radar per row with toggles · d3 Sankey row to status · status cubes.
- Plan: d3 Gantt with phases · Kanban columns (user may triage cards; persist in localStorage) · radial roadmap arcs · checklist receipt.
- Stepper: vertical subway line in a margin · winding board-game path with a pawn that travels to the new step (offset-path) · film strip · segmented progress ring.
- Sections: paginated "pages" with folios and curtain transitions · App-Store style cards that expand into a shared-layout modal ·
  full-viewport pinned scenes (scrollytelling) · horizontal scroll-snap chapters.

## Motion recipes still unused on motion.dev (vanilla JS), choose from these
Curtains: Blinds / Doors / Pixels / Clip wipe / Stagger wipe · Scroll zoom hero · Scroll horizontal gallery · Scroll text lines ·
Scroll image reveal · Fill text · Layout animation (FLIP) · Family-style dialog / modal (shared layout expand) · View animation ·
Motion along a path · Drag: constraints · Reorder grid · Bobble hover · Swipe actions · Loading: jumping dots / ripple ·
Keyframe wildcards · Apple-Watch-style bubble cluster · Notifications list · Price-switcher style number swap.

## Vote widget (mandatory)
Same as BRIEF.md, with your own id and label.

## Output
`{{DESIGNS_DIR}}/<your-folder>/index.html` plus `shots/`. Verify exactly as BRIEF.md says. Report back in its format,
plus one line per content block saying which alternative form you used.
