#!/usr/bin/env bash
# Run a Python script inside TouchDesigner via the MCP bridge WebServer.
# Usage: tdexec.sh <file.py>   |   tdexec.sh -e "python expr/statements"
set -u
if [ "${1:-}" = "-e" ]; then SCRIPT="$2"; else SCRIPT="$(cat "$1")"; fi
python3 - "$SCRIPT" <<'PY'
import json, sys, urllib.request
script = sys.argv[1]
req = urllib.request.Request("http://127.0.0.1:9981/api/td/server/exec",
    data=json.dumps({"script": script}).encode(), method="POST",
    headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=600) as r:
    out = json.loads(r.read().decode())
if out.get("success"):
    d = out["data"]
    print(d.get("result") if d.get("result") is not None else "")
    if d.get("stderr"): print("STDERR:", d["stderr"], file=sys.stderr)
else:
    print("ERROR:", out.get("error"), file=sys.stderr); sys.exit(1)
PY
