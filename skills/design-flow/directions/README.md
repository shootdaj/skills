# Directions

One file per look. The JSON block is what the build reads; the prose is what a builder reads. A look may also carry a folder with its id (its JSON `files` key names it, for example `obsidian-spotlight/`) holding its exact CSS and JS; a builder that uses the look copies those files in instead of retyping the values. `best` and `avoid` drive which three looks the board offers for a page kind. `derived` lists values that were approximated rather than measured from the source page.

No look uses italic: load fonts without their italic axis and carry emphasis by weight or colour. Why: on 2026-10-08 Anshul said "never use that fucking stupid italic font".

Seeded from the Skills Assessment bake-off (sk-as/design). Add a look by copying `_template.md`; a bake-off winner is added the same way.
