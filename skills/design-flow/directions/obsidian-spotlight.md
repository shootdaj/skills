# Obsidian spotlight

Near-black glass, electric blue, neon meaning hues, a cursor glow in each card's own colour. Dark first.

```json
{
 "id": "obsidian-spotlight",
 "name": "Obsidian spotlight",
 "mood": "near-black glass, electric blue, neon hues, cursor glow",
 "first": "dark",
 "fonts": {
  "display": "Geist",
  "body": "Geist",
  "mono": "Geist Mono",
  "google": "Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600;700"
 },
 "dark": {
  "bg": "#08090C",
  "s1": "#0F1116",
  "s2": "#14171E",
  "s3": "#1B1F28",
  "s4": "#232834",
  "line": "#1E222B",
  "line2": "#2A2F3A",
  "txt": "#EDEFF3",
  "txt2": "#C3C8D2",
  "txt3": "#8A919E",
  "txt4": "#5C6370",
  "accent": "#4F8CFF",
  "accentTxt": "#4F8CFF",
  "onAccent": "#08090C",
  "ok": "#4ADE80",
  "part": "#FFB443",
  "miss": "#FF8A80"
 },
 "light": {
  "bg": "#F7F8FA",
  "s1": "#FFFFFF",
  "s2": "#EEF0F4",
  "s3": "#E4E7ED",
  "s4": "#D9DDE5",
  "line": "#E1E4EA",
  "line2": "#CFD4DD",
  "txt": "#14171E",
  "txt2": "#2E3440",
  "txt3": "#5B6270",
  "txt4": "#8A919E",
  "accent": "#1F5FE0",
  "accentTxt": "#1F5FE0",
  "onAccent": "#FFFFFF",
  "ok": "#1B7F3F",
  "part": "#9A5A00",
  "miss": "#C0392B"
 },
 "hues": {
  "dark":  {"blue": "#4D9BFF", "violet": "#A98BFF", "amber": "#FFB443", "teal": "#2DD4BF", "pink": "#FF6BB5", "orange": "#FF6A3D", "cyan": "#5EC8E0", "lime": "#B8E63A", "gold": "#E8C547", "coral": "#FF8A80", "green": "#4ADE80", "magenta": "#E255FF"},
  "light": {"blue": "#1A5FE0", "violet": "#6B3FD6", "amber": "#9A5A00", "teal": "#0A7C70", "pink": "#C2187A", "orange": "#C43B0E", "cyan": "#0C6F8A", "lime": "#4C7A00", "gold": "#8A6500", "coral": "#C0392B", "green": "#1B7F3F", "magenta": "#A21CAF"}
 },
 "radius": 12,
 "radii": {"s": 8, "m": 12, "l": 16, "xl": 22},
 "density": "regular",
 "best": [
  "developer or test tool",
  "data-heavy workbench",
  "dashboard",
  "comparison page",
  "dark report",
  "dark landing"
 ],
 "avoid": [
  "print-like docs",
  "warm editorial",
  "playful or kids"
 ],
 "palettes": [],
 "files": "directions/obsidian-spotlight/",
 "source": "Scout (Luminatlas), from the glossary d1",
 "derived": []
}
```

Files: `obsidian-spotlight/` next to this file holds the look's exact code. `tokens.css` has both themes (dark on `:root`, light under `[data-theme="light"]`), the twelve hues, shape, type and motion tokens, plus the report recipe's token names mapped onto them. `look.css` has the helpers: frosted glass, uppercase mono labels, tabular numbers, buttons, chips with a glowing dot, the spotlight card and hairline row, the number block, the drifting glow and the fade-up entrance. `spotlight.js` moves the cursor glow. Copy all three in (inline them in a single-file page) rather than retyping the values above. In a report, `tokens.css` replaces the starter's `b1-tokens.css` (drop the palette picker) and `look.css` minus its page-base block sits after the starter's CSS.

Type: Geist for everything you read, weight 700 to 800 for headings with tight letter spacing (-.015em on h3 and h4, -.025em on h2, -.035em on h1). Geist Mono for numbers, counts, ids and labels; labels are 12 px, uppercase, letter-spaced .12em, in the muted grey. Numbers are tabular. Body 15 px on 1.5. Upright only.

Colour: near-black surfaces in four steps (s1 to s4), each a little lighter, with hairlines instead of shadows. One accent, electric blue, carries the primary button (near-black text on it in dark), focus rings, links and selection. The twelve neon hues each mean one thing on a page (a category, a series, an area); set `--hue` on a card, row, chip or number block and its glow, edge bar and dot take that colour. Exact, partial and miss are green, amber and coral.

Motion signature: spring curves (`--spring` overshoots a little, `--spring-soft` settles), three speeds (120, 220 and 420 ms); entrances fade up 8 px with a 22 ms stagger; the cursor throws a soft glow in each card's own hue; a slow three-colour glow (blue, pink, violet) drifts behind hero and sign-in areas over 18 s; bars and trays are frosted glass; the primary button glows on hover and every button shrinks a little when pressed; lists glide to new places when they reorder (FLIP). Reduced motion turns off the drift, the entrances and the glow follow; reduced transparency makes glass solid.

Forms: hairline rows with a glowing hue edge; spotlight cards; frosted sticky top bar; chips with a glowing dot; segmented control with a sliding thumb; number blocks with a glowing underline (not in reports); glass card over the drifting glow for a sign-in or hero.

3D: none by default. When a page needs one, a flyable point map in the twelve hues on the near-black ground, with a flat 2D scatter as the fallback.
