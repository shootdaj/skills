# Cinematic scrollstory

Filmic teal dark, ember accent, pinned scenes. Dark first.

```json
{
 "id": "cinematic-scrollstory",
 "name": "Cinematic scrollstory",
 "mood": "filmic teal dark, ember accent, pinned scenes",
 "first": "dark",
 "fonts": {
  "display": "Fraunces",
  "body": "Albert Sans",
  "mono": "Red Hat Mono",
  "google": "Albert+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600&family=Red+Hat+Mono:wght@400;500;600"
 },
 "dark": {
  "bg": "#0B1517",
  "s1": "#0F1D20",
  "s2": "#152629",
  "line": "rgba(143,166,168,.16)",
  "txt": "#F1EBE3",
  "txt2": "#8FA6A8",
  "accent": "#FF7A3D",
  "accentTxt": "#FF9460",
  "onAccent": "#1B0B03",
  "ok": "#5CC4B0",
  "part": "#D9A441",
  "miss": "#E5647A"
 },
 "light": {
  "bg": "#F4EFE8",
  "s1": "#FBF8F3",
  "s2": "#ECE5DA",
  "line": "rgba(15,42,46,.13)",
  "txt": "#0F2A2E",
  "txt2": "#3F5B5F",
  "accent": "#FF7A3D",
  "accentTxt": "#B94710",
  "onAccent": "#1B0B03",
  "ok": "#1D8572",
  "part": "#9C700E",
  "miss": "#B53A62"
 },
 "radius": 10,
 "density": "airy",
 "best": [
  "vision doc",
  "storytelling",
  "keynote page"
 ],
 "avoid": [
  "reference doc"
 ],
 "palettes": [],
 "source": "sk-as/design/variants/d8-cinematic-scrollstory",
 "derived": [
  "dark.part",
  "dark.miss"
 ]
}
```

Motion signature: pinned full-viewport scenes; scroll-scrubbed reveals; dot timeline that fills; exploded stack driven by scroll; radial roadmap sweep.

Forms: full-viewport scenes; dot timeline navigation; exploded layer stack; Sankey; radial roadmap.

3D: scroll-driven exploded stack.

Derived values (not measured from the source, adjust if they look off): dark.part, dark.miss.
