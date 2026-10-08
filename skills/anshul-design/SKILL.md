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

Reports: a plain title that says what the report is for (the question or decision, 24 to 28 px, no display type), one purpose line, then four to six one-line bullets, each led by a highlighted key number or phrase, with no label, verdict tag, paragraph or stat tiles; written for a smart reader who is not technical; about three screens long before the appendix; only numbers measured on his data or bearing on him (cost, size, time, quota). The report recipe (`design-flow/recipes/report/RECIPE.md`) holds the details, and its check script enforces the opening and length caps. Why: on 2026-10-08 Anshul said "remove it and put something actually useful there. like what is this report for exactly." (of a display headline), "it doesn't need to be that fucking huge.", "never put these in the report" (of a stat-tile row), "i need something i can scan fast, bullet points", "humanize the entire report. i dont understand it.", "any future reports need to be fucking shorter." and "never use any measures that we haven't either measured or is directly relevant to us".

No setup needed. Everything auto-detects: Playwright installs itself on first use (`~/.design-flow/playwright`), Chrome is used when installed and Chromium otherwise, room servers pick a free port, `~/.design-flow/` is created on first save and an absent `extra_directions` folder just means no extra looks. When `~/.herenow/credentials` is missing the page stays local (open it in Chrome and say so in one line); when Chrome is missing use plain `open`.
