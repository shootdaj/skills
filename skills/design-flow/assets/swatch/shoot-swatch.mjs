// Screenshot a swatch board in its default and flipped themes. usage: node shoot-swatch.mjs /path/swatch.html [--playwright /path/package.json]
import { createRequire } from 'node:module'; import { resolve, dirname } from 'node:path';
const a = process.argv.slice(2); const file = resolve(a[0]); const i = a.indexOf('--playwright');
const require = createRequire(i >= 0 ? a[i + 1] : '/Users/Anshul.Vishwakarma/Code/sypris/package.json');
const { chromium } = require('@playwright/test'); const b = await chromium.launch(); const errs = [];
const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + file); await p.waitForTimeout(2500); const d = dirname(file);
await p.screenshot({ path: d + '/swatch-1.png', fullPage: true }); await p.click('#flip'); await p.waitForTimeout(400); await p.screenshot({ path: d + '/swatch-2.png', fullPage: true });
await b.close(); console.log(JSON.stringify({ shots: [d + '/swatch-1.png', d + '/swatch-2.png'], errs }));
