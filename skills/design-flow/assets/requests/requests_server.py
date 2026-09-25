"""Standalone request queue for rooms without their own server.
usage: python3 requests_server.py [room_dir] [--port 7333]"""
import json, os, sys, http.server
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import requests_api
args = sys.argv[1:]; PORT = int(args[args.index('--port') + 1]) if '--port' in args else 7333
ROOT = os.path.abspath(next((a for a in args if not a.startswith('--') and not a.isdigit()), '.'))
class H(http.server.BaseHTTPRequestHandler):
    def _json(self, code, obj):
        b = json.dumps(obj).encode(); self.send_response(code)
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', 'content-type'); self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.send_header('content-type', 'application/json'); self.send_header('content-length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_OPTIONS(self): self._json(204, {})
    def do_GET(self):
        if self.path.startswith('/ping'): return self._json(200, {'ok': True, 'features': ['requests']})
        if not requests_api.handle(self, 'GET', self.path, None, ROOT): self._json(404, {'error': 'not found'})
    def do_POST(self):
        n = int(self.headers.get('content-length') or 0)
        try: body = json.loads(self.rfile.read(n) or b'{}')
        except Exception: return self._json(400, {'error': 'bad json'})
        if not requests_api.handle(self, 'POST', self.path, body, ROOT): self._json(404, {'error': 'not found'})
    def log_message(self, *a): pass
if __name__ == '__main__':
    print(f'requests queue for {ROOT} on http://127.0.0.1:{PORT}', flush=True)
    http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
