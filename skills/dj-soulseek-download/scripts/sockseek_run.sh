#!/usr/bin/env bash
# One sockseek wave: download every row of a CSV into OUT_DIR, log to OUT_DIR.log.
#   sockseek_run.sh list.csv out_dir [extra sockseek flags]
# Env: SOCKSEEK (binary, default ~/.local/bin/sockseek)
#
# Flags that worked (2026-09): --length-tol=-1 (Spotify lengths vs extended mixes
# differ a lot; note the `=`), --pref-strict-artist (rank, don't filter), 6 jobs.
# Do NOT add --strict-title: it drops most matches on Soulseek's messy filenames.
# For a re-fetch of rejects add: --min-bitrate 256 --strict-title --no-skip-existing
#   --index-path redo_index.csv  (the default _index.csv would skip "already done" rows).
set -euo pipefail
CSV="$1"; OUT="$2"; shift 2
SOCKSEEK="${SOCKSEEK:-$HOME/.local/bin/sockseek}"
[[ -x "$SOCKSEEK" ]] || { echo "sockseek not found at $SOCKSEEK (install: github.com/fiso64/sockseek releases, osx-arm64 tarball)" >&2; exit 2; }
[[ -f "$HOME/.config/sockseek/sockseek.conf" ]] || { echo "missing ~/.config/sockseek/sockseek.conf (username/password/output-dir/format=mp3)" >&2; exit 2; }
if pgrep -x SoulseekQt >/dev/null; then
  echo "SoulseekQt is running with (probably) the same account; quitting it" >&2
  osascript -e 'tell application "SoulseekQt" to quit' >/dev/null 2>&1 || true; sleep 2
fi
mkdir -p "$OUT"
"$SOCKSEEK" "$CSV" --length-tol=-1 --pref-strict-artist --concurrent-jobs 6 -o "$OUT" "$@" > "$OUT.log" 2>&1 || true
grep -E 'Completed:' "$OUT.log" || tail -3 "$OUT.log"
grep -h 'SongJob: failed' "$OUT.log" | sed -E 's/.*failed \[([^]]*)\]: /\1 | /' | sort | uniq -c | sort -rn | head -5 || true
