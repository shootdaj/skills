#!/usr/bin/env python3
"""Turn scraped Spotify TSV (artist \\t title \\t m:ss) into a sockseek CSV,
skipping tracks already present in a Lexicon library or a local folder.

usage: tsv_to_csv.py in.tsv out.csv [--lexicon ~/Library/Application\\ Support/lexicon/main.db]
                                    [--have DIR ...] [--queued other.csv ...]
       tsv_to_csv.py --selftest

Owned check: the plain title must appear in the library entry AND, when the
query names a remix ("- Romain Garcia Remix", "(ARTBAT Remix)", "Rework",
"Edit", "Bootleg", "… Mix"), the library title must carry that same remix
token. Original / Extended / Radio / Album versions are not remix tokens, so
"X - Extended Mix" still counts as owned when the library has "X".
"""
import argparse, csv, glob, os, re, sqlite3, sys, unicodedata

def norm(s): return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFC', s or '').lower())
def core_title(t): return norm(re.sub(r'\(.*?\)|\[.*?\]|feat\..*| - .*', '', t))

REMIX_WORD = re.compile(r'\b(remix|rework|edit|bootleg|mix)\b', re.I)
NEUTRAL = re.compile(r'^(original|extended|radio|album)(mix|edit|version)?$')

def remix_token(t):
    """Normalised remix suffix of a title ("romaingarciaremix"), or '' when the
    title is a plain / original / extended / radio version."""
    for seg in re.findall(r'\((.*?)\)|\[(.*?)\]| - (.*)$', t or ''):
        seg = next(s for s in seg if s)
        if REMIX_WORD.search(seg) and not NEUTRAL.match(norm(seg)):
            return norm(seg)
    return ''

def title_match(tn, tok, cand):
    """cand (normalised library/file title) owns the query when it contains the
    plain title and, if the query names a remix, that remix token too."""
    return bool(tn) and tn in cand and (not tok or tok in cand)

def main():
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
        tn, tok, an = core_title(title), remix_token(title), norm(artist.split(',')[0].split('&')[0])
        return any(title_match(tn, tok, x[0]) and an in x[1] for x in lib)

    rows, skipped = [], 0
    for line in open(a.tsv, encoding='utf-8'):
        parts = line.rstrip('\n').split('\t')
        if len(parts) < 2 or not parts[1].strip(): continue
        artist, title = parts[0].strip(), parts[1].strip()
        dur = None
        if len(parts) > 2 and re.match(r'^\d+:\d\d$', parts[2].strip()):
            m, s = parts[2].strip().split(':'); dur = int(m) * 60 + int(s)
        tn, tok = core_title(title), remix_token(title)
        if owned(artist, title) or any(title_match(tn, tok, h) for h in have) or norm(title)[:14] in queued:
            skipped += 1; continue
        rows.append([artist, title, dur] if dur else [artist, title])
    with open(a.csv, 'w', newline='') as fh:
        w = csv.writer(fh); w.writerow(['Artist', 'Title', 'Length'] if any(len(r) == 3 for r in rows) else ['Artist', 'Title'])
        for r in rows: w.writerow(r + ([''] if len(r) == 2 and any(len(x) == 3 for x in rows) else []))
    print(f'{a.csv}: {len(rows)} to download, {skipped} skipped (owned/downloaded/queued)')

def selftest():
    def owned_by(title, lib_titles):
        tn, tok = core_title(title), remix_token(title)
        return any(title_match(tn, tok, norm(t)) for t in lib_titles)
    cases = [
        # the bug: a remix must not be owned because the original / extended is
        ('Come Back Around - Romain Garcia Remix', ['Come Back Around (feat. Cherry Glazerr)', 'Come Back Around (Extended Mix)'], False),
        # same remix in the library -> owned
        ('Lie Alone - 16BL Remix', ['Lie Alone (16BL Remix)'], True),
        # a different remix in the library -> not owned
        ('What Else Is There? - DJ Tennis Remix', ['What Else Is There? (ARTBAT Remix)'], False),
        # extended / original are versions of the same track, not remixes -> owned
        ('Start Again - Extended Mix', ['Start Again (feat. Becky Jean Williams)'], True),
    ]
    fails = 0
    for title, lib_titles, want in cases:
        got = owned_by(title, lib_titles)
        print(f"{'ok  ' if got == want else 'FAIL'} owned={got!s:5} want={want!s:5}  {title!r} vs {lib_titles}")
        fails += got != want
    print(f'{len(cases) - fails}/{len(cases)} passed'); sys.exit(1 if fails else 0)

if __name__ == '__main__' and '--selftest' in sys.argv:
    selftest()
elif __name__ == '__main__':
    main()
