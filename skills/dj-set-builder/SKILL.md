---
name: dj-set-builder
description: Turn a pile of keyed, energy-rated tracks (new downloads plus picks from the user's library) into phased set playlists ordered by a Camelot harmonic walk with a rising energy/BPM arc, blend partners per track, and .m3u8 files rekordbox can import. Use when the user says "order these for my set", "build me a 3-hour set", "which tracks blend", "make the playlists for tonight", or when dj-show-prep needs the running order.
---

# dj-set-builder

## Inputs

A `plan.json` describing the night as phases:

```json
{"gig": "Amber Rooftop Bar · Sat 20 Sep · 9pm–midnight",
 "phases": [
  {"name": "Disco house · funk · vocals", "slot": "9–10 pm", "cap": 40,
   "why": "warm, recognisable, groove first",
   "sources": ["/…/p1_disco", "/…/w2_p1"],
   "library": [{"path": "/…/x.mp3", "artist": "…", "title": "…", "key": "9A", "bpm": 124, "energy": 7, "lexid": 123}]}
 ]}
```

`sources` are download folders from `dj-soulseek-download` (their `tags.json`
supplies key/energy/BPM). `library` rows come from a read-only query of the
user's Lexicon SQLite (`Track.location/artist/title/key/bpm/energy`) — pick from
their existing crates so the set isn't 100 % unfamiliar material.

## Run

`python3 scripts/set_builder.py plan.json out_dir` → `out_dir/<n> - <phase>.m3u8`,
`out_dir/set.json` (for `dj-vibe-report`), `out_dir/audio/` (hard links of the
tracks that made a playlist).

## Rules (keep these; they are what the user signed off on)

- Phase pool = tracks in its sources + library rows; keep the top `cap` by MIK
  energy; sort by BPM; walk greedily from the lowest BPM.
- Cost to go A→B: key distance (same 0, ±1 or relative 1, two steps 2, clash
  disallowed) + 0.6 × |BPM %| + 0.4 × |energy Δ|, only within ±4 % BPM. When
  nothing fits, take the nearest BPM upward.
- Blend partners: the 5 cheapest for each track, across all phases.
- Phases rise: e.g. 118–126 → 122–129 → 125–133 BPM; energy 6 → 8.
- Library picks: energy ≥ 6, at most 2 per artist, BPM inside the phase window,
  never a track that is also being downloaded.
- Keys are Camelot (`9A`); musical names (`Em`, `Ebm`) are converted, flats
  handled. BPM outside 100–150 is octave-corrected.
- m3u8 paths are absolute so rekordbox `File ▸ Import ▸ Playlist` resolves them.

## Sanity checks before handing over

- No track with BPM < 110 or > 140 unless the phase is meant to; MIK keys on
  every track; energy 5–9 only.
- Each phase's duration ≥ its slot (aim 3× the slot for choice).
- Print the arc (min/max BPM per phase) and the count of "clash" transitions
  (should be 0–2 per phase).
