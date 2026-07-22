---
name: capcut-draft-builder
description: >-
  Build a working CapCut desktop draft programmatically from a timeline/EDL (e.g. exported
  from Palmier Pro, DaVinci Resolve, or any clip list), so the user can open it in CapCut and
  add transitions/effects. Use this WHENEVER the user wants to recreate an exact edit in CapCut,
  generate a CapCut project from a clip list, "set up a draft in CapCut", move a cut from another
  editor into CapCut, or fix a CapCut draft showing "File not accessible" / "Media lost" / a
  "Link media — couldn't find" dialog. Also use for any task that writes CapCut draft JSON
  (draft_info.json / draft_meta_info.json) or places projects under com.lveditor.draft. macOS only.
---

# CapCut Draft Builder

Generate a CapCut desktop project (macOS) from a known timeline so it opens with clips already
laid out, ready for transitions/effects. CapCut has no scripting API — but its drafts are JSON
folders on disk, so you build the draft directly. This skill encodes the recipe AND the hard-won
gotchas (every one of these was a real failure mode).

## The #1 rule: make the draft SELF-CONTAINED (media copied inside)

CapCut resolving EXTERNAL media paths is the source of ~all failures. Do NOT reference media
sitting elsewhere on disk. **Copy every media file INTO the draft** and reference it internally.
This eliminates path/space/cache problems entirely.

```
com.lveditor.draft/<project_name>/
  material/import/        ← COPY all video/audio files here
  draft_info.json         ← timeline + materials (key: "path")
  draft_meta_info.json    ← media library/link registry (key: "file_Path")
  + sidecars (draft_meta_info, template.tmp, draft_settings, etc.)
```

## Build procedure

1. **Get the EDL**: per clip — source filename, timeline order, `startFrame`, `durationFrames`,
   `trimStartFrame`; plus fps, width, height, totalFrames, and the audio (song) track. (From
   Palmier: `get_timeline` + `get_media` to resolve mediaRefs → filenames.)
2. **Clone a KNOWN-GOOD draft** from `~/Movies/CapCut/User Data/Projects/com.lveditor.draft/`
   as the template (match its schema byte-for-byte — version, keys, sidecar files). Hand-rolling
   the schema from scratch is fragile; clone and override only ids/paths/timeranges.
3. **Copy media inside**: put every unique source file into `<project>/material/import/` with the
   exact filename CapCut expects (the name shown in the timeline/library). The music file must be
   named whatever the draft's material name is (e.g. `song_stayin_alive.mp3`), not its original name.
4. **Timing is in MICROSECONDS**, not frames: `us = round(frame / fps * 1_000_000)`.
   For each segment: `target_timerange` = timeline position (start = startFrame→us, duration =
   durationFrames→us); `source_timerange` = trim (start = trimStartFrame→us, duration = durationFrames→us).
5. **Set paths in BOTH files** (this is the bug that bites everyone):
   - `draft_info.json` materials → key **`"path"`**
   - `draft_meta_info.json` → key **`"file_Path"`** ← editing only draft_info.json is NOT enough;
     CapCut links the media library from `file_Path`.
   - Use **absolute internal paths**: `/Users/.../com.lveditor.draft/<project>/material/import/<file>`.
6. **Path placeholder gotcha**: cloned drafts use a token like
   `##_draftpath_placeholder_<UUID>_##/material/import/<file>` in `draft_info.json`. CapCut resolves
   it at load for the LIBRARY, but TIMELINE segment materials may show "Media Not Found". Fix:
   **replace the placeholder with the absolute draft folder path** so timeline materials resolve too.
7. **Fresh identity**: new `draft_id` (UUID), set `draft_name` + `draft_fold_path` to the new
   project, remove stale `.bak`/`.tmp`/`.lock` from the new folder.
8. **CapCut must be QUIT while you edit** — it rewrites material paths from its in-memory cache on
   open/close and will clobber your edits. Edit with CapCut quit, then relaunch.

## Verify before declaring done (always)

- Every path in BOTH JSONs exists on disk (0 missing). Script it; don't eyeball.
- Segment count, audio count, canvas WxH, fps, totalFrames match the EDL.
- Relaunch CapCut → the project appears (it rescans `com.lveditor.draft/` on launch). Open it.
- **Both the media library (top-left panel) AND the timeline must show real footage, not red
  "Media lost".** Library-links-but-timeline-red = the placeholder issue (step 6).

## Failure modes (RCA cheat sheet)
| Symptom | Cause | Fix |
|---|---|---|
| "File not accessible", 0/N linked | external paths w/ spaces (`GVB x AMBER/`, `Bee Gees …(CapCut).mp3`) | copy media inside (step 3), absolute internal paths |
| Library links but timeline = "Media Not Found" | `##_draftpath_placeholder_##` not resolving for segments | replace placeholder w/ absolute draft path (step 6) |
| Edits don't take after reopen | CapCut clobbered JSON from cache on open | quit CapCut before editing (step 8) |
| Only some link | edited `path` but not `file_Path` | fix BOTH keys (step 5) |
| Project not in list | gallery registry not rescanned | fully quit + relaunch CapCut |

## Don't
- Don't render-and-flatten if the user wants to edit — they need the clips as separate segments.
- Don't add transitions/effects unless asked; deliver clean cuts for the user to style.
- Don't trust your own "it should work" — verify the timeline visually (screenshot CapCut frontmost).

## Notes
- Existing exporter reference (copies media in): a project-local `capcut_draft.py`-style tool may
  exist (e.g. `ai-video-editing/src/kino/capcut_draft.py`) — reuse if its conventions match.
- Heavy file work (clone + copy GBs + rewrite JSON) is well-suited to a subagent; keep the main
  thread for orchestration + verification.
