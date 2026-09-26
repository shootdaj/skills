# Directions

Eight directions built for the Skills Assessment report on 2026-09-23. Use them as a menu and as a record of what the user liked. Every direction shared the same content and pyramid order.

## Round one

| Id | Name | Palette and type | Signature motion and forms | User's read |
| --- | --- | --- | --- | --- |
| D1 | Obsidian Spotlight | Near-black glass, electric blue | Cursor spotlight, conic borders, split-text word reveal, physical stagger, iris theme reveal, hold-to-confirm | Slick but generic dark |
| D2 | Aurora Editorial | Navy aurora, italic serif accent | Spring cursor blob, scramble text, parallax, toast stack, diagonal wipe | Liked the state machine and the BFF routes treemap |
| D3 | Paper and Ink | Warm paper, International Orange, hard offset shadows | 3D tilt, rolling digit counters, drag-to-reorder, confetti, fly-to-tray, page flip, rough.js sketch charts | Fun, not for this audience |
| D4 | Instrument HUD | Graphite blueprint, phosphor green, amber, red | Corner brackets, ring gauge, status LEDs that breathe, pulse and blink, typewriter, pinned HUD strip, shutter blades, footer ticker | Liked the boldness and the lights; the crosshair cursor was removed on request |
| D5 | Liquid Chrome | Graphite frosted glass, iridescent chrome borders | Morphing blobs, before/after slider, draggable tiles, rolling-text buttons, hue shift on scroll, lightbox | Too much glass |

## Round two, different component vocabulary

| Id | Name | Palette and type | Forms | User's read |
| --- | --- | --- | --- | --- |
| D6 | Swiss Broadsheet | Light editorial grid, one red, grotesk | Masthead tabs, swimlane sequence diagram, layered elkjs system graph, Gantt, print precision, no 3D | Liked the simplicity, the sequence diagram and the system graph |
| D7 | Toy Blocks | Plum page, candy clay blocks (sky, lime, grape, lemon, coral), cream light | Bottom dock, bubble numbers, isometric city, sticky-note takeaways, Kanban | Liked the approachability and the easier contrast; wanted "a little" of its colour |
| D8 | Cinematic Scrollstory | Filmic dark, pinned scenes | Dot timeline, exploded layer stack, Sankey, radial roadmap | Liked the exploded stack |

## The synthesis that won

Boldness of D4, approachability of D7, simplicity of D6. Elements carried over: D6 system graph and sequence diagram, D8 exploded stack, D4 stat tiles with lights and brackets, D2 state machine and treemap. Plum palette from D7 as default with a five-palette picker. Top chapter tabs and collapsible sections (final A) beat a left rail with a long scroll (final B). The result is the report recipe (`../report/RECIPE.md`).

## Writing a new direction

Give each builder one message with:

- Name and one-line mood.
- Palette: page, surfaces, text, one accent, status colours. Say dark-first or light-first.
- Type: display face and body face from Google Fonts, mono face for data. No Inter, Roboto, Space Grotesk, Sora or Schibsted.
- Signature motion: three to five moments, at least one from the motion.dev examples list in the brief.
- Component forms: one per content block from the menu in `templates/BRIEF-2.md`.
- 3D guidance: which one 3D figure, if any, and its 2D fallback.
- What not to repeat from the other builders.
