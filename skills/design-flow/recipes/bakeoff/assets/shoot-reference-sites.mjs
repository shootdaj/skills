// Screenshot a set of template/component sites for a design-direction gallery.
import { createRequire } from 'node:module';
const pwArg = (() => { const a = process.argv, i = a.indexOf('--playwright'); return i >= 0 ? a[i + 1] : process.env.PLAYWRIGHT_PACKAGE_JSON; })();
function loadPlaywright() {
  const tries = [pwArg, process.cwd() + '/package.json', import.meta.url].filter(Boolean);
  for (const t of tries) { try { return createRequire(t)('@playwright/test'); } catch (e) {} }
  throw new Error('Playwright not found. Run `npm i -D @playwright/test && npx playwright install chromium` in this folder, or pass --playwright /path/to/package.json (or set PLAYWRIGHT_PACKAGE_JSON).');
}
const { chromium } = loadPlaywright();
const out = process.argv[2];
const SITES = [
  ['aceternity-bento','https://ui.aceternity.com/components/bento-grid'],
  ['aceternity-spotlight','https://ui.aceternity.com/components/spotlight-new'],
  ['magicui','https://magicui.design/'],
  ['magicui-bento','https://magicui.design/docs/components/bento-grid'],
  ['21st','https://21st.dev/'],
  ['tremor','https://www.tremor.so/'],
  ['shadcn-dashboard','https://ui.shadcn.com/blocks'],
  ['linear','https://linear.app/'],
  ['godly','https://godly.website/'],
  ['framer-dashboards','https://www.framer.com/marketplace/templates/category/dashboard/'],
  ['untitledui','https://www.untitledui.com/'],
  ['reactbits','https://reactbits.dev/'],
];
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', deviceScaleFactor: 1 });
const results = [];
await Promise.all(SITES.map(async ([name, url]) => {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3500);
    await page.mouse.move(700, 450);
    await page.screenshot({ path: `${out}/${name}.png` });
    results.push([name, url, 'ok']);
  } catch (e) { results.push([name, url, 'fail: ' + String(e.message).slice(0, 80)]); }
  finally { await page.close(); }
}));
await browser.close();
console.log(JSON.stringify(results, null, 1));
