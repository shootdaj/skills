#!/usr/bin/env python3
"""Full-decode verification of downloaded audio. Moves rejects to <dir>/_rejected.

usage: verify_mp3s.py DIR [DIR ...] [--min-kbps 256] [--min-sec 120] [--dry-run]

A file passes when ffmpeg decodes it end to end with no real errors, it is at
least --min-sec long and at least --min-kbps. Harmless noise from DJ-pool rips
(1-2 junk frames at the start, bad ID3 BOM, cover-art chunk errors, Xing size
warnings) is ignored; those files still play and rekordbox analyses them fine.
Bitrate: VBR files can report a container (format) bit_rate below their real
average, so when it is under 320 kbps the audio stream's bit_rate is read too
and the higher of the two is used.
"""
import argparse, glob, json, os, shutil, subprocess
IGNORE = ('Header missing', 'Invalid data', 'BOM', 'skipped', 'lyrics', 'comment frame',
          'backstep', 'Xing', 'png', 'jpeg', 'mjpeg')

def probe(f):
    p = subprocess.run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', f],
                       capture_output=True, text=True)
    try:
        j = json.loads(p.stdout); fm = j['format']; st = [s for s in j['streams'] if s['codec_type'] == 'audio'][0]
    except Exception:
        return None
    errs = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-f', 'null', '-'], capture_output=True, text=True).stderr.splitlines()
    real = [e for e in errs if not any(x in e for x in IGNORE)]
    kbps = int(fm.get('bit_rate', 0)) // 1000
    if kbps < 320 and st.get('bit_rate'): kbps = max(kbps, int(st['bit_rate']) // 1000)
    return {'dur': float(fm.get('duration', 0)), 'kbps': kbps,
            'sr': st.get('sample_rate'), 'codec': st.get('codec_name'), 'errors': real, 'glitch': bool(errs) and not real}

ap = argparse.ArgumentParser()
ap.add_argument('dirs', nargs='+'); ap.add_argument('--min-kbps', type=int, default=256)
ap.add_argument('--min-sec', type=int, default=120); ap.add_argument('--dry-run', action='store_true')
a = ap.parse_args()
ok = bad = 0
for d in a.dirs:
    rej = os.path.join(d, '_rejected')
    for f in sorted(glob.glob(os.path.join(d, '**', '*.*'), recursive=True)):
        if '_rejected' in f or os.path.splitext(f)[1].lower() not in ('.mp3', '.flac', '.wav', '.m4a', '.aiff'): continue
        r = probe(f)
        why = ('ffprobe failed' if r is None else r['errors'][0][:70] if r['errors'] else
               'too short' if r['dur'] < a.min_sec else f"{r['kbps']} kbps" if r['kbps'] < a.min_kbps else None)
        if why is None:
            ok += 1; continue
        bad += 1; print(f'REJECT  {os.path.relpath(f, d)}  ->  {why}')
        if not a.dry_run:
            os.makedirs(rej, exist_ok=True); shutil.move(f, os.path.join(rej, os.path.basename(f)))
print(f'{ok} OK, {bad} rejected' + (' (dry run, nothing moved)' if a.dry_run else ''))
