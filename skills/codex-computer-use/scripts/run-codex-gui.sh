#!/usr/bin/env bash
# Launch Codex CLI headlessly for one GUI work order and collect its result.
#
# Usage: run-codex-gui.sh [--timeout SEC] [--out DIR] [--background] "WORK ORDER"
#
# Writes <out>/last.txt (Codex final message), <out>/events.jsonl (JSON events),
# <out>/done (exit code) . Exit 124 on timeout.
set -u

TIMEOUT=300
OUT=""
BACKGROUND=0
while [ $# -gt 0 ]; do
  case "$1" in
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --background) BACKGROUND=1; shift ;;
    --) shift; break ;;
    -*) echo "unknown flag: $1" >&2; exit 2 ;;
    *) break ;;
  esac
done
PROMPT="${1:-}"
[ -z "$PROMPT" ] && { echo "usage: $0 [--timeout SEC] [--out DIR] [--background] \"WORK ORDER\"" >&2; exit 2; }
command -v codex >/dev/null || { echo "codex CLI not on PATH" >&2; exit 3; }
[ -z "$OUT" ] && OUT="$(mktemp -d "${TMPDIR:-/tmp}/codex-gui.XXXXXX")"
mkdir -p "$OUT"
rm -f "$OUT/last.txt" "$OUT/events.jsonl" "$OUT/done"

run() {
  # </dev/null: without a TTY, codex exec blocks on stdin forever.
  # bypass flag: config approval_mode=approve would wait for a human click.
  codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check --json \
    -o "$OUT/last.txt" "$PROMPT" </dev/null >"$OUT/events.jsonl" 2>&1 &
  local pid=$!
  local waited=0
  while kill -0 "$pid" 2>/dev/null; do
    if [ "$waited" -ge "$TIMEOUT" ]; then
      kill "$pid" 2>/dev/null; sleep 1; kill -9 "$pid" 2>/dev/null
      echo 124 >"$OUT/done"; echo "TIMEOUT after ${TIMEOUT}s; out=$OUT" >&2; return 124
    fi
    sleep 2; waited=$((waited + 2))
  done
  wait "$pid"; local rc=$?
  echo "$rc" >"$OUT/done"
  echo "out=$OUT rc=$rc"
  [ -s "$OUT/last.txt" ] && { echo "--- last message ---"; cat "$OUT/last.txt"; }
  return "$rc"
}

if [ "$BACKGROUND" -eq 1 ]; then
  run >"$OUT/runner.log" 2>&1 &
  echo "background out=$OUT (poll $OUT/done)"
  exit 0
fi
run
