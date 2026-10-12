# Direction: Material

## Contents
- When this direction applies
- The chassis
- Shape, elevation, spacing scales
- State layer implementation
- Iconography
- Theming (dual-theme is a Material-direction rule)
- Interaction feel

Default direction for dashboards, tools, control surfaces, and full apps when the brief names no style. Not a universal standard. A landing page does not get a navigation rail.

## When this direction applies

- Data-dense surfaces the user *operates* rather than reads
- Multi-section apps needing persistent navigation
- Anything where a user returns repeatedly and muscle memory matters

Do **not** apply to marketing pages, portfolios, reports, or editorial layouts. Route those elsewhere.

## The chassis

- Top app bar, navigation rail or drawer, structured card zones, filter chips, FAB where genuinely apt.
- Distinctive or expressive elements live **inside** this chassis, never as floating elements on a bare background.
- Visible structure: clear zones, clear hierarchy levels, obvious what contains what.

## Shape, elevation, spacing

- MD3 shape scale, consistent radii across the surface.
- 4/8px spacing grid.
- Elevation encodes interactivity and priority, never decoration:

| Level | Use |
| --- | --- |
| 0 | page background, flush content |
| 1 | resting cards, list containers |
| 2 | raised or hovered cards, app bar when scrolled |
| 3 | FAB resting, dropdowns |
| 4-5 | dialogs, sheets, command palette |

Hover on an interactive card raises one level (shadow plus optional 1.01 scale) over 150ms ease-out.

## State layer implementation

The floor requires visible states. Material expresses them as a translucent tint of the element's content colour:

| State | Overlay opacity | Notes |
| --- | --- | --- |
| Hover | 8% | pointer devices only |
| Focus | 10% | plus visible focus ring, 2-3px, offset 2px |
| Pressed | 10-12% | plus ripple |
| Selected | 12-16% | often paired with a container tonal change |
| Dragged | 16% | plus elevation raise |
| Disabled | content 38% | container 12%, `cursor: not-allowed`, still legible |

```css
.interactive { position: relative; }
.interactive::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit;
  background: currentColor; opacity: 0; transition: opacity 120ms ease-out;
  pointer-events: none;
}
.interactive:hover::after         { opacity: .08; }
.interactive:focus-visible::after { opacity: .10; }
.interactive:active::after        { opacity: .12; }
```

## Iconography

Material Symbols. One weight, set globally. Lucide or Heroicons are acceptable substitutes in this direction only; other directions ban them, so do not carry this rule across.

## Theming

**This direction ships both themes and a working toggle.** Token architecture and the toggle contract: [theming.md](theming.md).

Other directions may legitimately ship a single committed theme. That is their call, not a violation.

- Toggle is an icon button in the app bar, trailing end.
- `aria-label` states the action ("Switch to dark theme"), not the current state.
- No flash of wrong theme: inline the localStorage read in `<head>` before first paint.
- Dark surfaces desaturated and hue-biased toward the accent, never pure `#000`. Text ~87% white primary, ~60% secondary.
- Elevation on dark reads as lighter container tones, not shadows alone.

## Interaction feel

Material is the structural chassis; Apple's principles govern how it *feels*. Load `apple-design` and apply:

- Immediate pointer-down feedback, 1:1 direct manipulation.
- Interruptible motion, velocity handoff, momentum projection, soft boundaries.
- Critically damped springs by default. Bounce only when a real gesture supplied momentum.
- Gesture-driven elements start from their live on-screen value and stay grabbable mid-animation.

Motion vocabulary:

- **Container transform**: detail views and dialogs grow from the element that triggered them and return there on close.
- **Directional continuity**: forward enters from right or below; back exits the way it came.
- **Durations**: micro-interactions 150-300ms, complex transitions ≤400ms, exits ≈70% of enter.
- **Stagger** list and grid entrances 30-50ms per item.
