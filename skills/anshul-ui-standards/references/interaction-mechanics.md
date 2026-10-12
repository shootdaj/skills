# Interaction mechanics

## Contents
- Feedback timing
- Targets
- Focus and keyboard
- Depth and priority
- Motion as meaning
- Component behaviour contracts
- States every surface defines

What makes an interface usable, independent of how it looks. A brutalist terminal and a soft agency page both obey every rule here; they express them differently.

Material's specific implementation (state-layer opacities, elevation levels, the ripple) lives in [direction-material.md](direction-material.md).

## Feedback timing

- Visual acknowledgment of any press or tap within **100ms**.
- Async actions: the control enters a loading state, label replaced, width preserved, disabled while pending, resolving to success or error.
- Anything over 300ms gets a skeleton matching the final layout's shape. Never a blank region, never a bare spinner where a skeleton would fit.

## Targets

- Minimum **44×44px**. Extend the hit area past the visual bounds with padding or a pseudo-element.
- **≥8px** between adjacent targets.
- `touch-action: manipulation` on tappables.
- `cursor: pointer` on everything clickable.

## Focus and keyboard

- Visible focus ring on every ground, in every theme the page ships.
- Full keyboard operation. Logical tab order. No traps except inside modals, which trap deliberately and release on close.
- `:focus-visible` for the ring so mouse users don't see it, keyboard users always do.

## Depth and priority

Depth encodes interactivity and priority, never decoration. The *mechanism* is the direction's choice:

| Mechanism | Fits |
| --- | --- |
| Shadow elevation scale | Material, agency, soft |
| Border weight and colour | Brutalist, editorial, minimal |
| Background tonal step | Dark tech, terminal, dense data |
| Pure negative space | Editorial, minimal |

Pick one and use it for the whole surface. Hovering an interactive container gives some consistent depth response over roughly 150ms.

## Motion as meaning

- Every animation answers: hierarchy, storytelling, feedback, or state change.
- Enter with ease-out, exit with ease-in, exits about 70% of the enter duration.
- Micro-interactions 150-300ms. Complex transitions ≤400ms.
- Stagger list and grid entrances 30-50ms per item.
- Animate `transform` and `opacity` only.
- All motion interruptible, never blocking input, always honouring `prefers-reduced-motion`.

## Component behaviour contracts

What each thing must *do*. Appearance is the direction's call.

- **Switch / toggle**: label states the current value; destructive or far-reaching flips get a confirm step or an undo affordance.
- **Filter chips**: selecting one genuinely filters the data below; multiple selectable; selected state readable without colour alone.
- **Expandable cards**: the whole header row is the target; expansion animates; focus moves sensibly; the indicator reflects state.
- **Dialog / sheet**: scrim click and Esc dismiss; focus trapped inside; unsaved-changes guard before dismissing; returns focus to the trigger on close.
- **Toast / snackbar**: auto-dismiss 3-5s, action slot for undo, `aria-live="polite"`, never steals focus.
- **Command palette**: keyboard shortcut *and* a visible button; fuzzy filter as you type; arrow navigation; Enter executes; Esc closes.
- **Tables**: sticky header, row hover state, `tabular-nums`, sortable columns show direction, empty state designed.
- **Approve / reject rows**: immediate optimistic feedback, counts update, undo offered.

## States every surface defines

Empty (helpful message plus the primary action), loading (skeleton), error (cause plus recovery), disabled, and for lists, filtered-to-zero.

An interface that only handles the successful case is unfinished.
