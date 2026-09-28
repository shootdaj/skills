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

`scripts/rig-chain` turns that into the signal path with a status per hop, and
**asserts the routing rules in code** rather than leaving them as prose here.
Add `--probe` to measure each virtual device as it goes.

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

**Snapshot before the first change. Always, in every mode.** It takes under a
second and it is the only thing that makes a run reversible without depending on
anyone writing undo lines correctly:

```bash
scripts/rig-undo --snap "<the symptom being fixed>"
```

Then, in this order:

1. **API** - Ableton socket, TouchDesigner HTTP, WLED/fixture JSON, obs-websocket.
2. **Shell** - `scripts/setoutput`, `scripts/multiout`.
3. **GUI** - `cliclick` only where no API exists. Live's Output Config is the
   main one. See `references/ableton.md`.

Snapshot again after a run that worked, so the good state is the newest one.

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

**Lead with the chain, not with prose.** `scripts/rig-chain --probe` draws the
signal path with a status per hop and the break marked in place. A reader sees
where it stops and what is proven in one glance; a paragraph buries that.

```
  djay Pro                     o  running
  |
  BlackHole 16ch               o  -91.0 dB  (silent - nothing upstream is writing)
  |
     -> arrives at Live 1/2    o  8 pairs offered, 16-channel device
     X
     BREAK                     X  djay Pro listening on 9/10
     |
  Live djay Pro track          X  on 9/10, monitor 0, meter 0.0
  |
  Live master   Ext. Out 1/2   *  only pair on a 2-channel device - correct
```

Marks: `*` proven by measurement, `o` healthy but idle, `X` break, `!` broken
but off-path. Put the measured value on the hop, not in a sentence after it.

Then three lists, in this order:

1. **Fixed** - what changed, with undo lines.
2. **Found but not touched** - off-path issues, to act on or ignore.
3. **Blocked** - anything needing a GUI step mid-set, or hardware action.

Say plainly what could not be proven. "The source was not playing, so the fix is
argued from the channel count, not demonstrated" is worth more than an implied
success.

Always end with the rollback line, so it is one command and not a reconstruction:

```
Undo this run:  scripts/rig-undo <snapshot id>
```

Then offer to save the working state as a profile.

## Profiles

`assets/profiles/<name>.json` holds a full snapshot: audio devices and the
system default, Ableton routing, TouchDesigner settings, fixture state.
`scripts/rig-apply <name>` restores it.

Suggested set: `desk`, `couch`, `dj-only`, `dj+visuals`, `production`.

Restoring never rebuilds CoreAudio devices without confirmation, even in auto.

## The chain

`scripts/rig-chain` is both the diagram and the rule checker.

```bash
rig-chain              the path, status per hop
rig-chain --probe      also measure each virtual device (slower, proves signal)
rig-chain --json       machine readable, to reason over
```

Rules it asserts in code, so they cannot be missed by whoever is reading:

- **A source track must listen on the pair its input device actually carries.**
  Count the stereo pairs the device offers: 8 pairs means a 16-channel device,
  so a cable writing its own channels 1-2 lands on Live's `1/2`. More pairs mean
  the interface is present and it lands on `7/8`. A track on any other pair is
  silent with no error anywhere.
- **Too few offered output channels means Output Config, not routing.**
- **A multi-output whose hardware leg is absent makes no sound**, however
  healthy the device looks.
- **A reachable port is not a working integration.**

Adding a rule means adding it here, in code, not as prose in `gotchas.md`.

## Undo

`scripts/rig-undo` captures the rig before a change and rolls it back after.
Snapshots live outside the package in `~/.local/state/music-rig-doctor/` so they
survive reinstalling the skill, and the newest 40 are kept.

```bash
rig-undo --snap "<why>"    capture now (fast scope, under a second)
rig-undo --list            newest first, with what each one was for
rig-undo --diff            what has changed since the newest snapshot
rig-undo                   restore the newest, after showing the plan
rig-undo <id> --dry-run    show what would change, touch nothing
```

It restores the system output device, Live's master routing and Live's per-track
input routing. **Hardware differences it reports but cannot fix** - a device that
has since been unplugged is named, not silently skipped.

This exists because the written rule "record every change with its before-value"
is a discipline, and disciplines fail. A snapshot does not.

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
- Snapshot with `rig-undo --snap` before the first change, in every mode.
- Record every change with its before-value as you go, not at the end. The
  snapshot is the safety net; the written undo lines are for the reader.
