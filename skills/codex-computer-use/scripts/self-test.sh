#!/usr/bin/env bash
# One-minute proof that headless Codex computer-use works on this machine.
# Read-only: Codex only screenshots Finder and writes what it saw.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$(mktemp -d "${TMPDIR:-/tmp}/codex-selftest.XXXXXX")"
RESULT="$OUT/seen.txt"

grep -qE 'computer-use' "$HOME/.codex/config.toml" 2>/dev/null \
  || { echo "FAIL: no computer-use plugin in ~/.codex/config.toml (plain Codex CLI has no computer-use)"; exit 1; }

osascript -e 'tell application "Finder" to activate' >/dev/null 2>&1

"$HERE/run-codex-gui.sh" --timeout 180 --out "$OUT" "TEST TASK — use your computer-use tool. Finder is frontmost. Read-only: no clicking, no typing, no launching or switching apps, no settings changes.
1. Take a screenshot of the macOS screen via computer-use.
2. Write the frontmost app name and 2-3 visible items (window title, menu bar items) as plain text to $RESULT.
If computer-use fails, write 'NO SCREEN ACCESS: <exact error>' to $RESULT. Finish within 2 minutes." >/dev/null 2>&1
rc=$?

if [ -s "$RESULT" ] && grep -qi "finder" "$RESULT" && ! grep -qi "NO SCREEN ACCESS" "$RESULT"; then
  echo "PASS: Codex saw the screen ->"; sed 's/^/  /' "$RESULT"; exit 0
fi
echo "FAIL (rc=$rc). Result file:"; cat "$RESULT" 2>/dev/null || echo "  (none)"
echo "Events tail:"; tail -c 600 "$OUT/events.jsonl" 2>/dev/null
exit 1
