#!/usr/bin/env python3
"""Key + energy (+ BPM where present) for a folder of MP3s via Mixed In Key 11,
with aubio as the BPM fallback. Writes <dir>/tags.json.

usage: mik_tag.py DIR [--timeout 300] [--no-mik] [--quit-mik]

--quit-mik quits Mixed In Key 11 when tagging is done (default: leave it
running; the next run reuses the open instance).

MIK is driven headlessly: `open -a "Mixed In Key 11" <files>` makes it analyse and
write TKEY plus a "9A - Energy 7" COMM tag within about a minute per 100 files.
It does not write TBPM to files that lack one; aubio fills that gap (±1 BPM).

Gotcha: if Traktor is running, MIK pops "Error saving Traktor collection file"
and pauses its queue. This script detects the stall and clicks Cancel via System
Events; quit Traktor beforehand to avoid it entirely.
"""
import argparse, glob, json, os, re, subprocess, sys, time
from mutagen.id3 import ID3
CAMS = {f'{n}{l}' for n in range(1, 13) for l in 'AB'}

def read(f):
    try: t = ID3(f)
    except Exception: return {}
    comm = ' '.join(str(c) for c in t.getall('COMM')); key = str(t.get('TKEY', '')).strip()
    m = re.search(r'Energy\s*(\d+)', comm); m2 = re.search(r'\b(\d{1,2}[AB])\b', comm)
    if key not in CAMS and m2: key = m2.group(1)
    try: bpm = round(float(str(t.get('TBPM', '')).strip()), 1)
    except Exception: bpm = None
    return {'key': key if key in CAMS else None, 'energy': int(m.group(1)) if m else None, 'bpm': bpm}

def aubio(f, lo=112, hi=142):
    out = subprocess.run(['aubio', 'tempo', '-i', f], capture_output=True, text=True).stdout.split()
    try: b = float(out[0])
    except Exception: return None
    while b < lo: b *= 2
    while b > hi: b /= 2
    return round(b, 1)

def dismiss_mik_dialog():
    subprocess.run(['osascript', '-e', '''
tell application "System Events"
  tell process "Mixed In Key 11"
    repeat with w in windows
      try
        click (first button of w whose name is "Cancel")
      end try
      try
        repeat with s in (sheets of w)
          click (first button of s whose name is "Cancel")
        end repeat
      end try
    end repeat
  end tell
end tell'''], capture_output=True)

ap = argparse.ArgumentParser(); ap.add_argument('dir'); ap.add_argument('--timeout', type=int, default=300)
ap.add_argument('--no-mik', action='store_true'); ap.add_argument('--quit-mik', action='store_true'); a = ap.parse_args()
files = sorted(f for f in glob.glob(os.path.join(a.dir, '**', '*.mp3'), recursive=True) if '_rejected' not in f)
need = [f for f in files if not read(f).get('energy')]
if need and not a.no_mik:
    print(f'MIK on {len(need)} files'); subprocess.run(['open', '-a', 'Mixed In Key 11'] + need)
    t0 = time.time(); last = len(need)
    while time.time() - t0 < a.timeout:
        time.sleep(5); left = [f for f in need if not read(f).get('energy')]
        if not left: break
        if len(left) == last: dismiss_mik_dialog()
        last = len(left)
    print(f'MIK still missing: {len(left)}')
out = {}
for f in files:
    r = read(f); r['bpm_src'] = 'tag' if r.get('bpm') else None
    if not r.get('bpm'): r['bpm'] = aubio(f); r['bpm_src'] = 'aubio' if r['bpm'] else None
    out[os.path.relpath(f, a.dir)] = r  # key = path relative to DIR
json.dump(out, open(os.path.join(a.dir, 'tags.json'), 'w'), indent=1)
k = sum(1 for r in out.values() if r.get('key')); e = sum(1 for r in out.values() if r.get('energy')); b = sum(1 for r in out.values() if r.get('bpm'))
print(f'{len(out)} files: key {k}, energy {e}, bpm {b} -> tags.json')
if a.quit_mik: subprocess.run(['osascript', '-e', 'tell application "Mixed In Key 11" to quit'], capture_output=True)
