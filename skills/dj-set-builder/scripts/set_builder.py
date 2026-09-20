#!/usr/bin/env python3
"""Order tracks into phases with a greedy Camelot walk, compute blend partners
and waveform peaks, write .m3u8 per phase and set.json for the vibe report.

usage: set_builder.py plan.json out_dir

plan.json:
{
  "gig": "Amber Rooftop Bar · Sat 20 Sep · 9pm-midnight",
  "phases": [
    {"name": "Disco house · funk · vocals", "slot": "9-10 pm", "why": "…",
     "cap": 40, "sources": ["/abs/dir/p1_disco", "/abs/dir/w2_p1"],
     "library": [{"path": "/abs/file.mp3", "artist": "…", "title": "…", "key": "9A", "bpm": 124, "energy": 7, "lexid": 123}]}
  ]
}
Every mp3 under each source dir is a candidate; its key/energy/bpm come from
<dir>/tags.json (mik_tag.py) or ID3. Library rows are optional pre-analysed tracks.

Rules (as used 2026-09): keep top `cap` tracks by MIK energy, then walk from the
lowest BPM choosing the cheapest next track where cost = key distance
(same 0 / ±1 or relative 1 / two-steps 2 / clash = disallowed) + 0.6 × BPM% +
0.4 × energy delta, BPM within 4 %. Blend partners = 5 cheapest per track.
"""
import glob, json, os, re, subprocess, sys, unicodedata
import numpy as np
from mutagen.id3 import ID3
CAM_NAME = {'1A':'Abm','2A':'Ebm','3A':'Bbm','4A':'Fm','5A':'Cm','6A':'Gm','7A':'Dm','8A':'Am','9A':'Em','10A':'Bm','11A':'F#m','12A':'C#m',
            '1B':'B','2B':'F#','3B':'Db','4B':'Ab','5B':'Eb','6B':'Bb','7B':'F','8B':'C','9B':'G','10B':'D','11B':'A','12B':'E'}
NAME_CAM = {v: k for k, v in CAM_NAME.items()}
ENH = {'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#','C#':'Db','D#':'Eb','G#':'Ab','A#':'Bb'}
SR, N = 11025, 600

def tocam(k):
    k = (k or '').strip().replace('maj', '').replace('min', 'm').replace(' ', '')
    if k in CAM_NAME: return k
    if k in NAME_CAM: return NAME_CAM[k]
    root, mode = (k[:-1], 'm') if k.endswith('m') else (k, '')
    return NAME_CAM.get((ENH.get(root) or '') + mode)

def keyrel(a, b):
    if not a or not b: return 3
    na, la, nb, lb = int(a[:-1]), a[-1], int(b[:-1]), b[-1]
    if a == b: return 0
    d = min((na - nb) % 12, (nb - na) % 12)
    if la == lb and d == 1: return 1
    if na == nb: return 1
    if la == lb and d == 2: return 2
    if d == 1: return 2
    return 3
REL = {0: 'same key', 1: '±1 / relative', 2: '2 steps'}

def bcost(a, b):
    if not a['bpm'] or not b['bpm']: return 9
    pct = abs(a['bpm'] - b['bpm']) / a['bpm'] * 100; kc = keyrel(a['key'], b['key'])
    if pct > 4 or kc >= 3: return 9
    return kc + pct * 0.6 + abs((a['energy_mik'] or 6) - (b['energy_mik'] or 6)) * 0.4

