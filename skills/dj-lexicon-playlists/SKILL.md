---
name: dj-lexicon-playlists
description: Create and fill playlists in Lexicon DJ through its Local API, map local files to Lexicon track ids, verify counts, and drive the Lexicon → rekordbox sync safely (Modified sync, never Full). Use when the user says "make a Lexicon playlist from these files", "put these in Lexicon", "sync to rekordbox", "export to my USB", or when dj-show-prep reaches the library step.
---

# dj-lexicon-playlists

## Hard rules

- **Remind the user to back up Lexicon** (Backups → Database Backup → Create
  backup) before any write and wait for confirmation.
- Writes go through `http://localhost:48624/v1` only (Settings → Integrations →
  Enable Local API). SQLite `~/Library/Application Support/lexicon/main.db` is
  opened **read-only**, for lookups and verification.
- There is no import endpoint and no playlist-delete endpoint. Importing files
  is a UI drag; ask the user to drag the folder in, then continue.
- Re-read the count after every write. `PATCH /playlist-tracks` with `index`
  can silently displace a track; the bundled script never uses `index`.

## Workflow

1. `python3 scripts/lexicon_playlist.py tree` — find the parent folder id
   (e.g. "Playlists" or a gig folder). Print it back to the user.
2. Confirm the files are imported:
   `lexicon_playlist.py ids DIR` prints matched ids and the files Lexicon does
   not know. Filenames are compared NFC-normalised; accented names otherwise
   miss.
3. Create: `lexicon_playlist.py create "Amber Sep 19 Latin House" --parent 72 --from-dir DIR`
   or `--ids-from ids.json` for an ordered list (a set order from
   `dj-set-builder`: map `set.json` tracks by filename, library rows by
   `lexid`). Exit status is non-zero on a count mismatch.
4. Verify: `lexicon_playlist.py verify ID` (API vs SQLite).
5. Tell the user exactly which playlists exist now, with ids and counts, and
   whether any contain library tracks vs only new files.

Naming convention that worked: `<Gig> <Date>` for the full pool, then
`<Gig> <Date> <Lane>` per genre lane, plus `<Gig> <Date> Set Order`.
Lexicon de-duplicates within a playlist, so a set order containing the same
track twice shows one fewer than requested; explain that rather than "fixing" it.

## Lexicon → rekordbox

- Back up rekordbox first: File → Library → Backup Library, "back up music
  files" = No. It writes `~/Downloads/rekordbox_bak_<date>.zip`; the progress
  bar sits at 98 % while the multi-GB analysis data zips. Confirm the `.part`
  suffix is gone before proceeding.
- Quit rekordbox fully (Direct sync needs it closed; check `rekordboxAgent`).
- Lexicon → Sync → rekordbox → mode **Modified** (only changed playlists and
  tracks). **Playlist** mode re-stamps every track in the library (hours of
  rekordbox re-analysis). **Full** deletes rekordbox tracks that aren't in
  Lexicon. Keep rekordbox's Key analysis off so MIK keys survive.
- After sync, let rekordbox finish analysing the new tracks **before** exporting
  to USB; export copies whatever analysis exists at that moment, and a track
  exported un-analysed lands on the player with no grid or waveform. If an
  export already ran early, re-export the same playlists afterwards (files are
  reused; only analysis data is written).
- USB for Pioneer: FAT32 + MBR, 32 KB clusters (`diskutil eraseDisk FAT32 NAME
  MBR diskN`); 512-byte clusters cause REC ERROR on XDJ-RR. Files are stored
  once per device regardless of how many playlists reference them.

## Also useful

- AICRATES-style taxonomy assignment (genre/energy/mood crates) is a separate,
  documented workflow in the user's music-lib-cleanup repo; do not improvise
  crate membership. Ask, and reuse the recorded rules.
