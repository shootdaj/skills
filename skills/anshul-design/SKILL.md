---
name: anshul-design
description: Anshul's personal design door. Use for UI, dashboards, reports, mocks and pages in his personal projects (any repo not under AyaHelix). Sets the personal profile and runs the design-flow engine with quick, medium or detailed questions, a swatch board of as many looks as you ask for, then build, verify and publish.
---

# anshul-design

Load the `design-flow` skill and run it with this profile. Do not re-ask anything the profile answers.

```yaml
name: personal
publish:
  target: here.now by default; ask once per project if another host is wanted
  access: public
  post_to: none
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
