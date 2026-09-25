"""Design request queue: one JSON file per request in <root>/_requests/. Import into any room server, or run requests_server.py.
Status flow: pending -> building -> done | failed. The design-flow skill picks up pending files and builds them."""
import json, os, re, time, threading
LOCK = threading.Lock()
FIELDS = ('mode', 'name', 'base', 'mood', 'theme', 'palette', 'keep', 'avoid', 'screens', 'notes', 'inspiration', 'count')

def qdir(root):
    d = os.path.join(root, '_requests'); os.makedirs(d, exist_ok=True); return d

def slug(s):
    return (re.sub(r'[^a-z0-9]+', '-', str(s).lower()).strip('-') or 'design')[:40]

def list_requests(root):
    out = []
    d = qdir(root)
    for f in sorted(os.listdir(d)):
        if f.endswith('.json') and f != 'designs.json':
            try:
                with open(os.path.join(d, f)) as fh: out.append(json.load(fh))
            except Exception: pass
    return out

def create_request(root, body, room=''):
    req = {k: body.get(k) for k in FIELDS if body.get(k) not in (None, '', [])}
    if not req.get('name'): req['name'] = 'New design'  # Claude names it when it builds
    now = time.strftime('%Y-%m-%dT%H:%M:%S')
    rid = time.strftime('%Y%m%d-%H%M%S') + '-' + slug(req['name'])
    req.update({'id': rid, 'slug': slug(req['name']), 'status': 'pending', 'room': room or os.path.basename(os.path.abspath(root)), 'created': now, 'updated': now})
    with LOCK:
        with open(os.path.join(qdir(root), rid + '.json'), 'w') as fh: json.dump(req, fh, indent=1)
    return req

def handle(handler, method, path, body, root, room=''):
    """Return True if the path was a /requests route (the handler has already responded)."""
    if not path.startswith('/requests'): return False
    if method == 'GET': handler._json(200, {'requests': list_requests(root)}); return True
    if method == 'POST':
        try: handler._json(201, create_request(root, body or {}, room))
        except ValueError as e: handler._json(400, {'error': str(e)})
        return True
    return False
