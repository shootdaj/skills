// Run inside a logged-in open.spotify.com tab (Claude-in-Chrome javascript_tool,
// Playwright evaluate, or DevTools). Harvests the virtualised tracklist by
// scrolling slowly. Works on /playlist/<id>, /artist/<id> (Popular = 5 rows),
// and /album/<id>. Leaves TSV lines (artist(s) \t title \t m:ss) in window.__pl
// and returns {expected, got, rows} where `expected` is the "N songs" count
// from the page header (null when the page has none) and `rows` is the first
// 15 lines only — read the rest from window.__pl in slices of <= 15 lines.
//
// Wait ~10 s after navigation before running; rows render late.
// The run is budgeted to stay under the 45 s tool timeout (MAX_STEPS 60, ~38 s).
// If got < expected, call the script again: harvested rows live in
// window.__rows (keyed by page path) and the scroll continues from where it
// stopped. To start over on the same page: delete window.__rows.
// When the grid stalls (same count 4 steps running) a real WheelEvent is
// dispatched on the scroller and the last row is scrollIntoView'd; after 8
// stalled steps the run stops. A stuck grid that survives that needs one real
// mouse-wheel scroll (computer tool) on the list, then another call.
// aria-rowindex is 1-based and counts the header row: track 1 = rowindex 2.
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const MAX_STEPS = 60, STEP_PX = 260, STEP_MS = 600, BUDGET_MS = 38000;
  const STALL_NUDGE = 4, STALL_STOP = 8, T0 = Date.now();
  const hm = document.body.innerText.match(/([\d,]+)\s+songs?\b/);
  const expected = hm ? parseInt(hm[1].replace(/,/g, ''), 10) : null;
  let el = document.querySelector('[data-testid="tracklist-row"]'), sc = null;
  while (el) {
    if (el.scrollHeight > el.clientHeight + 50 && /auto|scroll/.test(getComputedStyle(el).overflowY)) { sc = el; break; }
    el = el.parentElement;
  }
  // Resume a previous run on the same page (Spotify is an SPA: window survives
  // client-side navigation, so the store is keyed by path).
  const resume = !!(window.__rows && window.__rows.path === location.pathname);
  if (!resume) window.__rows = { path: location.pathname, map: {} };
  const rows = window.__rows.map;
  const grab = () => document.querySelectorAll('[data-testid="tracklist-row"]').forEach(r => {
    const idx = r.closest('[role="row"]')?.getAttribute('aria-rowindex');
    const tl = r.querySelector('a[href*="/track/"]') || r.querySelector('div[dir=auto]');
    if (!tl) return;
    const artists = [...r.querySelectorAll('a[href*="/artist/"]')].map(a => a.textContent.trim());
    const dur = [...r.querySelectorAll('div,span')].map(d => d.textContent.trim()).find(t => /^\d+:\d\d$/.test(t));
    rows[tl.getAttribute('href') || tl.textContent] = { idx: +idx || 0, title: tl.textContent.trim(), artists, dur };
  });
  const count = () => Object.keys(rows).length;
  const done = () => expected !== null && count() >= expected;
  const nudge = () => {
    sc.dispatchEvent(new WheelEvent('wheel', { deltaY: STEP_PX, deltaMode: 0, bubbles: true, cancelable: true }));
    const all = document.querySelectorAll('[data-testid="tracklist-row"]');
    if (all.length) all[all.length - 1].scrollIntoView({ block: 'end' });
  };
  if (sc) {
    if (!resume) { sc.scrollTop = 0; await sleep(700); }
    grab();
    let pos = sc.scrollTop, same = 0, last = count();
    for (let i = 0; i < MAX_STEPS && !done() && Date.now() - T0 < BUDGET_MS; i++) {
      pos += STEP_PX; sc.scrollTop = pos; await sleep(STEP_MS); grab();
      const n = count();
      same = n === last ? same + 1 : 0; last = n;
      if (same === STALL_NUDGE) { nudge(); await sleep(STEP_MS); grab(); pos = sc.scrollTop; }
      if (same >= STALL_STOP) break;
    }
  } else grab();
  const out = Object.values(rows).sort((a, b) => a.idx - b.idx)
    .map(r => [r.artists.join(', '), r.title, r.dur].join('\t'));
  window.__pl = out; // read back in slices: window.__pl.slice(0,15).join('\n'), slice(15,30), ...
  return { expected, got: out.length, rows: out.slice(0, 15) };
})();
