// Run inside a logged-in open.spotify.com tab (Claude-in-Chrome javascript_tool,
// Playwright evaluate, or DevTools). Harvests the virtualised tracklist by
// scrolling slowly. Works on /playlist/<id>, /artist/<id> (Popular = 5 rows),
// and /album/<id>. Returns TSV lines: artist(s) \t title \t m:ss.
//
// Wait ~10 s after navigation before running; rows render late.
// For playlists with >50 tracks raise MAX_STEPS.
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const MAX_STEPS = 60, STEP_PX = 260, STEP_MS = 650;
  let el = document.querySelector('[data-testid="tracklist-row"]'), sc = null;
  while (el) {
    if (el.scrollHeight > el.clientHeight + 50 && /auto|scroll/.test(getComputedStyle(el).overflowY)) { sc = el; break; }
    el = el.parentElement;
  }
  const rows = {};
  const grab = () => document.querySelectorAll('[data-testid="tracklist-row"]').forEach(r => {
    const idx = r.closest('[role="row"]')?.getAttribute('aria-rowindex');
    const tl = r.querySelector('a[href*="/track/"]') || r.querySelector('div[dir=auto]');
    if (!tl) return;
    const artists = [...r.querySelectorAll('a[href*="/artist/"]')].map(a => a.textContent.trim());
    const dur = [...r.querySelectorAll('div,span')].map(d => d.textContent.trim()).find(t => /^\d+:\d\d$/.test(t));
    rows[tl.getAttribute('href') || tl.textContent] = { idx: +idx || 0, title: tl.textContent.trim(), artists, dur };
  });
  if (sc) {
    sc.scrollTop = 0; await sleep(700); grab();
    let pos = 0, same = 0, last = -1;
    for (let i = 0; i < MAX_STEPS; i++) {
      pos += STEP_PX; sc.scrollTop = pos; await sleep(STEP_MS); grab();
      const n = Object.keys(rows).length;
      same = n === last ? same + 1 : 0; last = n;
      if (same >= 6) break;
    }
  } else grab();
  const out = Object.values(rows).sort((a, b) => a.idx - b.idx)
    .map(r => [r.artists.join(', '), r.title, r.dur].join('\t'));
  window.__pl = out; // large lists: read back in slices, e.g. window.__pl.slice(0,18).join('\n')
  return 'PL ' + document.title + ' rows=' + out.length + '\n' + out.slice(0, 18).join('\n');
})();
