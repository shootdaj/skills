#!/usr/bin/env python3
"""Send a raw command to the AbletonMCP remote script socket (port 9877).
Usage: livecmd.py <type> '<json params>'
   e.g. livecmd.py set_output_routing '{"track_index": 17, "type_name": "Ext. Out", "channel_name": "1/2"}'
        livecmd.py exec_python '{"code": "result = [t.name for t in song.tracks]"}'
"""
import json, socket, sys
cmd = {"type": sys.argv[1], "params": json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}}
s = socket.create_connection(("127.0.0.1", 9877), timeout=15)
s.sendall(json.dumps(cmd).encode())
buf = b""
while True:
    chunk = s.recv(65536)
    if not chunk: break
    buf += chunk
    try:
        json.loads(buf.decode()); break
    except Exception:
        continue
s.close()
print(buf.decode())
