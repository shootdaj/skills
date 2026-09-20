---
name: dj-source-tracks
description: Get a seed tracklist into a CSV from whatever the DJ has — a Spotify playlist/radio/artist page, a screenshot or phone photo of a tracklist, pasted text, a Lexicon/rekordbox playlist, a SoundCloud or 1001Tracklists page — and optionally expand it with a "similar songs" engine (Spotify personalised mixes, artist fan-out, the user's own Lexicon crates). Skips anything already owned. Use when the user says "here's the playlist", "download these", "find more like this", sends a screenshot of tracks, or when dj-show-prep needs source material.
---

# dj-source-tracks

Two slots, each with pluggable providers. Pick per the user's answers (see
`dj-show-prep` §0) or infer from what they gave you; combine freely.

Output is always the same: `<name>.tsv` (artist \t title \t m:ss) →
`scripts/tsv_to_csv.py in.tsv out.csv --have DIRS --queued CSVS` → sockseek CSV,
minus tracks already in Lexicon (read-only SQLite) or on disk.

## SOURCE providers

**spotify-web** — the logged-in open.spotify.com web player (no API; the API
needs a dev app + Premium). Open the page, **wait ~10 s** (rows render late),
run `scripts/spotify_scrape.js` via javascript_tool/evaluate; it scrolls the
virtualised grid and leaves TSV in `window.__pl`; read back in slices of ~18
lines. Works for `/playlist/<id>`, `/artist/<id>` (5 Popular rows), `/album/`.
Search (`/search/<q>/artists`) is flaky; retry once, then use artist URLs.
Pause the auto-playing track once (bottom-centre button).

**screenshot** — any image of a tracklist (Spotify app, rekordbox, a set photo,
a story). Read the image yourself first (you can see it), then
`scripts/screenshot_to_tsv.py img.png > list.tsv` (macOS Vision OCR, pairs
title/artist rows) and fix misreads by eye. Ask for the missing rows when a
screenshot is cut off.

**text** — pasted lines. Accept `Artist - Title`, `Title — Artist`,
`Artist – Title (Extended Mix)`, numbered lists, tab/CSV. Normalise to TSV.

**lexicon-playlist** — `sqlite3 -readonly …/lexicon/main.db` join
`Playlist`→`LinkTrackPlaylist`→`Track` for a named playlist. Useful as a seed
for EXPAND (what the user already loves) rather than for downloading.

**rekordbox-xml / traktor-nml** — parse `<TRACK Artist Name>` /
`<ENTRY ARTIST TITLE>`; same normalisation.

**web-tracklist** — SoundCloud description, 1001Tracklists, Beatport chart:
fetch the page text and extract `Artist - Title` lines; verify counts with the
user because these pages are inconsistent.

## EXPAND providers ("similar songs" engine)

**spotify-mixes** (best, taste-aware) — the user's personalised
"<Genre> Mix", "<Playlist> Radio", "<Artist> Radio": search
`/search/<genre> mix/playlists`, scrape each (50 tracks). Editorial lists
("Tech House Operator", "Latin House") for freshness.

**artist-fanout** — Popular tracks for the top-N artists in the seed (count
appearances, take those with ≥2). Reliable but samey; cap at 5 per artist.

**lexicon-crates** — the user's own curated playlists (their taxonomy crates,
past gig picks): filter by BPM window, energy ≥ 6, key, ≤ 2 per artist. Costs
nothing to download and keeps the set from being 100 % unfamiliar.

**none** — just the seed.

The user decides which engines run; "focus on Spotify, not just artist pages"
means spotify-mixes over artist-fanout.

## Rules

- Diff against Lexicon and every earlier CSV before writing a new one; a
  second wave must not re-download wave one.
- Keep " - Extended" / "(feat.)" in the CSV title (sockseek matches better),
  strip them only for the owned check (`tsv_to_csv.py` does this).
- Report per source: rows found, rows skipped as owned, rows queued.
