# Default profile

Used when design-flow runs without a door.

```yaml
name: default
publish:
  target: a folder next to the source; ask before hosting anything
  access: private
  post_to: none
ui_kit: none
vocabulary: none
report_recipe: helix-report   # when installed
bakeoff: design-bakeoff        # when installed
copy: humanizer                # when installed
level_default: quick
```

Tie-break: if the git remote is under github.com/AyaHelix, behave like `helix-design-anshul`; otherwise like `anshul-design`.
