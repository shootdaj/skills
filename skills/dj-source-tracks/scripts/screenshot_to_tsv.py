#!/usr/bin/env python3
"""OCR a screenshot/photo of a tracklist (Spotify, rekordbox, SoundCloud, a
flyer, a phone photo) into artist \\t title lines using macOS Vision.

usage: screenshot_to_tsv.py image.png [image2.jpg ...] > list.tsv

Lines are heuristically paired: Spotify-style screenshots alternate
"Title" / "Artist" rows; "Artist - Title" and "Title — Artist" one-liners are
split on the dash. Review the output; OCR of stylised fonts needs a human eye.
The agent should also read the image directly and fix obvious misreads.
"""
import re, subprocess, sys, tempfile, os
SWIFT = r'''
import Vision, AppKit, Foundation
let path = CommandLine.arguments[1]
guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { exit(2) }
let req = VNRecognizeTextRequest { r, _ in
  for o in (r.results as? [VNRecognizedTextObservation]) ?? [] {
    if let t = o.topCandidates(1).first { print(String(format: "%.3f\t%@", 1 - o.boundingBox.origin.y, t.string)) }
  }
}
req.recognitionLevel = .accurate; req.usesLanguageCorrection = false
try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
'''
def ocr(path):
    with tempfile.NamedTemporaryFile('w', suffix='.swift', delete=False) as f: f.write(SWIFT); sw = f.name
    out = subprocess.run(['swift', sw, path], capture_output=True, text=True).stdout
    os.unlink(sw)
    rows = []
    for line in out.splitlines():
        y, t = line.split('\t', 1); rows.append((float(y), t.strip()))
    return [t for _, t in sorted(rows)]

NOISE = re.compile(r'^(\d{1,2}:\d\d|\d+|E|Auto|Explicit|BPM|Key|Album|Title|#|\d+[AB])$|^\W*$', re.I)
for img in sys.argv[1:]:
    lines = [l for l in ocr(img) if not NOISE.match(l)]
    i = 0
    while i < len(lines):
        l = lines[i]
        m = re.match(r'^(.+?)\s+[-–—]\s+(.+)$', l)
        if m and len(m.group(1)) > 1: print(f'{m.group(1)}\t{m.group(2)}'); i += 1; continue
        if i + 1 < len(lines):  # Spotify layout: title line then artist line
            print(f'{lines[i+1]}\t{l}'); i += 2
        else: print(f'?\t{l}'); i += 1