def peaks(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    y = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if not len(y): return {'dur': 0, 'peaks': [], 'intro': 0, 'outro': 0}
    dur = len(y) / SR; seg = np.array_split(y, N)
    pk = [round(float(np.abs(s).max()), 3) if len(s) else 0 for s in seg]
    rms = np.array([float(np.sqrt(np.mean(s * s))) if len(s) else 0 for s in seg]); rms = rms / (rms.max() or 1)
    idx = np.where(rms > 0.55)[0]
    return {'dur': round(dur, 2), 'peaks': pk, 'intro': round(float(idx[0] / N * dur) if len(idx) else 0, 1),
            'outro': round(float(idx[-1] / N * dur) if len(idx) else dur, 1)}

def id3(f):
    try: t = ID3(f); return str(t.get('TPE1', '')), str(t.get('TIT2', ''))
    except Exception: return '', ''

plan = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
audio_dir = os.path.join(out, 'audio'); os.makedirs(audio_dir, exist_ok=True)
recs, cache_p = [], os.path.join(out, 'peaks_cache.json')
pcache = json.load(open(cache_p)) if os.path.exists(cache_p) else {}
def add(pi, src, path, artist, title, key, energy, bpm, bpm_src, lexid=None):
    base = os.path.basename(path); dst = os.path.join(audio_dir, base)
    if not os.path.exists(dst):
        try: os.link(path, dst)
        except OSError: subprocess.run(['cp', path, dst])
    if path not in pcache: pcache[path] = peaks(path)
    a = pcache[path]; fn = base.lower()
    if bpm:
        while bpm < 100: bpm *= 2
        while bpm > 150: bpm /= 2
    recs.append({'id': len(recs), 'pl': pi, 'src': src, 'artist': artist or '?', 'title': title or os.path.splitext(base)[0],
                 'file': f'audio/{base}', 'base': base, 'path': path, 'lexid': lexid, 'bpm': round(bpm) if bpm else None, 'bpm_src': bpm_src,
                 'key': key, 'keyname': CAM_NAME.get(key, ''), 'energy_mik': energy, 'dur': a['dur'], 'fmt': os.path.splitext(base)[1].strip('.'),
                 'version': 'Extended' if 'extended' in fn else ('Remix/Edit' if re.search(r'remix|edit|rework', fn) else 'Original'),
                 'intro': a['intro'], 'outro': a['outro'], 'peaks': a['peaks']})
for pi, ph in enumerate(plan['phases'], 1):
    for d in ph.get('sources', []):
        tags = json.load(open(os.path.join(d, 'tags.json'))) if os.path.exists(os.path.join(d, 'tags.json')) else {}
        for f in sorted(glob.glob(os.path.join(d, '**', '*.mp3'), recursive=True)):
            if '_rejected' in f: continue
            t = tags.get(os.path.relpath(f, d), {}); ar, ti = id3(f)
            add(pi, 'new', f, ar, ti, t.get('key'), t.get('energy'), t.get('bpm'), t.get('bpm_src') or 'tag')
    for r in ph.get('library', []):
        add(pi, 'lib', r['path'], r.get('artist'), r.get('title'), tocam(r.get('key')), r.get('energy'), r.get('bpm'), 'library', r.get('lexid'))
json.dump(pcache, open(cache_p, 'w'))
playlists = []
for pi, ph in enumerate(plan['phases'], 1):
    pool = [r for r in recs if r['pl'] == pi and r['bpm']]
    pool.sort(key=lambda r: -(r['energy_mik'] or 5)); pool = pool[:ph.get('cap', 40)]; pool.sort(key=lambda r: r['bpm'])
    order = [pool.pop(0)] if pool else []
    while pool:
        cur = order[-1]
        nxt = min(pool, key=lambda b: bcost(cur, b) if bcost(cur, b) < 9 else 20 + abs(cur['bpm'] - b['bpm']) + (0 if b['bpm'] >= cur['bpm'] else 3))
        pool.remove(nxt); order.append(nxt)
    m3u = os.path.join(out, f"{pi} - {re.sub(r'[^A-Za-z0-9 ]+', ' ', ph['name']).strip()}.m3u8")
    with open(m3u, 'w') as fh:
        fh.write('#EXTM3U\n')
        for r in order: fh.write(f"#EXTINF:{int(r['dur'])},{r['artist']} - {r['title']}\n{r['path']}\n")
    playlists.append({'name': ph['name'], 'slot': ph.get('slot', ''), 'why': ph.get('why', ''), 'ids': [r['id'] for r in order], 'm3u': m3u})
for a in recs:
    c = [{'id': b['id'], 'cost': round(bcost(a, b), 2), 'rel': REL[keyrel(a['key'], b['key'])], 'bpm_pct': round((b['bpm'] - a['bpm']) / a['bpm'] * 100, 1)}
         for b in recs if b is not a and bcost(a, b) < 9]
    a['blends'] = sorted(c, key=lambda x: x['cost'])[:5]
used = {i for p in playlists for i in p['ids']}; keep = [r for r in recs if r['id'] in used]
remap = {r['id']: i for i, r in enumerate(keep)}
for r in keep:
    r['id'] = remap[r['id']]; r['blends'] = [dict(b, id=remap[b['id']]) for b in r['blends'] if b['id'] in remap]; r.pop('path', None)
for p in playlists: p['ids'] = [remap[i] for i in p['ids']]
bpms = [r['bpm'] for r in keep]; en = [r['energy_mik'] for r in keep if r['energy_mik']]
stats = {'tracks': len(keep), 'new': sum(r['src'] == 'new' for r in keep), 'owned': sum(r['src'] == 'lib' for r in keep),
         'hours': round(sum(r['dur'] for r in keep) / 3600, 1), 'bpm_min': min(bpms), 'bpm_max': max(bpms),
         'keys': sum(1 for r in keep if r['key']), 'emin': min(en) if en else None, 'emax': max(en) if en else None}
json.dump({'gig': plan.get('gig', ''), 'stats': stats, 'tracks': keep, 'playlists': playlists, 'spare': len(recs) - len(keep)},
          open(os.path.join(out, 'set.json'), 'w'), ensure_ascii=False)
print('phases', [len(p['ids']) for p in playlists], stats, 'spare', len(recs) - len(keep))
for p in playlists: print(' ', p['m3u'])
