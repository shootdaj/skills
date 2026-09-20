---
name: dj-vibe-report
description: Build the "vibe check" page a DJ wakes up to before a gig — a single dark HTML page with a verdict, stats, every playlist in play order with key/BPM/energy and the transition between each pair, an in-page player with waveform, blend preview, a checklist, and publish it permanently to here.now. Use when the user asks "am I good for tonight", "give me a report I can preview the songs on", "make the set page", or when dj-show-prep finishes.
---

# dj-vibe-report

Consumes `set.json` from `dj-set-builder`. Everything in the page is data the
pipeline actually produced; never invent BPMs, keys or counts.

## Build

```bash
python3 scripts/build_report.py SET_DIR --title "Amber Rooftop Set" \
  --published 2026-09-19 [--verdict "…"] [--checklist items.json]
```

Writes `SET_DIR/index.html` next to `SET_DIR/audio/`. Audio in the page is
served relative (`audio/<file>.mp3`) so the same folder works locally and on
here.now. Only tracks that made a playlist are linked into `audio/`; prune
anything else before publishing or the upload triples.

`--checklist` is a JSON list of `["done"|"todo", "text", "note"]`; "todo" rows
are checkboxes the user can tick (stored in localStorage).

## Page contract (report_template.html)

- Above the fold: title, GO badge, one-sentence verdict, 4 stat tiles, jump
  chips per playlist.
- Each playlist: name, slot, count, duration, BPM range, one-line "why", an
  energy/BPM arc canvas, rows with play button, key chip (A amber / B cyan),
  BPM, MIK energy, `new`/`library` tag, and between rows the key relation and
  BPM delta coloured green/amber/red.
- Row click opens waveform with mix-in/out markers and 5 blend partners; each
  partner has ▶ blend (24 s outro of A crossfaded into B) and ▶ play.
- Sticky bottom player: prev/next follow set order, auto-next, volume.
- Collapsed: checklist, "how this was built". Dark by default, light toggle,
  fierce-waffle tokens (bg #0B0F17, cyan #3DC5FF, green #3DDC97, amber #FFC24B),
  Sora / Schibsted Grotesk / JetBrains Mono, no external JS beyond Google Fonts.

Keep the page **small and focused** when the user asks for that: playlists +
player + checklist. Charts (Camelot wheel, histogram) belong in the long form
only.

## Verify before handing over

Render with Playwright at 1440 px and 400 px, both themes; confirm
`document.querySelector('#a1').play()` on a track reaches `currentTime > 0`;
console has no errors; `body.scrollWidth <= innerWidth`.

## Publish

Use the `here-now` skill: `publish.sh SET_DIR --client <harness>`; on a
republish pass `--slug <existing>` so unchanged audio is skipped. Check
`curl -sI <site>/audio/<file>` returns `audio/mpeg` and `accept-ranges: bytes`.
Free tier allows 5 GB per file, 10 GB total; a 140-track page is ~1.4 GB and
uploads at whatever the uplink gives (≈18 Mbit/s took 10 min).
Give the user the URL and copy it to the clipboard (`pbcopy`).
