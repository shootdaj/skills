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
report_recipe: recipes/report/RECIPE.md    # bundled; a door may name an installed skill instead
bakeoff: recipes/bakeoff/RECIPE.md         # bundled; same rule
copy: humanizer                            # when installed; the recipes carry the rules
level_default: quick
```

Tie-break: if the git remote is under github.com/AyaHelix and a work door (`helix-design-anshul`) is installed, use its profile; otherwise behave like `anshul-design`.
