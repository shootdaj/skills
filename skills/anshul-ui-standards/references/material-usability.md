# Material usability mechanics — full spec

The layer that makes elements "extremely usable". Apply to every interactive element regardless of visual direction.

## State layers

One consistent system: a translucent tint of the element's content color, overlaid on the element.

| State    | Overlay opacity | Notes                                        |
| -------- | --------------- | -------------------------------------------- |
| Hover    | 8%              | pointer devices only                         |
| Focus    | 10%             | + visible focus ring (2–3px, offset 2px)     |
| Pressed  | 10–12%          | + ripple where the direction allows          |
| Selected | 12–16%          | often paired with container tonal change     |
| Dragged  | 16%             | + elevation raise                            |
| Disabled | content @38%    | container @12%; `cursor: not-allowed`; keep legible |

Implementation pattern (no JS needed for hover/focus/press):

```css
.interactive { position: relative; }
.interactive::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit;
  background: currentColor; opacity: 0; transition: opacity 120ms ease-out;
  pointer-events: none;
}
.interactive:hover::after   { opacity: .08; }
.interactive:focus-visible::after { opacity: .10; }
.interactive:active::after  { opacity: .12; }
```

## Feedback timing

- Visual acknowledgment of any press/tap within **100ms**.
- Async actions: button enters loading state (spinner replaces label, width preserved), disabled while pending, success/error state after.
- Skeleton/shimmer for loads >300ms; never a blank region.

## Targets

- Minimum 44×44px (Apple) / 48×48dp (Material). Extend hit area beyond visual bounds with padding or a pseudo-element.
- ≥8px gap between adjacent targets.
- `touch-action: manipulation` on tappables (kills 300ms delay).
- `cursor: pointer` on everything clickable.

## Elevation semantics

Consistent scale; elevation encodes interactivity/priority, never decoration.

| Level | Use                                    |
| ----- | -------------------------------------- |
| 0     | page background, flush content         |
| 1     | resting cards, list containers         |
| 2     | raised/hovered cards, app bar (scrolled) |
| 3     | FAB resting, dropdowns                 |
| 4–5   | dialogs, sheets, command palette       |

Hover on an interactive card = raise one level (shadow + optional 1.01 scale), 150ms ease-out.

## Motion = meaning

- **Container transform**: detail views/dialogs grow from the element that triggered them; on close they return there.
- **Directional continuity**: forward navigates in from right/below; back exits the way it came.
- **Durations**: micro-interactions 150–300ms; complex transitions ≤400ms; exits ≈70% of enter duration.
- **Easing**: ease-out on enter, ease-in on exit; springs (Motion `spring`) for playful directions.
- **Stagger** list/grid entrances 30–50ms per item.
- Animate `transform`/`opacity` only — never width/height/top/left (layout thrash).
- All animation interruptible; never block input; `prefers-reduced-motion` disables non-essential motion.

## Component behavior contracts

- **Switch/toggle**: thumb slides with spring; label states current value; destructive or far-reaching flips get a confirm step (dialog or undo snackbar).
- **Chips (filter)**: selected = tonal fill + leading check; clicking genuinely filters the data below; multiple selectable.
- **Cards (expandable)**: whole header row is the target; chevron rotates; content expands with height auto-animation (grid-template-rows trick or measured max-height); focus moves sensibly.
- **Dialog/sheet**: scrim click + Esc dismiss; focus trapped inside; unsaved-changes guard before dismiss; grows from trigger.
- **Snackbar/toast**: bottom, auto-dismiss 3–5s, action slot ("Undo"), `aria-live="polite"`, never steals focus.
- **Command palette**: Ctrl/Cmd+K and a visible button; fuzzy filter as you type; arrow-key navigation; Enter executes; Esc closes.
- **Tables**: sticky header, row hover state, `font-variant-numeric: tabular-nums`, sortable columns show direction, empty state designed.
- **Approve/reject rows**: action gives immediate optimistic feedback (row animates out / status chip morphs), counts update, undo offered.

## States every surface must define

Empty (helpful message + primary action), loading (skeleton), error (cause + recovery action), disabled, and — for lists — filtered-to-zero.
