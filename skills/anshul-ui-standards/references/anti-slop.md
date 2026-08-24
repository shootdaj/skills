# Anti-slop: the direction-neutral bans

## Contents
- Why these are floor rules
- Content and data
- Visual defaults
- Layout tells
- Typography tells
- Copy tells
- Decoration tells

Every rule here holds regardless of visual direction. A brutalist page and an editorial page both fail if they ship fake-perfect numbers or a div-built screenshot.

Direction-specific bans (which fonts, which radii, which shadows) live in the direction files, not here.

## Why these are floor rules

These are the patterns a model reaches for by default when it has no opinion. They are not aesthetic preferences; they are the signature of unconsidered work. Adapted from `taste-skill`, reduced to what is true across all directions.

## Content and data

- **No fake-perfect numbers.** `99.9%`, `50K+`, `4.9/5`, `1234567`. Use real figures, or mark them explicitly as sample data. Organic values (`99.94%`, `51,400`) read as real because they are.
- **No placeholder names.** `Acme`, `Nexus`, `SmartFlow`, `Cloudly`, `John Doe`, `Sarah Chan`. Invent names that sound like they exist, appropriate to locale.
- **No lorem.** Real project vocabulary throughout, including alt text and error messages.
- **No generic avatars.** No SVG egg, no default user glyph.

## Visual defaults

- **No purple-gradient-on-white hero.** The single most recognisable generated-design tell.
- **No div-built fake screenshots.** A "product preview" assembled from styled rectangles, fake task lists, fake terminals. Use a real screenshot, a generated image, a real component preview, or no preview.
- **No emoji as icons.** One icon family, one weight.
- **No hand-rolled SVG icon paths.** Use a library. If a glyph is missing, add a second library rather than drawing paths.
- **No custom mouse cursors.** Accessibility-hostile and performance-hostile.
- **No pure `#000000` or pure `#ffffff`** as ground. Off-black and off-white hold depth.
- **Text over an image needs a scrim, backdrop, or stroke.** Contrast is not optional because the photo is dark today.

## Layout tells

- **No three identical feature cards in a row.** The default marketing grid. Vary cell size, use a two-column zig-zag, or an asymmetric grid.
- **No centered-everything.** Centre when the message is the design; otherwise vary alignment.
- **A grid has exactly as many cells as you have content for.** An empty tile in the middle or at the end means the grid was planned wrong.
- **No two-line navigation at desktop.** Condense labels, drop secondary items, or collapse to a menu.
- **Long lists need a different component, not a longer list.** Past about five items, reach for grouping, tabs, cards, or a scroll-snap rail rather than one more row with a hairline under it.

## Typography tells

- **Don't default to Inter or Space Grotesk.** They are the reflex, not a decision. Acceptable when the brief actually asks for a neutral system feel.
- **Don't reach for a serif because the brief feels "creative".** Editorial, luxury, publication, and heritage briefs can justify one. "Design studio" cannot, by itself.
- **No washed gradient headlines.** Text stays high-contrast.
- **Control hierarchy with weight, colour, and spacing**, not raw size alone.
- **Italic descenders need clearance.** `leading-none` on a word containing `y g j p q` clips it.

## Copy tells

- **No filler verbs.** Elevate, seamless, unleash, next-gen, revolutionize, delve.
- **Re-read every visible string before shipping.** Headlines, buttons, captions, alt text, errors. Anything grammatically broken, cute-but-wrong, or forced-poetic gets rewritten as a plain functional sentence. Boring copy beats clever-and-wrong.
- **One register per page.** Don't mix technical mono, editorial prose, and marketing punch unless the brand voice genuinely calls for it.
- **A control says exactly what happens.** "Publish", then a toast saying "Published".
- **Errors explain what went wrong and how to fix it.** No apologies, no vagueness.

## Decoration tells

- **No section-number eyebrows.** `01 / INDEX`, `002 · Capabilities`, `Stage 1 / Stage 2`. The content is the label.
- **Eyebrows are rationed.** At most one per three sections. Usually the headline alone is enough.
- **No decorative status dots** before nav items, list rows, or badges. Only when the dot carries real state.
- **No scroll cues.** The reader knows what scrolling is.
- **No version stamps or build strings** on anything that isn't a devtool.
- **No locale, time, or weather strips** unless the brief is genuinely about a place or timezone.
- **At most one marquee per page.** Two reads as filler.
