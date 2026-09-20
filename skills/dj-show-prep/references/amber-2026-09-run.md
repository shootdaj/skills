# Reference run — Amber Rooftop Bar, Bangkok, Sat 20 Sep 2026, 9 pm–midnight

Distilled from the overnight prep on 19 Sep 2026. Numbers are real.

## Brief
Rooftop cocktail bar (34F Wyndham QSNCC), expat/meetup crowd, Latin nights on
the calendar. Seed: Spotify "Bad & Boujee Radio" (50 tracks, bass/tech house,
hip-hop vocal chops). User: "disco house, funk, vocals" to open, "not sunset, I
start at 9", "Latin", peak bass house last, mp3 only, "use Spotify to find
tracks, not just all songs from certain artists".

## Pipeline as run
| Step | Tool | Result |
|---|---|---|
| Seed scrape | open.spotify.com + DOM scroll | 50/50 rows |
| Wave 1 | sockseek | 49 ok / 1 fail |
| Similar (artist fan-out, 42 − 4 owned) | sockseek | 37 / 1 |
| Re-fetch 5 rejects | sockseek `--strict-title --min-bitrate 256` | 4 / 1 |
| 3 curated lanes (112 − 61 owned) | sockseek | 74 / 38 |
| Wave 2 (Spotify mixes + artists, 90) | sockseek | 57 / 33 |
| Wave 3 (Upbeat Disco Mix + Tech House Operator, 59) | sockseek | 23 / 36 |
| Verify | ffmpeg full decode | 8 rejects total (2 set-rips, 1 radio cut, 5 corrupt/low) |
| Key/energy | Mixed In Key 11 via `open -a` | 236/236 keyed, energy 5–9 |
| BPM | tags (MIK/pool) 41 %, aubio 59 % | ±1 of MIK |
| Order | Camelot walk, caps 40/40/60 | 140-track set, 10.9 h |
| Lexicon | Local API | 7 playlists, counts verified |
| Report | here.now | https://spruce-tundra-d5s6.here.now/ (1.4 GB, ~10 min at 18 Mbit/s) |

Total on disk: 236 MP3s, 2.4 GB, flat copy in `~/Anshul/DJ/Amber Sep 19/`.
Lexicon playlists: `Amber Sep 19` (236), `… Disco House` (71), `… Latin House`
(48), `… Tech House` (85), `… Peak House` (32), `… Set Order` (138 = 140 − 2
duplicates), `… Bad & Boujee Radio` (48).

## Timings
Downloads ~25 min/wave of 50; verify ~2 s/track; MIK ~1 min/100 files; peaks
~1 s/track; here.now upload bandwidth-bound.

## Gotchas hit (all now encoded in the sub-skills)
- `--length-tol -1` must be `--length-tol=-1`.
- `--strict-title` dropped 28/36 of a wave; use `--pref-strict-artist` only.
- Spotify rows need ~10 s; search page flaky; tokens not obtainable.
- librosa key/tempo unreliable (key 14/37 vs tags, tempo octave errors);
  aubio + MIK are the pair to use; libkeyfinder 71/85 agreement as backup.
- MIK pauses its queue behind "Error saving Traktor collection file" when
  Traktor is open; click Cancel via System Events or quit Traktor.
- Accented filenames: Lexicon stores NFD/NFC differently; normalise before
  matching (4 misses otherwise).
- Lexicon de-dupes inside a playlist (138 ≠ 140 is not a bug).
- Lexicon API `index` insert can displace a track (Aug 2026) — never use it.
- Lexicon → rekordbox: Modified sync, not Playlist (rewrote 5,642 tracks in
  July → hours of re-analysis), never Full (deletes).
- rekordbox backup sits at "98 %" while zipping ~9 GB of analysis data; the
  `.zip.<rand>.part` file keeps growing — wait, don't cancel. 5.8 GB, ~8 min.
- Export before analysis finishes = tracks on USB without grids; re-export
  after (files reused, only analysis written).
- USB: FAT32/MBR 32 KB clusters; 512-byte clusters → REC ERROR on XDJ-RR.
- here.now free tier: 5 GB/file, 10 GB total; prune unreferenced audio from
  the report folder or the upload triples.
- AICRATES (the user's taxonomy) is a separate documented ruleset in
  `music-lib-cleanup/.planning/phases/07-…`; half of it needs an Essentia scan
  whose per-track outputs are gone. Don't improvise crate membership.

## Test Mix 2026-09-21 — 10-track end-to-end run

Seed: Spotify song radio for LP Giobbi / DJ Tennis / Joseph Ashworth "All In A
Dream" (50 rows; row 1 is the seed itself). 10 tracks requested, 12 queued over
two sockseek waves, 11 downloaded, 0 rejects, 10 used (the 11th set aside as
a spare), MIK keyed 10/10 (TBPM on 4, aubio on 6), one forced 9A→5A
transition, page published at
https://granite-vessel-wzvq.here.now/ (130 MB / 14 files, 52 s).

Friction that changed the skills (22 items in the run's `SKILL_FEEDBACK.md`):
- `spotify_scrape.js` stopped at 26/50 rows: the stall check tripped while the
  second half was a skeleton loader, and a scripted "wobble" froze the grid;
  only a real mouse-wheel scroll unstuck it. → header "N songs" count, resume
  via `window.__rows`, WheelEvent + scrollIntoView nudge, `{expected, got}`.
- javascript_tool output with `&` / `?` came back `[BLOCKED …]`. → read
  `window.__pl` in ≤ 15-line slices.
- Sidebar radio entries invisible to `find`; "…" → "Go to song radio" worked
  first time. → documented as the canonical path.
- `tsv_to_csv.py` skipped "Come Back Around - Romain Garcia Remix" as owned
  because the library has the original. → remix-token owned check + selftest.
- sockseek nests output in `out/<csv-stem>/`; the skill said `out/*.mp3`.
- `mik_tag.py` left MIK running. → `--quit-mik`.
- One VBR file read 272 kbps from the container. → stream bitrate fallback.
- `set.json`, `peaks_cache.json` and the `.m3u8` (absolute local paths) were
  uploaded with the page. → `publish/` folder with index.html + audio/ only.
- Screenshot OCR script was redundant: the model sees the image. → removed.
- The brief had no track-count or run-mode question and the Lexicon step was
  assumed. → both questions added; m3u8 is the default, Lexicon opt-in.
