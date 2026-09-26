---
name: music-rig-doctor
description: Diagnose and repair a macOS music and visual rig - CoreAudio devices and aggregates, Ableton Live routing, djay Pro, Traktor, TouchDesigner, sACN/Art-Net/DDP LED fixtures, Syphon/OBS, and MIDI controllers. Use when there is no sound, sound comes out of the wrong output, a named fixture such as the HyperCube is not reacting, there is latency or glitching, or a rig mode needs setting up or saving. Starts by asking what is wrong, measures everything on the path to that symptom, and only changes what lies on that path. Also saves and restores named rig profiles. macOS only.
---

# music-rig-doctor

A rig fails in layers. One symptom usually has several independent causes, and
each one alone produces the same silence - so fixing any single fault changes
nothing and it looks like the fix did not work. Measure the whole path, report
every break, change only what the stated problem needs.

## The two rules

1. **Never ask what can be measured.** Device channel maps, aggregate member
   order, who holds which device, current routing, live levels, whether the
   interface is plugged in - all of it is readable. Ask only intent.
2. **Only change what lies on the path to the stated problem.** Anything else
   found along the way is reported, never touched. A rig that "sounds wrong" is
   not permission to rebuild audio devices.

## Phase 0 - What is wrong

Ask this first, before any scanning. It scopes everything after it.

Build the menu from `assets/fixtures/*.json` so it names real hardware, never a
category. "Visuals" is wrong; "HyperCube" is right.

```
· No sound at all
· <fixture name> is not reacting          (one line per registered fixture)
· Sound from the wrong output
· Latency / glitching / dropouts
· MIDI controller not responding
· Nothing is broken - set up <profile>
· Nothing is broken - save a profile
· Something else (describe)
```

Two answers skip diagnosis entirely and go straight to Phase 6: set up a
profile, and save a profile.

## Phase 1 - Discover

`scripts/rig-scan` writes the whole picture to JSON. Run it with the scope from
Phase 0; it skips subsystems the symptom cannot involve.

| Subsystem | What it reads |
|---|---|
| CoreAudio | every device, channel count, rate, transport; for aggregates the **member order and resulting channel offsets**; system default in/out; which processes hold which device |
| Signal | `scripts/rig-probe` runs ffmpeg `volumedetect` on each virtual device. `-91 dB` is digital silence and proves nothing upstream is writing |
| Ableton Live | master/return/track routing, monitor states, meters, **which output channels are enabled**, tempo, is_playing - over the raw socket on 9877 |
| TouchDesigner | audio device, rate, buffer, live band levels, sender state - over HTTP on 9981 |
| Fixtures | each `assets/fixtures/*.json`, probed by its own health check |
| MIDI | connected controllers; mappings in the live folder diffed against the repo copies |
| OBS | scene collection, Syphon source binding, audio source, websocket reachability |

Discovery walks the **whole path** for the scope, not just the suspected spot.
Scope limits what gets *changed*, not what gets *looked at*.

**Desk vs couch is inferred** from whether the audio interface is present. Never
ask. The consequences of that state are in `references/gotchas.md`.

## Phase 2 - Diagnose

Build the real signal graph from the measurements, not from what the config
claims, then walk it and collect **every** break - not the first one.

Compare against `references/gotchas.md` before theorising. Most failures are a
known one.

If two or more fixtures are dead, look upstream at their shared path (audio into
TouchDesigner) before investigating either fixture.

## Phase 3 - Ask what is left

The symptom usually answers source and destination already. Ask only what
remains:

| Question | Why it cannot be measured |
|---|---|
| Source | intent |
| Destination | intent |
| Separate cue output? | cannot be inferred from device lists |
| **Mid-set, or setup time?** | **gates every destructive action** |

If the answer is mid-set: no aggregate rebuilds, no device removal, no GUI
automation. Say what would fix it and wait.

## Phase 4 - Plan

Show every change as `before -> after` with its exact undo command. Group by
subsystem. State which are reversible by API and which are not.

Modes, default `plan`:

- **plan** - show everything, apply on one confirmation.
- **safe** - apply reversible API changes automatically; stop and ask before any
  CoreAudio device rebuild or GUI step.
- **auto** - apply everything, report after. **Refuse to run in auto if Phase 3
  said mid-set.**

## Phase 5 - Apply, safest first

1. **API** - Ableton socket, TouchDesigner HTTP, WLED/fixture JSON, obs-websocket.
2. **Shell** - `scripts/setoutput`, `scripts/multiout`.
3. **GUI** - `cliclick` only where no API exists. Live's Output Config is the
   main one. See `references/ableton.md`.

After any aggregate change, **re-check every app that held that device** - they
drop it silently. Verify by probing for signal, not by reading settings.

## Phase 6 - Verify every hop

Never verify only the endpoint. Walk the chain and prove signal at each stage:

```
source app -> virtual cable -> DAW input -> master -> output device
           -> speakers                    -> TD -> fixture transport -> fixture
```

An endpoint can look healthy while three stages upstream are broken.

For fixtures, use the health check in the fixture file - a power or activity
reading that changes with the music, not just a reachable address.

**A camera cannot verify anything temporal.** A 30 fps rolling-shutter webcam
cannot see 60 Hz flicker and will report a broken rig as fine. Use it for colour
and framing only; measure timing at the source.

## Phase 7 - Report and offer

Report three things, separately:

1. **Fixed** - what changed, with undo lines.
2. **Found but not touched** - off-path issues, as a list to act on or ignore.
3. **Blocked** - anything needing a GUI step mid-set, or hardware action.

Then offer to save the working state as a profile.

## Profiles

`assets/profiles/<name>.json` holds a full snapshot: audio devices and the
system default, Ableton routing, TouchDesigner settings, fixture state.
`scripts/rig-apply <name>` restores it.

Suggested set: `desk`, `couch`, `dj-only`, `dj+visuals`, `production`.

Restoring never rebuilds CoreAudio devices without confirmation, even in auto.

## Fixtures

`assets/fixtures/*.json` - one file per visual output. Each declares transport,
address, pixel or channel layout, a health check, and what feeds it inside
TouchDesigner. See `references/fixtures.md` for the schema and for discovering
new fixtures on the network.

Adding hardware is a new file, never a change to this skill.

## Asking the questions

Shared contract: ask the Phase 0 symptom first and alone; ask Phase 3 questions
in a single round; never ask anything in Phase 1's discover list.

<claude_code_adapter>
Use `AskUserQuestion`. Phase 0 is one question built from the fixture registry.
Phase 3 is one call with the remaining questions.
</claude_code_adapter>

<codex_cursor_hermes_adapter>
Ask as a short numbered list in one message. Accept a number or free text.
Same questions, same order, same rule about never asking measurable facts.
</codex_cursor_hermes_adapter>

## Constraints

- **macOS only.** CoreAudio, `cliclick`, `osascript`, Syphon. Do nothing on
  other platforms.
- Reach integrations over **raw sockets and HTTP**, never through MCP tools, so
  the skill behaves identically in every harness and survives an MCP outage.
- Never delete a CoreAudio device that is not an aggregate. `scripts/multiout`
  already refuses, and that guard must stay.
- Never use `rm` on user files. Move to `~/.Trash/`.
- Record every change with its before-value as you go, not at the end.
