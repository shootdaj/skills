#!/usr/bin/env python3
"""Render the vibe-check page from set_builder output.

usage: build_report.py set_dir [--title "Amber Rooftop Set"] [--verdict "…"] [--checklist items.json]

Reads set_dir/set.json (from dj-set-builder) and writes set_dir/publish/, the
folder to hand to here.now: publish/index.html plus publish/audio/ holding a
hard link to every track that made a playlist and nothing else. set.json,
peaks_cache.json and the .m3u8 files (absolute local paths) stay in set_dir
and never go public. Links in publish/audio/ that no longer belong to the set
are unlinked (the data still lives in set_dir/audio/).
"""
import argparse, json, os, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('set_dir'); ap.add_argument('--title', default='Set Vibe Check')
ap.add_argument('--verdict', default=None); ap.add_argument('--checklist', default=None); ap.add_argument('--published', default=None); ap.add_argument('--slot-hours', type=float, default=None)
a = ap.parse_args()
d = json.load(open(os.path.join(a.set_dir, 'set.json'))); s = d['stats']
d['published'] = a.published or ''
d['slot_hours'] = a.slot_hours
d['folder'] = os.path.abspath(a.set_dir)
d['verdict'] = a.verdict or (f"You're good. <b>{s['tracks']} tracks in {len(d['playlists'])} playlists</b> — {s['new']} new files (verified, MIK-keyed)"
                             + (f" + {s['owned']} from your library" if s['owned'] else '') + f" — {s['hours']} h of music, ordered so the keys hold hands.")
d['checklist'] = json.load(open(a.checklist)) if a.checklist else [
    ['done', 'Files verified end-to-end (ffmpeg decode, bitrate, length)', 'rejects moved to _rejected/'],
    ['done', 'Mixed In Key run on every new file (key + energy)', ''],
    ['done', 'Playlists ordered harmonically and exported as .m3u8', 'rekordbox: File ▸ Import ▸ Playlist'],
    ['todo', 'Lexicon: Backup → import the new folder → create playlists → Modified sync to rekordbox', 'never Full sync'],
    ['todo', 'rekordbox: analyse, then export playlists to the FAT32 USB', ''],
    ['todo', 'Charge everything, pack both USBs', '']]
d['heads'] = f"Spare tracks not placed (over the per-list cap): {d.get('spare', 0)}. BPMs marked <i>aubio</i> are ±1; rekordbox will grid them."
d['log'] = 'Built with dj-show-prep: Spotify → sockseek → ffmpeg verify → Mixed In Key → set_builder (Camelot walk) → this page.'
tpl = open(os.path.join(HERE, 'report_template.html')).read().replace('<title>Amber Rooftop Set</title>', f'<title>{a.title}</title>').replace('<h1>Amber Rooftop Set</h1>', f'<h1>{a.title}</h1>')
tpl = tpl.replace("$('#meta').innerHTML=`<span>Amber Rooftop Bar · 34F Wyndham QSNCC · Sat 20 Sep 2026 · 9pm–midnight</span><span>prepared overnight ${DATA.published}</span>",
                  "$('#meta').innerHTML=`<span>${esc(DATA.gig)}</span><span>prepared ${DATA.published}</span>")
pub = os.path.join(a.set_dir, 'publish'); pub_audio = os.path.join(pub, 'audio'); os.makedirs(pub_audio, exist_ok=True)
wanted = {os.path.basename(t['file']) for t in d['tracks']}
for f in os.listdir(pub_audio):
    if f not in wanted: os.unlink(os.path.join(pub_audio, f))
linked = 0
for base in sorted(wanted):
    src, dst = os.path.join(a.set_dir, 'audio', base), os.path.join(pub_audio, base)
    if os.path.exists(dst) and os.path.samefile(src, dst): continue
    if os.path.exists(dst): os.unlink(dst)
    os.link(src, dst); linked += 1
open(os.path.join(pub, 'index.html'), 'w').write(tpl.replace('/*__DATA__*/', 'const DATA=' + json.dumps(d, ensure_ascii=False) + ';'))
print(os.path.join(pub, 'index.html'), f"{s['tracks']} tracks, {len(d['playlists'])} playlists; publish/audio: {len(wanted)} files ({linked} newly linked)")
