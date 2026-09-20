#!/usr/bin/env python3
"""Create/fill Lexicon DJ playlists through the Local API, verifying counts.

usage:
  lexicon_playlist.py tree                       # print playlist tree with ids/counts (read-only SQLite)
  lexicon_playlist.py ids FOLDER [FOLDER...]      # map local mp3 filenames -> Lexicon track ids (NFC-safe)
  lexicon_playlist.py create NAME --parent ID --ids-from file.json [--folder]
  lexicon_playlist.py create NAME --parent ID --from-dir DIR      # every mp3 in DIR that Lexicon knows
  lexicon_playlist.py verify ID                  # API count vs SQLite count

Rules baked in: never write SQLite; playlist writes only via
http://localhost:48624/v1 (Settings → Integrations → Enable Local API); count is
re-read after every write; batches of 400; the API's `index` insert can displace
a track so it is never used here; JSON needs strict=False.
"""
import argparse, glob, json, os, sqlite3, sys, unicodedata, urllib.request
API = 'http://localhost:48624/v1'
DB = os.path.expanduser('~/Library/Application Support/lexicon/main.db')
N = lambda s: unicodedata.normalize('NFC', s)

def call(method, path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Content-Type': 'application/json'}, method=method)
    return json.JSONDecoder(strict=False).decode(urllib.request.urlopen(req, timeout=60).read().decode())
def db(): return sqlite3.connect(f'file:{DB}?mode=ro', uri=True)
def count(pid): return len(call('GET', f'/playlist?id={pid}')['data']['playlist'].get('trackIds') or [])

def ids_for(dirs):
    files = {N(os.path.basename(f)) for d in dirs for f in glob.glob(os.path.join(d, '**', '*.mp3'), recursive=True) if '_rejected' not in f}
    con = db(); byname = {}
    for tid, loc in con.execute('select id, location from Track'):
        b = N(os.path.basename(loc or ''))
        if b in files: byname[b] = tid
    missing = sorted(files - set(byname))
    return [byname[f] for f in sorted(byname)], missing

ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest='cmd', required=True)
sub.add_parser('tree')
p = sub.add_parser('ids'); p.add_argument('dirs', nargs='+')
p = sub.add_parser('create'); p.add_argument('name'); p.add_argument('--parent', type=int, required=True)
p.add_argument('--ids-from'); p.add_argument('--from-dir', nargs='*'); p.add_argument('--folder', action='store_true')
p = sub.add_parser('verify'); p.add_argument('id', type=int)
a = ap.parse_args()

if a.cmd == 'tree':
    con = db(); rows = con.execute('select id,name,type,parentId from Playlist').fetchall()
    cnt = dict(con.execute('select playlistId,count(*) from LinkTrackPlaylist group by playlistId'))
    kids = {}
    for i, n, t, pid in rows: kids.setdefault(pid, []).append((i, n, t))
    def walk(pid, depth):
        for i, n, t in sorted(kids.get(pid, []), key=lambda x: x[1].lower()):
            folder = t == 1 or i in kids
            print('  ' * depth + f"{i:>5} {'/' if folder else '-'} {n}" + ('' if folder else f"  ({cnt.get(i, 0)})")); walk(i, depth + 1)
    roots = [k for k in kids if k in (None, 0, '')] or [None]
    for r in roots: walk(r, 0)
elif a.cmd == 'ids':
    ids, missing = ids_for(a.dirs); print(json.dumps({'ids': ids, 'missing': missing}, indent=1))
    print(f'{len(ids)} matched, {len(missing)} not in Lexicon (import the folder first)', file=sys.stderr)
elif a.cmd == 'create':
    con = db()
    if con.execute('select 1 from Playlist where parentId=? and name=?', (a.parent, a.name)).fetchone():
        sys.exit(f'"{a.name}" already exists under {a.parent}; refusing to duplicate')
    ids = []
    if a.ids_from: ids = json.load(open(a.ids_from)); ids = ids.get('ids', ids) if isinstance(ids, dict) else ids
    if a.from_dir:
        got, missing = ids_for(a.from_dir); ids += got
        if missing: print(f'warning: {len(missing)} files not in Lexicon, skipped', file=sys.stderr)
    seen = set(); ids = [i for i in ids if not (i in seen or seen.add(i))]
    pid = call('POST', '/playlist', {'name': a.name, 'parentId': a.parent, 'type': '1' if a.folder else '2'})['data']['id']
    for k in range(0, len(ids), 400): call('PATCH', '/playlist-tracks', {'id': pid, 'trackIds': ids[k:k + 400]})
    got = count(pid); print(f'{a.name} id={pid} wanted={len(ids)} got={got} ' + ('OK' if got == len(ids) else 'MISMATCH'))
    sys.exit(0 if got == len(ids) else 1)
elif a.cmd == 'verify':
    con = db(); sq = con.execute('select count(*) from LinkTrackPlaylist where playlistId=?', (a.id,)).fetchone()[0]
    print(f'playlist {a.id}: api={count(a.id)} sqlite={sq}')
