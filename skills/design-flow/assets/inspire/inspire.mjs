// Pull inspiration shots from design galleries and build a local picker page.
// usage: node inspire.mjs "dark analytics dashboard" [--kind all|app|dashboard|landing|report] [--per 8] [--out ./inspire-board]
//        [--sources dribbble,behance,...] [--playwright /path/package.json]
// Writes <out>/board.json, <out>/img/*, <out>/picker.html. Thumbnails stay local and link back to the source; do not republish them.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const query = a.find((x, i) => !x.startsWith('--') && !(a[i - 1] || '').startsWith('--'));
if (!query) { console.error('usage: node inspire.mjs "<query>" [--kind k] [--per n] [--out dir]'); process.exit(1); }
const kind = opt('--kind', 'all'); const per = +opt('--per', 8); const out = resolve(opt('--out', './inspire-board'));
const only = (opt('--sources', '') || '').split(',').filter(Boolean);
const pwArg = opt('--playwright', process.env.PLAYWRIGHT_PACKAGE_JSON);
function loadPlaywright() { for (const t of [pwArg, process.cwd() + '/package.json', import.meta.url, '/Users/Anshul.Vishwakarma/Code/sypris/package.json'].filter(Boolean)) { try { return createRequire(t)('@playwright/test'); } catch (e) {} } throw new Error('Playwright not found: npm i -D @playwright/test && npx playwright install chromium, or pass --playwright'); }
const { chromium } = loadPlaywright();
const { sources } = JSON.parse(readFileSync(join(here, 'sources.json'), 'utf8'));
const pick = sources.filter(s => (only.length ? only.includes(s.id) : (kind === 'all' || s.kinds.includes('all') || s.kinds.includes(kind))));
mkdirSync(join(out, 'img'), { recursive: true });
const q = encodeURIComponent(query);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36', deviceScaleFactor: 1 });
const items = []; const report = [];
async function scrape(s) {
  const url = s.url.replace('{q}', q);
  if (s.mode === 'link') { report.push({ id: s.id, status: 'link', count: 0 }); items.push({ id: `${s.id}-open`, source: s.id, sourceName: s.name, title: s.needs === 'login' ? 'needs your login' : 'browse', href: url, img: null, kind: 'link' }); return; }
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(500); }
    const found = await page.evaluate((per) => {
      const seen = new Set(); const res = [];
      for (const img of document.querySelectorAll('img')) {
        const src = img.currentSrc || img.src; const w = img.naturalWidth, h = img.naturalHeight; const r = img.getBoundingClientRect();
        if (!src || src.startsWith('data:') || seen.has(src) || w < 280 || h < 160 || r.width < 160) continue;
        if (/avatar|logo|icon|profile|sprite/i.test(src + ' ' + (img.alt || '') + ' ' + img.className)) continue;
        const t0 = (img.alt || '').trim(); if (/^(webflow|framer)$|template|sponsor|advert|404|not found|no content/i.test(t0)) continue;
        const aEl = img.closest('a'); seen.add(src); const tk = (t0 || src).toLowerCase(); if (seen.has('t:' + tk)) continue; seen.add('t:' + tk);
        res.push({ src, href: aEl ? aEl.href : location.href, title: (img.alt || aEl?.getAttribute('aria-label') || aEl?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90), w, h });
        if (res.length >= per) break;
      }
      return res;
    }, per);
    let n = 0;
    for (const f of found) {
      try {
        const r = await ctx.request.get(f.src, { headers: { referer: url }, timeout: 15000 });
        if (!r.ok()) continue; const ct = r.headers()['content-type'] || ''; if (!/image/.test(ct)) continue;
        const ext = /png/.test(ct) ? 'png' : /webp/.test(ct) ? 'webp' : /gif/.test(ct) ? 'gif' : 'jpg';
        const id = `${s.id}-${++n}`; writeFileSync(join(out, 'img', `${id}.${ext}`), await r.body());
        items.push({ id, source: s.id, sourceName: s.name, title: f.title || `${s.name} shot ${n}`, href: f.href, img: `img/${id}.${ext}`, w: f.w, h: f.h, kind: 'shot' });
      } catch (e) {}
    }
    if (n < 2 && !/404|not found/i.test(await page.title())) { const id = `${s.id}-page`; await page.screenshot({ path: join(out, 'img', `${id}.jpg`), type: 'jpeg', quality: 70 }); items.push({ id, source: s.id, sourceName: s.name, title: `${s.name} results for "${query}"`, href: url, img: `img/${id}.jpg`, w: 1440, h: 1000, kind: 'page' }); }
    report.push({ id: s.id, status: 'ok', count: n });
  } catch (e) { report.push({ id: s.id, status: 'error', error: String(e.message).slice(0, 90), count: 0 }); items.push({ id: `${s.id}-open`, source: s.id, sourceName: s.name, title: `Open ${s.name} for "${query}"`, href: url, img: null, kind: 'link' }); }
  finally { await page.close(); }
}
const queue = [...pick]; await Promise.all(Array.from({ length: 5 }, async () => { while (queue.length) await scrape(queue.shift()); }));
await browser.close();
const board = { query, kind, created: new Date().toISOString(), sources: pick.map(s => ({ id: s.id, name: s.name })), items };
writeFileSync(join(out, 'board.json'), JSON.stringify(board, null, 1));
const tpl = readFileSync(join(here, 'picker.html'), 'utf8');
writeFileSync(join(out, 'picker.html'), tpl.replace('/*__BOARD__*/null', JSON.stringify(board).replace(/</g, '\\u003c')));
console.log(JSON.stringify({ out: join(out, 'picker.html'), items: items.length, report }));
