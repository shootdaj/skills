---
name: codex-computer-use
description: Drive the OpenAI Codex CLI headlessly to perform macOS GUI-only steps (dropdowns, drags, dialogs, palette installs, apps with no API) via Codex's computer-use, then verify the result through an independent source. Use from Claude Code, Cursor, or Hermes when a task needs real desktop clicking the current harness cannot do, when the user says "have Codex click that", "use Codex computer use", "Codex can do the UI part", or when a plan marks a step as computer-use-only. Not for use inside Codex itself.
---

# Codex Computer Use

Codex is the pair of hands; the calling harness stays the brain. Write a narrow
work order, launch Codex without a terminal, collect its result file, then
prove the outcome through something that is not Codex's own summary.

Run `scripts/self-test.sh` once per machine before the first real job.

## Preconditions

- `codex` on PATH and signed in (`codex --version` works).
- Codex's computer-use plugin configured in `~/.codex/config.toml`
  (`[mcp_servers.computer-use]` or `plugins."computer-use@openai-bundled"`).
  Plain Codex CLI has no computer-use; without that entry, stop and say so.
- The target app must be able to come to the foreground. macOS Accessibility
  and Screen Recording permissions belong to Codex's computer-use client, not
  to the calling harness.

## Workflow

1. **Scope the work order.** One GUI outcome per launch. State the app, the
   exact window/menu path, the exact value to set, what to leave alone, and
   the stop conditions. Include a no-touch list every time; Codex does not
   remember earlier launches.
2. **Bring the target app to the front.** Computer-use refuses while the Codex
   desktop app is frontmost.

   ```bash
   osascript -e 'tell application "Ableton Live 11 Suite" to activate'
   ```

3. **Launch with the fixed-invocation script.** It closes stdin, pre-clears
   approvals, streams JSON events, writes the final message to a file, and
   kills a hung run at the timeout.

   ```bash
   scripts/run-codex-gui.sh --timeout 300 --out /tmp/job1 "WORK ORDER TEXT"
   ```

   Outputs: `/tmp/job1/last.txt` (Codex's final message), `/tmp/job1/events.jsonl`
   (tool calls, errors), exit code 0 on completion.
4. **Verify independently.** Read the actual state the click was supposed to
   change: an API call, a preferences file, `osascript` reading a menu state,
   a directory listing, a screenshot taken by the harness. Never accept
   `last.txt` as proof.
5. **Retry narrowly on mismatch.** Re-issue a corrected work order describing
   what was observed versus expected. Two failed retries on the same step means
   stop and report; do not widen scope to "figure it out".

## Work-order shape

```text
GUI TASK — <app name>, <one sentence outcome>.
Path: <Menu > Submenu > Tab > Control>.
Set: <control> = "<exact value>".
Leave unchanged: <everything else on that screen, named>.
Do not: launch other apps, change other settings, save files, quit apps.
When done: describe the final visible state of that screen in 3 lines.
If the control or value is missing: stop, describe what is visible instead.
```

## Failure signatures

| Symptom | Cause | Fix |
|---|---|---|
| Runs forever, `events.jsonl` says `Reading additional input from stdin...` | stdin left open | the script uses `</dev/null`; keep it |
| Runs forever, no events | waiting for human approval | `--dangerously-bypass-approvals-and-sandbox` (script default) |
| Result: `not allowed to use the app 'com.openai.codex'` | Codex desktop app was frontmost | activate the target app first (step 2) |
| Result: `NO SCREEN ACCESS` or permission error | Accessibility / Screen Recording not granted to Codex's computer-use client | user grants in System Settings > Privacy & Security; not scriptable |
| Exit 124 from script | timeout hit | shorten the work order or raise `--timeout` |

## Safety rules

- The bypass flag disables Codex's own sandbox: the work order is the only
  guardrail. Keep it narrow and list what must not change.
- Never delegate destructive GUI actions (delete, erase, factory reset,
  uninstall, send, purchase). Prepare-only for those; the user clicks.
- Do not include secrets in the work order; Codex may echo it into logs.
- Kill any launch you started that overruns; never leave a headless Codex
  waiting in the background.

## Verification examples

- Ableton output device changed → `defaults read` / app prefs file, or
  AbletonMCP where installed, or an `osascript` System Events read of the
  Preferences window.
- Aggregate device visible → `system_profiler SPAudioDataType`.
- File installed by a palette/installer → `ls` the expected path.
- Setting inside an app with no API → have the harness take its own screenshot
  (`screencapture -x`) and read it, not Codex.

<cursor_skill_adapter>
Run the two shell steps (activate app, `scripts/run-codex-gui.sh`) through the
terminal tool; read result files with the file reader. Verification stays
harness-side.
</cursor_skill_adapter>

<hermes_skill_adapter>
Use the shell tool for activation and launch. If the shell tool cannot hold a
process for the full timeout, pass `--background` to the script and poll
`<out>/done` with the file tool.
</hermes_skill_adapter>
