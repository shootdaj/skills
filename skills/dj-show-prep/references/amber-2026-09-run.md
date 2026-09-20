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
