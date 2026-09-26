# Tokens

Everything visual reads a token. `assets/starter/b1-tokens.css` is the source; this page explains it.

## How the cascade works

- `:root` and `:root[data-theme="dark"]` hold the Plum dark values. `:root[data-theme="light"]` holds Plum light.
- Each other palette adds two blocks: `:root[data-palette="ink"][data-theme="dark"]` and the light one. Later blocks win, so palette blocks come after the Plum blocks.
- `data-theme` and `data-palette` are set on `<html>` by an inline script in `<head>` before first paint, from `localStorage` keys `<slug>-theme` and `<slug>-palette`. The keys are namespaced because every `file://` page shares one origin during local review.
- Components never use hex. Charts read tokens with `getComputedStyle(document.documentElement).getPropertyValue('--ok')` or use `var(--ok)` in inline styles, and redraw on the `themechange` event.

## Token names

| Token | Role |
| --- | --- |
| `--bg` | Page background, solid |
| `--s1` `--s2` `--s3` | Surfaces, each one step lighter on dark themes and darker on light themes |
| `--line` `--line2` | Hairlines, faint and stronger |
| `--txt` `--txt2` `--txt3` | Text, primary, secondary, muted |
| `--red` `--red-txt` `--red-tint` `--red-glow` `--fill` `--on-fill` | The accent, its text-safe shade, a tint, a glow, the solid fill and text on it. The name stays `red` in every palette, even when the hue is teal or lime |
| `--ok` `--part` `--miss` `--off` `--on-led` | Status colours and text on a light |
| `--okf` `--partf` `--missf` | Solid status fills for grid cells |
| `--c1` to `--c5` | Category hues for layers or domains; `--ink` is text on a full-strength hue |
| `--tip-bg` `--tip-fg` | Tooltip |
| `--pt` `--ps` `--pline` | Plane top, plane side and plane outline for the exploded stack |
| `--shadow` | The one elevation shadow |
| `--f` `--mono` | Type faces |
| `--r` `--pill` `--gut` `--maxw` `--top` | 12 px radius, 999 px pill, 24 px gutter, 1240 px content width, top bar height |
| `--spring` `--ease` | `cubic-bezier(.34,1.56,.64,1)` and `cubic-bezier(.2,.7,.1,1)` |

## The five palettes

Values for the page, the first surface, primary text and the accent. The full sets are in the CSS.

| Palette | Dark: bg / s1 / txt / accent | Light: bg / s1 / txt / accent | Feel |
| --- | --- | --- | --- |
| Plum (default) | `#1B1530` / `#241F3B` / `#ECE8E2` / `#E5463A` | `#FFF6E5` / `#FFFBF2` / `#2B2240` / `#E5463A` | Soft dark, cream light, easy on the eyes |
| Ink | `#0A0A0B` / `#111214` / `#F2F2F2` / `#E3120B` | `#F7F7F5` / `#FFFFFF` / `#0B0B0B` / `#E3120B` | Near black, pure red, highest contrast |
| Slate | `#1E2430` / `#262D3B` / `#E6EAF0` / `#2FB8B0` | `#F1F4F8` / `#FFFFFF` / `#1E2430` / `#1A9E97` | Cool grey, teal accent |
| Forest | `#141F1B` / `#1B2924` / `#E8EFE9` / `#9BE15D` | `#F2F6EF` / `#FFFFFF` / `#16241E` / `#5E9E2A` | Deep green, lime accent |
| Sand | `#221C17` / `#2B241E` / `#EFE6D8` / `#D9541E` | `#F3EBDD` / `#FBF6EC` / `#2A2521` / `#D9541E` | Warm, light first, orange accent |

Status lights on dark themes: ok `#5CD68A`, part `#F2B24A`, miss `#F26B6B` (Ink, Slate and Forest use `#4ADE80`, `#FFB347`, `#FF5C5C`). On light themes they darken to `#1F8A4C`, `#A86A0C`, `#C23B3B` so they pass contrast next to text.

Why Plum is the default: near-black pages with white text read as an old terminal screen and are hard to read for long. Plum keeps the contrast without the glare. Ink stays available for people who want it.

## Category hues

Five candy hues for layers, domains or teams. They come from the Toy Blocks variant and are the same in dark and light.

| Slot | Hue | Reference use |
| --- | --- | --- |
| `--c1` | Sky `#5DD3FF` | Foundational data |
| `--c2` | Lime `#9BE15D` | Talent |
| `--c3` | Grape `#A597FF` | App module |
| `--c4` | Lemon `#FFD93D` | Shell |
| `--c5` | Coral `#FF6B6B` | Product |

`--ink` is `#2B2240`, the text colour on a full-strength hue. Slate, Forest and Sand shift one or two slots so the hues do not fight the accent (see the CSS).

Where hues appear at full strength: the top border of a stat tile, the number in a stat tile, the left edge of a takeaway card, the icon chip, chip outlines, the pressed chip fill, outlines and labels of grouped figures. Where hues appear blended: any surface larger than a chip, at 30 to 35 percent into `--s1`. On light themes the coloured number blends 45 percent toward `--ink` for contrast.

## Type and shape

- Familjen Grotesk 700 for the headline, chapter titles and figure titles, 500 for labels and buttons, 400 for body. Body is 15.5 px on 1.55.
- Martian Mono 400 to 600 for data: figure numbers, eyebrows, counts, route strings, ids. Never for sentences.
- 12 px is the floor for anything readable, including SVG text after scaling.
- 12 px radius on cards, tiles, panels and figures. 999 px pills for chips and buttons. 10 px on inner panels.
- 44 px minimum for anything clickable, 48 px for tabs.
- One shadow token, used on hover lift only.

## Adding a palette

Copy the two Ink blocks, rename `data-palette`, change every value, keep every token name. Add a `menuitemradio` button with three swatches to the palette menu and add the name to the regular expression in the head script. Check both themes in the verification run.
