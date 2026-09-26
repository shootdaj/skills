# Final design brief: {{PROJECT}}

Read first: `BRIEF.md` (content, data, hard constraints, verification), `VIZ-PACK.md` if present (diagram data and the
text-to-diagram map), and `{{HUMANIZER_SKILL}}` (every visible string follows it). Source of truth for facts: `{{SOURCE_PAGE}}`. Invent nothing.

## The user's verdict on the variants
- Wants the {{QUALITY_1}} of {{VARIANT_1}}, the {{QUALITY_2}} of {{VARIANT_2}}, the {{QUALITY_3}} of {{VARIANT_3}}.
- Loves: {{LOVED_DETAILS}}
- Picked these exact elements to carry over (restyle to the final theme, keep their mechanics):
  | Element | Source | Figure id | Keep |
  | --- | --- | --- | --- |
  | {{ELEMENT}} | `{{VARIANT_FILE}}` | `{{FIG_ID}}` | {{MECHANICS_TO_KEEP}} |
- Everything else should be ported from whichever variant did it most cleanly, then restyled.

## Final theme: "{{THREE_WORDS}}"
- {{DARK_OR_LIGHT_FIRST}}. Page {{BG}}, surfaces {{S1}} / {{S2}}, hairlines {{LINE}}, text {{TXT}}, secondary {{TXT2}}, muted {{TXT3}}.
- One accent: {{ACCENT}} for "new / to build", active states and emphasis. Status lights: ok {{OK}}, part {{PART}}, miss {{MISS}}, off {{OFF}}.
  Status always has an icon or a word next to the light.
- Other theme (toggle, persisted): {{OTHER_THEME_VALUES}}.
- Type: {{DISPLAY_FACE}} for display and body; {{MONO_FACE}} for data, eyebrows, route strings. Sentence case.
- Shape: 12 px radius on cards and tiles, 999 px pills for chips and buttons, 44 px minimum targets.
- {{QUALITY_1}} ({{VARIANT_1}}): {{HOW_IT_SHOWS}}
- {{QUALITY_2}} ({{VARIANT_2}}): {{HOW_IT_SHOWS}}
- {{QUALITY_3}} ({{VARIANT_3}}): {{HOW_IT_SHOWS}}

## Structure (pyramid)
Sticky top bar: title, chapter tabs with light and count (scroll-spy, click scrolls), Expand all / Collapse all, theme toggle.
00 Overview: eyebrow · headline · one-sentence verdict · stat tiles · takeaways plus layer map.
{{CHAPTER_LIST_WITH_FIGURES}}
Chapters 01 onward are collapsible panels (animated height); 00 to 02 open by default.
Every figure: number, one-line caption, tooltip, click detail, keyboard focus.

## Motion (motion.dev, visible but calm)
Load: top bar, headline words, verdict, tiles pop with a spring and lights switch on one by one, cards stagger.
Scroll: `inView` reveals; strokes draw in; lights start when their section enters. Chips: sliding pill. Theme toggle: {{THEME_TRANSITION}}.
Lights animate only on stat tiles, the active tab count and missing cells. Reduced motion respected; page works if Motion fails.

## Rules
- No vote widget on the final. No Material, no emoji. Icons: Lucide inline SVG.
- 12 px floor, 44 px targets, no horizontal scroll at 1440 and 800, zero console errors, 2D fallback for any 3D.
- Plain English everywhere (humanizer): no em or en dashes, straight quotes, no stock AI words, active voice, keep every fact.
- Background patterns on `body::before`; body background solid.
- Split the source into `parts/` (head, style, body, data, app) with a `build.sh` that concatenates them and checks the JS parses.

## Output
`{{DESIGNS_DIR}}/final/index.html` plus `parts/` and `shots/` (1440 dark top, 1440 dark lead chapter, 1440 light top, 800 dark top,
fallback view, plus one per chapter). Verify with the Playwright pattern in BRIEF.md. Report: path, what was ported from where,
figure list, check results, caveats.
