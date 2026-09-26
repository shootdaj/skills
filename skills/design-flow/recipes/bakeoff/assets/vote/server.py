# Tiny CORS vote server for the design comparison. State: votes.json (latest pick per component), log: votes.jsonl
# usage: python3 server.py [--port 7331] &   A copy already on the port is reused; another program there means a free
# port is picked and printed (give it to vote.js as data-api and to ballot.html as ?api=).
import json, os, sys, time, http.server, threading, urllib.request
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
    a=sys.argv[1:]; PORT=int(a[a.index('--port')+1]) if '--port' in a else 7331
    try:
        with urllib.request.urlopen('http://127.0.0.1:%d/ping'%PORT,timeout=1) as r:
            if json.load(r).get('ok'): print('vote server already running on http://127.0.0.1:%d'%PORT,flush=True); sys.exit(0)
    except Exception: pass
    try: srv=http.server.ThreadingHTTPServer(('127.0.0.1',PORT),H)
    except OSError:
        srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),H); PORT=srv.server_address[1]
        print('port busy, moved to %d: add data-api="http://127.0.0.1:%d" to the vote.js tag and ?api=http://127.0.0.1:%d to ballot.html'%(PORT,PORT,PORT),flush=True)
    print('VOTE_SERVER http://127.0.0.1:%d'%PORT,flush=True)
    srv.serve_forever()
