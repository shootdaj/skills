# Design bake-off

A bake-off answers "which look?" with real pages instead of mood boards. The content is frozen, so every variant shows the same facts in a different form, and the user picks per element. The Skills Assessment report ran this twice: five variants, then three more with a different component vocabulary, then two finals built from the picks.

## When to run one

- The user rejected the last build ("this is just the house theme", "I don't see any motion", "make it from scratch").
- The user asks to see options, samples or template sites before committing.
- The user wants to pick elements across designs, not one design whole.

Skip it when the user already named a direction; go straight to the report recipe (`../report/RECIPE.md`) or the profile's `ui_kit` skill. `design-flow` runs this recipe when none of its looks fit; the winner becomes a new file in `design-flow/directions/`.

## Process

1. Freeze the content. Build or take a v1 page that holds every fact, table and data block. This is the source of truth for all variants; keep it intact for comparison. Name the data blocks in the brief so builders reuse them verbatim.
2. Gather reference sites. Take screenshots of ten to twelve component libraries and galleries (`assets/shoot-reference-sites.mjs`) and show them to the user. The list is in `references/reference-sites.md`. Post it where the work is tracked.
3. Ask how many variants with AskUserQuestion (header Variants: 3 · 5 (Recommended) · 8; Other for any number), unless the request already says. Then pick that many directions. Each has a name, a palette, a type pairing, a signature motion and a list of component forms. Vary them a lot. Start from `references/directions.md`; reuse a direction only if the user liked it.
4. Write the brief. Copy `templates/BRIEF.md`, fill the placeholders, and point at the v1 page, the data blocks, the humanizer skill when installed (else the plain-English rules in the template) and the Playwright pattern. One brief for all builders, plus a short direction message per builder.
5. Start the vote server. `python3 assets/vote/server.py &` serves picks on 127.0.0.1:7331. Copy `assets/vote/` to `<designs>/_vote/` so the widget path `../_vote/vote.js` resolves from every variant folder.
6. Build in parallel. One Fable subagent per variant with the prompt in `references/builder-prompt.md`. Each writes `<designs>/<id>-<name>/index.html` plus `shots/`, verifies with Playwright and reports back in the brief's format.
7. Show each variant as it lands. Open it in Chrome (`open -a "Google Chrome" <path>`) and tell the user what is distinctive in one line. Do not wait for all of them.
8. Build the ballot. Copy `assets/vote/ballot.html` next to the variants, fill its `DESIGNS` array with ids, labels, paths and hero shots, and open it. It tallies the picks live.
9. Round two. When the user wants more, ask how many again and copy `templates/BRIEF-2.md`. It lists every component form and motion signature round one used and forbids repeating them, so the user sees different presentations of the same content.
10. Collect the picks. Read `votes.json` and the user's comments. Note which whole design they liked for boldness, approachability and simplicity, and which elements they picked per content block.
11. Write the final brief. Copy `templates/FINAL-BRIEF.md`. Name the elements to carry over with their source variant and figure id, and the theme the finals will use. Build one or two finals (A and B differ in navigation and palette warmth), each with a Fable subagent.
12. Iterate on feedback with `references/feedback-lessons.md` open. Palette, colour strength, light budget and contrast all took two or three rounds on the reference.
13. Hand off. The chosen final goes through the report recipe (`../report/RECIPE.md`) for the lean edition, verification and publishing. Remove the vote widget from the final.

## Roles and budget

- You orchestrate: briefs, direction messages, vote infrastructure, showing work, synthesis.
- Builders are Fable subagents (the house mechanics, `anshul-ui-standards-v2`, require Fable for frontend design; if Fable is unavailable, stop and say so) with the full brief in their prompt and a folder each. All of a round runs at once.
- Expect about 30 to 40 minutes per round of builds and 10 minutes of user review per round. Tell the user the ETA when they ask.

## Rules

- Content is fixed. A variant that changes a number or drops a table fails.
- From scratch. No house chassis, no Material idiom, no default fonts. Icons are inline SVG or Lucide, never emoji.
- Motion must be noticeable and named: load choreography, scroll reveals, count-ups, chart draw-in, spring press, animated collapse, scroll progress, animated theme swap.
- At least ten working interactive elements per variant. A dead control is a defect.
- Every variant verifies itself with Playwright before reporting: 1440 and 800, both themes, zero console errors, 12 px floor, no horizontal scroll.
- The vote widget goes on every variant and on the v1 page, and never on a final.
- Plain English everywhere. Point builders at the humanizer skill when installed, else at the plain-English rules in `templates/BRIEF.md`.

## Files in this recipe

| Path | Holds |
| --- | --- |
| `templates/BRIEF.md` | The shared brief for round one |
| `templates/BRIEF-2.md` | The round two addendum that forbids repeating forms |
| `templates/FINAL-BRIEF.md` | The synthesis brief for the finals |
| `references/directions.md` | Eight named directions with palette, type, motion and forms, and how the user judged them |
| `references/builder-prompt.md` | The subagent prompt and the direction message format |
| `references/feedback-lessons.md` | What the user pushed back on and the fix that stuck |
| `references/reference-sites.md` | Component libraries, galleries, templates, motion and 3D sources |
| `assets/vote/` | `vote.js` widget, `server.py` vote server, `ballot.html` tally page |
| `assets/shoot-reference-sites.mjs` | Screenshots the reference sites |
