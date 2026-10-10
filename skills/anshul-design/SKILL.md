---
name: anshul-design
description: Anshul's personal design door. Use for UI, dashboards, reports, mocks and pages in his personal projects (any repo not under AyaHelix). Sets the personal profile and runs the design-flow engine with quick, medium or detailed questions, an inspiration picker you can skip, then builds as many designs as you ask for (two or more open the design room), verifies and publishes.
---

# anshul-design

Load the `design-flow` skill and run it with this profile. Do not re-ask anything the profile answers.

```yaml
name: personal
publish:
  target: here.now by default; ask once per project if another host is wanted
  access: public
  post_to: none
  room: personal host when the user wants a link, else local only (open index.html in Chrome)
ui_kit: none                      # a personal design system comes later; until then the look plus core mechanics
vocabulary: none
mechanics: anshul-ui-standards-v2
# report_recipe and bakeoff: the bundled recipes in design-flow/recipes (the default)
copy: humanizer                   # when installed
extra_directions: ~/.design-flow/directions
level_default: quick
```

Always: no Material chassis, no house palette by default, never italic (emphasis is weight or colour; "never use that fucking stupid italic font", 2026-10-08), visible motion with a light budget, plain English, show work in Chrome as it lands, verify with Playwright before presenting.

Reports: a plain title that says what the report is for (the question or decision, 24 to 28 px, no display type), then a lead statement: two or three short paragraphs in plain English for a reader with no context (what the situation is, what was done and how, what was found with the key numbers, each marked measured or worked out, every term glossed), at 19 px (18 px narrow), line height 1.7, about 66ch, full text colour and never grey, with three to five calm highlights (weight 600, thin underline, no fill), a Your call strip and a "How we checked" side card; then four to six one-line bullets, each led by a key number or phrase in the same calm style, with no label, verdict tag, other paragraph or stat tiles; written for a smart reader who is not technical; about three screens long before the appendix; only numbers measured on his data or bearing on him (cost, size, time, quota). When the project has a glossary (looked up at build time, never assumed from chat), its terms show their definition on hover. Every report fills a context brief (the `CONTEXT` block in `d-data.js`): the project, ticket or PR links and goal; why it exists and who asked, in their words; how it was made (data, what was actually run, where, dates, tools and models, what was not tested); what is decided, pending and asked of the reader; dated history; where the glossary lives. A fact the builder lacks is written "not recorded", never guessed. The Ask panel gives it to Claude before the page text, and the page shows it only as a collapsed "About this report" entry at the end of the appendix. The report recipe (`design-flow/recipes/report/RECIPE.md`) holds the details, and its check scripts enforce the opening and length caps and the brief. Why: on 2026-10-08 Anshul said "remove it and put something actually useful there. like what is this report for exactly." (of a display headline), "it doesn't need to be that fucking huge.", "never put these in the report" (of a stat-tile row), "i need something i can scan fast, bullet points", "humanize the entire report. i dont understand it.", "any future reports need to be fucking shorter." and "never use any measures that we haven't either measured or is directly relevant to us". On 2026-10-10 he said "the first bullet point should be the main point spelled out properly and in detail as a proper sentence with like highlighted words that make sense", "maybe not the first bullet point, but just the first statement after the title, and not tiny font like the 'Replay of 83 PR pushes since Sep 18. Read the plan on LUM-137 and answer its five questions.' It should be an easy to read, visually pleasing to read like I said with the highlights, and any other things you think will make it more understandable. it should always be in plain english and not assume the reader knows all context.", "do you htink this grey text is easy to read???", "those highlights are too intense", "it should be readable, dont you understand that?" and "i have no idea what you actually did you test the runs. why isn't it fucking obvious", and approved the result. Also on 2026-10-10 he said "make a change where the AI knows the context about the work that the report is about. how it was created, etc. it should know the basics of whats going on with the report etc and why its there what problem its for all that stuff".

No setup needed. Everything auto-detects: Playwright installs itself on first use (`~/.design-flow/playwright`), Chrome is used when installed and Chromium otherwise, room servers pick a free port, `~/.design-flow/` is created on first save and an absent `extra_directions` folder just means no extra looks. When `~/.herenow/credentials` is missing the page stays local (open it in Chrome and say so in one line); when Chrome is missing use plain `open`.
