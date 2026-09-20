---
name: dj-soulseek-download
description: Batch-download a CSV of tracks from Soulseek with the sockseek CLI (club-ready 320 kbps MP3s), verify every file with a full ffmpeg decode, re-fetch rejects, then key/energy-tag the keepers with Mixed In Key 11 headlessly and fill missing BPMs with aubio. Use when the user says "download these on Soulseek", "get mp3s of this list", "make sure the files are good", or when dj-show-prep reaches the download step.
---

# dj-soulseek-download

## Preconditions (check, don't assume)

- `~/.local/bin/sockseek` (fiso64/sockseek, osx-arm64 tarball from GitHub
  releases; formerly slsk-batchdl / sldl). Runs standalone, no .NET needed.
- `~/.config/sockseek/sockseek.conf` with `username`, `password`, `output-dir`,
  `format = mp3`, `pref-min-bitrate = 320`, `no-progress = true`. The user types
  credentials; never ask them to paste a password into chat. A throwaway
  Soulseek account is fine.
- SoulseekQt must be **quit** if it uses the same account (one login at a time).
- `ffmpeg`, `ffprobe`, `aubio` (brew), python `mutagen`, Mixed In Key 11 app.

## Workflow

1. **Wave 1**: `scripts/sockseek_run.sh list.csv out_dir` — runs
   `--length-tol=-1 --pref-strict-artist --concurrent-jobs 6`, logs to
   `out_dir.log`, prints the completion line and top failure reasons.
   Chain waves with `until [ -f DONE ]` waiters rather than running two at once.
2. **Verify**: `python3 scripts/verify_mp3s.py out_dir` — full decode, ≥256 kbps,
   ≥120 s; rejects move to `out_dir/_rejected/` (never deleted). Read the reject
   reasons: "75-second radio cut", "96 kbps set-rip", corrupt frames.
3. **Re-fetch rejects** with a stricter search into a fresh dir:
   `sockseek_run.sh redo.csv redo_dir --min-bitrate 256 --strict-title --no-skip-existing --index-path redo_index.csv`
   then verify again and swap the clean copy in. Some tracks only exist as
   bad rips; say so in the report instead of shipping them.
4. **Tag**: `python3 scripts/mik_tag.py out_dir` — opens all files in Mixed In
   Key 11 (`open -a`), waits until every file has a "Energy N" comment, fills BPM
   with aubio where the tag is missing, writes `out_dir/tags.json`.

## Tuning that mattered

- `--length-tol=-1`: Spotify lengths are radio edits; the good Soulseek copies
  are extended mixes. Without this most matches are filtered out. Note the `=`.
- `--pref-strict-artist` ranks; `--strict-artist`/`--strict-title` filter and
  kill 60–80 % of matches on messy filenames. Use strict only for re-fetches.
- Very new releases (this month's Beatport top 100) are often not on Soulseek
  yet; expect "All downloads failed" or "No search results" for those.
- sockseek writes `_index.csv` next to the output; rerunning the same CSV skips
  done rows. For a redo use `--index-path` so the old index doesn't skip them.
- Expect 20–40 % of a curated wishlist to fail; plan a second Spotify pass.

## File-quality rules

Reject: decode errors ffmpeg can't skip, < 2 min, < 256 kbps, non-mp3 when the
user asked for mp3. Tolerate: 1–2 junk frames at the very start (DJ-pool rips),
bad ID3 BOM, cover-art chunk warnings, Xing size warnings; if it bothers you,
`ffmpeg -i in.mp3 -c:a copy -map_metadata 0 out.mp3` cleans the container.

## Mixed In Key notes

- Headless trick: `open -a "Mixed In Key 11" *.mp3` → it analyses and writes
  `TKEY` + `COMM "9A - Energy 7"` without clicking. ~1 min per 100 files.
- If Traktor is open, MIK shows "Error saving Traktor collection file" and its
  queue pauses; `mik_tag.py` clicks Cancel via System Events, but quit Traktor
  first when possible.
- MIK does not add TBPM to untagged files; aubio (`aubio tempo -i f`) is ±1 BPM
  of MIK on the same files. librosa tempo/key estimates were unreliable; don't.
- libkeyfinder agreed with MIK on 71/85 tracks; `scripts/keyfinder_cli.cpp` is a
  20-line CLI if MIK is unavailable (`brew install libkeyfinder`, compile with
  clang++ against its include/lib).

## Output

`out_dir/*.mp3` (keepers), `out_dir/_rejected/`, `out_dir/tags.json`
(`{relpath: {key, energy, bpm, bpm_src}}`), `out_dir.log`. Report: found / failed
per wave, rejects and why, tag coverage.
