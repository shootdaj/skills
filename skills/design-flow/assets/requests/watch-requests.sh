#!/bin/sh
# Print one line per new pending design request. Made for Claude Code's Monitor tool; any shell works.
# usage: sh watch-requests.sh <room_dir> [interval_seconds]
DIR="${1:-.}/_requests"; INT="${2:-5}"; SEEN=""
mkdir -p "$DIR"
while true; do
  for f in "$DIR"/*.json; do
    [ -e "$f" ] || continue
    case "$f" in */designs.json) continue;; esac
    case " $SEEN " in *" $f "*) continue;; esac
    if grep -q '"status": "pending"' "$f"; then echo "NEW_REQUEST $f"; SEEN="$SEEN $f"; fi
  done
  sleep "$INT"
done
