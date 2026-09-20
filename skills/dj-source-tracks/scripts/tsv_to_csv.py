#!/usr/bin/env python3
"""Turn scraped Spotify TSV (artist \\t title \\t m:ss) into a sockseek CSV,
skipping tracks already present in a Lexicon library or a local folder.

usage: tsv_to_csv.py in.tsv out.csv [--lexicon ~/Library/Application\\ Support/lexicon/main.db]
                                    [--have DIR ...] [--queued other.csv ...]
"""
import argparse, csv, glob, os, re, sqlite3, sys, unicodedata

def norm(s): return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFC', s or '').lower())
def core_title(t): return norm(re.sub(r'\(.*?\)|feat\..*| - .*', '', t))

ap = argparse.ArgumentParser()
ap.add_argument('tsv'); ap.add_argument('csv')
ap.add_argument('--lexicon', default=os.path.expanduser('~/Library/Application Support/lexicon/main.db'))
ap.add_argument('--have', nargs='*', default=[], help='folders whose mp3s count as already downloaded')
ap.add_argument('--queued', nargs='*', default=[], help='other CSVs already queued for download')
a = ap.parse_args()

lib = []
if os.path.exists(a.lexicon):
    con = sqlite3.connect(f'file:{a.lexicon}?mode=ro', uri=True)
    lib = [(norm(t), norm(ar)) for t, ar in con.execute('select title,artist from Track')]
have = [norm(os.path.basename(f)) for d in a.have for f in glob.glob(os.path.join(d, '**', '*.mp3'), recursive=True)]
queued = set()
for q in a.queued:
    for r in csv.DictReader(open(q)): queued.add(norm(r['Title'])[:14])

def owned(artist, title):
    tn, an = core_title(title), norm(artist.split(',')[0].split('&')[0])
    return bool(tn) and any(tn in x[0] and an in x[1] for x in lib)

rows, skipped = [], 0
for line in open(a.tsv, encoding='utf-8'):
    parts = line.rstrip('\n').split('\t')
    if len(parts) < 2 or not parts[1].strip(): continue
    artist, title = parts[0].strip(), parts[1].strip()
    dur = None
    if len(parts) > 2 and re.match(r'^\d+:\d\d$', parts[2].strip()):
        m, s = parts[2].strip().split(':'); dur = int(m) * 60 + int(s)
    tn = core_title(title)
    if owned(artist, title) or any(tn in h for h in have) or norm(title)[:14] in queued:
        skipped += 1; continue
    rows.append([artist, title, dur] if dur else [artist, title])
with open(a.csv, 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['Artist', 'Title', 'Length'] if any(len(r) == 3 for r in rows) else ['Artist', 'Title'])
    for r in rows: w.writerow(r + ([''] if len(r) == 2 and any(len(x) == 3 for x in rows) else []))
print(f'{a.csv}: {len(rows)} to download, {skipped} skipped (owned/downloaded/queued)')
