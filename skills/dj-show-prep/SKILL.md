---
name: dj-show-prep
description: End-to-end DJ gig preparation, run overnight and unattended after one round of questions and a confirmed plan — seed tracks from anywhere (Spotify, a screenshot, pasted text, a Lexicon playlist), expand with a similar-songs engine, acquire club-ready MP3s, verify and key them, build phased harmonically ordered playlists mixing new finds with the user's library, write .m3u8 playlists for rekordbox (Lexicon when chosen), hand off to USB, publish a playable "vibe check" page. Use when the user says "I have a gig", "prep my set", "download this playlist and make it a set", "am I good for tonight", or sends a tracklist screenshot before a show. Composes dj-source-tracks, dj-soulseek-download, dj-set-builder, dj-lexicon-playlists, dj-vibe-report.
---

# dj-show-prep

The DJ wants to sleep and wake up ready. The flow is **ask → plan → confirm →
run**: ask once (§0), show the plan, wait for "go", then run the whole chain
without further questions and report outcomes faithfully.

## Slots and providers

Every stage is a slot; each slot has interchangeable providers. The question
round fills the slots; the sub-skills implement the providers.

| Slot | Providers | Sub-skill |
|---|---|---|
| SOURCE | spotify-web · screenshot · text · lexicon-playlist · rekordbox-xml / traktor-nml · web-tracklist | dj-source-tracks |
| EXPAND | spotify-mixes · artist-fanout · lexicon-crates · none | dj-source-tracks |
| ACQUIRE | soulseek (sockseek) · already-on-disk | dj-soulseek-download |
| ANALYSE | mixed-in-key · keyfinder+aubio · trust-tags | dj-soulseek-download |
| ORDER | camelot-walk · keep-source-order · manual | dj-set-builder |
| LIBRARY | m3u8 (default) · lexicon (+ rekordbox Modified sync) · none | dj-set-builder / dj-lexicon-playlists |
| REPORT | vibe-page-full · vibe-page-compact · chat-only | dj-vibe-report |

Adding a provider = adding a section in the sub-skill and a checkbox here.

## 0. Question round, plan, confirmation (then autonomous)

Use the harness's structured prompt when it exists (Claude Code:
`AskUserQuestion`, multi-select where noted); otherwise print the same
questions as numbered lists and wait for one reply. Pre-select what the
conversation already answered (a pasted Spotify link → SOURCE=spotify-web;
"I start at 9" → slot). Never re-ask something already stated.

1. **Gig** (free text): venue / room, start time, length, crowd. → phases.
2. **Vibe & constraints** (free text): genres to keep, genres to avoid, energy
   arc ("start disco, end bass house"), mp3-only for club gear?
3. **SOURCE** (multi): spotify-web · screenshot · text · lexicon-playlist ·
   rekordbox/traktor export · web-tracklist.
4. **EXPAND** (multi): spotify-mixes (recommended) · artist-fanout ·
   lexicon-crates (recommended) · none.
5. **Track count** (single): 10 · 40 (default) · 100+ · as many as it finds.
   Per phase; the number of *keepers* aimed for, so source ~2.5× that many
   candidates (30–40 % will not be on Soulseek).
6. **ANALYSE** (single): mixed-in-key (recommended) · keyfinder+aubio ·
   trust existing tags.
7. **LIBRARY** (single): **flat folder + .m3u8 per phase (recommended,
   default)** · lexicon + rekordbox Modified sync · none. An `.m3u8` is a
   plain-text playlist of absolute file paths that rekordbox opens with
   File ▸ Import ▸ Playlist — no database writes, no backup step. Lexicon
   runs only when it is chosen here.
8. **REPORT** (single): vibe page compact (recommended) · full · chat only.
9. **Run mode** (single): **background (default)** — after confirmation the
   orchestrator hands the whole run to one subagent and relays its report
   when it finishes; the chat stays free · **here, step by step** — the run
   happens in this thread, phase by phase, so the user can watch and steer.

ACQUIRE is soulseek unless the user says the files exist; ORDER is
camelot-walk unless they ask to keep an order. If Soulseek credentials are
missing, ask the user to type them into `~/.config/sockseek/sockseek.conf`
(never into chat) as the last question.

**Plan, then wait for "go".** After the answers, print a short plan and stop.
Nothing downloads, tags, writes or publishes before the user confirms it:

- phases with slot, BPM window, target keepers (from the track count);
- sources per phase (URLs, screenshot transcription when it was more than
  ~5 rows or any name is doubtful, Lexicon playlist names) and the expected
  candidate counts;
- what will be written where: download folders, the flat hand-off folder,
  `.m3u8` files (or Lexicon playlist names + parent folder when chosen), the
  report folder and that it will be published to here.now;
- run mode.

Then wait for "go" (or corrections → re-plan → wait again). In background mode
the confirmed plan is the subagent's whole brief; the orchestrator relays the
subagent's final report verbatim plus anything it could not do.

## 1. Source → expand → CSV per phase  (`dj-source-tracks`)

Aim ~2.5× the track count in candidates per phase (≈110 for the default 40;
30–40 % will not be on Soulseek). Diff every list against Lexicon (read-only)
and earlier waves.

## 2. Acquire → verify → tag  (`dj-soulseek-download`)

Chain waves; verify each; one stricter re-fetch of rejects; MIK at the end.
Quit SoulseekQt and Traktor first. Rejects to `_rejected/`, never deleted.

## 3. Library picks → order  (`dj-set-builder`)

Per phase: user's crates + artist matches from Lexicon, energy ≥ 6, BPM inside
window, ≤ 2 per artist, none that are being downloaded. `plan.json` →
`set_builder.py` with `cap` = the track count per phase (40/40/60 ≈ 11 h for
a 3 h slot was the right amount of choice).

## 4. Hand-off files (LIBRARY = m3u8, the default)

Flat copy of every keeper to `~/…/DJ/<Gig> <Date>/` (copy, never move);
`set_builder.py` writes one `.m3u8` per phase with absolute paths. The user
imports them with rekordbox File ▸ Import ▸ Playlist, analyses, exports to the
FAT32 USB. This is the whole library step unless Lexicon was chosen.

## 5. Library → export  (`dj-lexicon-playlists`, only when LIBRARY = lexicon)

Wait for the user's import confirmation; create `<Gig> <Date>` (all), one per
lane, `Set Order`; verify counts. rekordbox backup → quit → **Modified** sync
→ let it analyse → export to FAT32 USB. Check USB free space first.

## 6. Report  (`dj-vibe-report`)

Publish `publish/` only (never `set.json` / `.m3u8`), copy URL to clipboard.
Final message = URL, playlist table (name, slot, tracks, BPM range), file
locations, what could not be obtained and why, what remains for the user.

## House rules throughout

- Verify before claiming: API counts after every write, ffmpeg decode for
  every file, a real `audio.play()` on the published page.
- Nothing runs before the plan is confirmed (§0).
- Never write Lexicon SQLite; never `rm`; never Full sync; backup reminders
  before Lexicon and rekordbox writes.
- The user's taste beats the algorithm. "Keep the disco house", "not sunset,
  I start at 9", "use Spotify to find tracks, not just artist pages" → change
  the plan, re-run, don't argue.
- Say what failed, plainly.

## References

- `references/amber-2026-09-run.md` — the run this skill was distilled from
  (numbers, timings, every gotcha) and the 10-track test run that followed.
