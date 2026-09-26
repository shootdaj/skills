# Tiny CORS vote server for a design room. State: votes.json (latest pick per component), notes.json, kv-*.json
# (pins, duels), log: votes.jsonl. Also serves the design request queue (/requests) through requests_api.py.
# Run from the room: python3 _vote/server.py &   (port from room.js "api", else 7332). No setup: if that port is busy with
# another room, it moves to a free port and writes the new address back into room.js before the page reads it.
import json, os, re, sys, time, http.server, socket, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import requests_api
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE=os.path.dirname(os.path.abspath(__file__)); STATE=os.path.join(HERE,'votes.json'); LOG=os.path.join(HERE,'votes.jsonl'); NOTES=os.path.join(HERE,'notes.json')
def room_config():
    """room.js is JSON behind `window.ROOM =`; read it without a JS engine."""
    try:
        with open(os.path.join(ROOT,'room.js')) as f: src=f.read()
        src=re.sub(r'^\s*/\*.*?\*/','',src,flags=re.S)
        src=re.sub(r'^\s*window\.ROOM\s*=\s*','',src).strip().rstrip(';').strip()
        return json.loads(src)
    except Exception: return {}
CFG=room_config(); ROOM_NAME=CFG.get('name') or os.path.basename(ROOT)
m=re.search(r':(\d+)',CFG.get('api') or ''); PORT=int(m.group(1)) if m else 7332
def load_notes():
    try:
        with open(NOTES) as f: return json.load(f)
    except Exception: return {}
def save_notes(d):
    with open(NOTES,'w') as f: json.dump(d,f,indent=1)
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
        if requests_api.handle(self,'GET',self.path,None,ROOT,ROOM_NAME): return
        if self.path.startswith('/votes'): return self._json(200,load())
        if self.path.startswith('/notes'): return self._json(200,load_notes())
        if self.path.startswith('/kv/'):
            name=''.join(ch for ch in self.path[4:].split('?')[0] if ch.isalnum() or ch in '-_')[:40]
            try:
                with open(os.path.join(HERE,'kv-'+name+'.json')) as f: return self._json(200,json.load(f))
            except Exception: return self._json(200,{})
        if self.path.startswith('/ping'): return self._json(200,{'ok':True,'room':ROOM_NAME,'features':['requests']})
        return self._json(404,{'error':'not found'})
    def do_POST(self):
        n=int(self.headers.get('content-length') or 0)
        try: p=json.loads(self.rfile.read(n) or b'{}')
        except Exception: return self._json(400,{'error':'bad json'})
        if requests_api.handle(self,'POST',self.path,p,ROOT,ROOM_NAME): return
        if self.path.startswith('/kv/'):
            name=''.join(ch for ch in self.path[4:].split('?')[0] if ch.isalnum() or ch in '-_')[:40]
            with open(os.path.join(HERE,'kv-'+name+'.json'),'w') as f: json.dump(p,f,indent=1)
            return self._json(200,p)
        if self.path.startswith('/notes'):
            n=load_notes(); dsg=p.get('design')
            if dsg is not None:
                n[dsg]=p.get('text','')
                save_notes(n)
            return self._json(200,n)
        d=load(); c=p.get('component')
        if c:
            if p.get('design') is None: d.pop(c,None)
            else: d[c]={'design':p['design'],'label':p.get('label'),'ts':p.get('ts') or int(time.time()*1000)}
            save(d)
            with open(LOG,'a') as f: f.write(json.dumps({**p,'t':time.strftime('%Y-%m-%dT%H:%M:%S')})+'\n')
        return self._json(200,d)
    def log_message(self,*a): pass
def already_running(port):
    """True when the thing on the port is this room's own server (a second start is a no-op)."""
    try:
        with urllib.request.urlopen('http://127.0.0.1:%d/ping'%port,timeout=1) as r: d=json.load(r)
        return d.get('ok') and d.get('room')==ROOM_NAME
    except Exception: return False
def bind(port):
    try: return http.server.ThreadingHTTPServer(('127.0.0.1',port),H)
    except OSError: return None
def write_port(port):
    p=os.path.join(ROOT,'room.js')
    try:
        with open(p) as f: src=f.read()
        new=re.sub(r'("api"\s*:\s*"http://127\.0\.0\.1:)\d+',r'\g<1>%d'%port,src)
        if new==src and '"api"' not in src: new=src.replace('window.ROOM = {','window.ROOM = {\n  "api": "http://127.0.0.1:%d",'%port,1)
        with open(p,'w') as f: f.write(new)
    except Exception as e: print('could not write the port into room.js: %s'%e,file=sys.stderr)
if __name__=='__main__':
    if already_running(PORT): print('vote server already running on http://127.0.0.1:%d'%PORT,flush=True); sys.exit(0)
    srv=bind(PORT)
    if srv is None:
        srv=bind(0); PORT=srv.server_address[1]; write_port(PORT)
        print('port busy, moved to http://127.0.0.1:%d (written into room.js; reload the room if it is open)'%PORT,flush=True)
    print('VOTE_SERVER http://127.0.0.1:%d %s'%(PORT,ROOM_NAME),flush=True)
    srv.serve_forever()
