#!/usr/bin/env bash
# Compile the Swift helpers on first use into a cache dir. Sources ship; binaries do not.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
CACHE="${MUSIC_RIG_CACHE:-$HOME/.cache/music-rig-doctor}"
mkdir -p "$CACHE"
for t in multiout setoutput; do
  SRC="$HERE/$t.swift"; BIN="$CACHE/$t"
  [ -f "$SRC" ] || continue
  if [ ! -x "$BIN" ] || [ "$SRC" -nt "$BIN" ]; then
    /usr/bin/swiftc -O -o "$BIN" "$SRC" 2>/dev/null || { echo "build failed: $t" >&2; continue; }
    chmod +x "$BIN"
  fi
done
echo "$CACHE"
