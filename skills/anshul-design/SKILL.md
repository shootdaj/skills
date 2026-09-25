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
report_recipe: helix-report
bakeoff: design-bakeoff
copy: humanizer
extra_directions: ~/.design-flow/directions
level_default: quick
```

Always: no Material chassis, no house palette by default, visible motion with a light budget, plain English, show work in Chrome as it lands, verify with Playwright before presenting.
