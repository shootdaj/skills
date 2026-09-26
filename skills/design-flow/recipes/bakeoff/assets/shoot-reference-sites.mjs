// Screenshot a set of template/component sites for a design-direction gallery.
// usage: node shoot-reference-sites.mjs [out_dir] [--playwright /path/package.json]   (out_dir defaults to ./reference-shots)
// No setup needed: Playwright is found or installed by design-flow/assets/lib/playwright.mjs; --playwright is an optional override.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch } from '../../../assets/lib/playwright.mjs';
const argv = process.argv.slice(2);
const out = resolve(argv.find((x, i) => !x.startsWith('--') && !(argv[i - 1] || '').startsWith('--')) || './reference-shots');
mkdirSync(out, { recursive: true });
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
const browser = await launch({ headless: true });
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
