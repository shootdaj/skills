# Tiny CORS vote server for the design comparison. State: votes.json (latest pick per component), log: votes.jsonl
import json, os, time, http.server, threading
LOCK=threading.Lock()
HERE=os.path.dirname(os.path.abspath(__file__)); STATE=os.path.join(HERE,'votes.json'); LOG=os.path.join(HERE,'votes.jsonl')
def load():
    try:
        with open(STATE) as f: return json.load(f)
    except Exception: return {}
def save(d):
    with open(STATE,'w') as f: json.dump(d,f,indent=1)
class H(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Access-Control-Allow-Headers','content-type'); self.send_header('Access-Control-Allow-Methods','GET,POST,OPTIONS')
    def _json(self,code,obj):
        b=json.dumps(obj).encode(); self.send_response(code); self._cors(); self.send_header('content-type','application/json'); self.send_header('content-length',str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_OPTIONS(self): self.send_response(204); self._cors(); self.end_headers()
    def do_GET(self):
        if self.path.startswith('/votes'):
            with LOCK: d=load()
            return self._json(200,d)
        if self.path.startswith('/ping'): return self._json(200,{'ok':True})
        return self._json(404,{'error':'not found'})
    def do_POST(self):
        n=int(self.headers.get('content-length') or 0)
        try: p=json.loads(self.rfile.read(n) or b'{}')
        except Exception: return self._json(400,{'error':'bad json'})
        with LOCK:
            d=load(); c=p.get('component')
            if c:
                if p.get('design') is None: d.pop(c,None)
                else: d[c]={'design':p['design'],'label':p.get('label'),'ts':p.get('ts') or int(time.time()*1000)}
                save(d)
                with open(LOG,'a') as f: f.write(json.dumps({**p,'t':time.strftime('%Y-%m-%dT%H:%M:%S')})+'\n')
        return self._json(200,d)
    def log_message(self,*a): pass
if __name__=='__main__':
    http.server.ThreadingHTTPServer(('127.0.0.1',7331),H).serve_forever()
