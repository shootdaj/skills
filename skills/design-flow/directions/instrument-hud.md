# Instrument HUD

Graphite blueprint, phosphor lights, control room. Dark first.

```json
{
 "id": "instrument-hud",
 "name": "Instrument HUD",
 "mood": "graphite blueprint, phosphor lights, control room",
 "first": "dark",
 "fonts": {
  "display": "Archivo",
  "body": "Archivo",
  "mono": "Chivo Mono",
  "google": "Archivo:wdth,wght@100..125,400..800&family=Chivo+Mono:wght@400;500;600"
 },
 "dark": {
  "bg": "#0C0E11",
  "s1": "#111419",
  "s2": "#161A20",
  "line": "rgba(201,209,219,.10)",
  "txt": "#C9D1DB",
  "txt2": "#9BA6B3",
  "accent": "#9BFF57",
  "accentTxt": "#9BFF57",
  "onAccent": "#0C0E11",
  "ok": "#9BFF57",
  "part": "#FFB347",
  "miss": "#FF5C5C"
 },
 "light": {
  "bg": "#F4F6F8",
  "s1": "#FFFFFF",
  "s2": "#F9FAFB",
  "line": "rgba(28,44,62,.11)",
  "txt": "#2A3441",
  "txt2": "#48535F",
  "accent": "#2F7D1E",
  "accentTxt": "#2F7D1E",
  "onAccent": "#FFFFFF",
  "ok": "#2F7D1E",
  "part": "#B45309",
  "miss": "#C81E1E"
 },
 "radius": 6,
 "density": "dense",
 "best": [
  "ops dashboard",
  "monitoring",
  "status page"
 ],
 "avoid": [
  "long reading"
 ],
 "palettes": [],
 "source": "sk-as/design/variants/d4-instrument-hud",
 "derived": [
  "light.accent",
  "light.ok",
  "light.part",
  "light.miss"
 ]
}
```

Motion signature: lights breathe, double-pulse and blink by status; typewriter headline; shutter blades on theme swap; ring gauge sweep; footer ticker.

Forms: corner brackets on tiles; blueprint grid background; pinned HUD strip; ring gauges; stat tiles with lights.

3D: instanced box field, optional.

Derived values (not measured from the source, adjust if they look off): light.accent, light.ok, light.part, light.miss.
