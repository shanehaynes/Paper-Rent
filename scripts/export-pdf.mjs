// Prints the static slide deck (dist/paper-rent.html?print) to dist/paper-rent-deck.pdf and
// screenshots each page to screenshots/print/. Fails unless the deck has at most 7 main slides and
// at most 10 appendix slides, and warns when a page had to shrink below 70% to fit.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT = 'dist/paper-rent-deck.pdf';
const SHOTS = 'screenshots/print';
await mkdir(SHOTS, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${pathToFileURL(resolve('dist/paper-rent.html')).href}?print`);
await page.waitForFunction(() => window.__print);
const info = await page.evaluate(() => window.__print);
// Anything drawn below or beside a page's body box would be cut off in the PDF.
const clipped = await page.evaluate(() => [...document.querySelectorAll('.page')].flatMap((pg, i) => {
  const box = pg.querySelector('.scene-body').getBoundingClientRect();
  const over = [...pg.querySelectorAll('.fit-inner *')].some((n) => {
    const r = n.getBoundingClientRect();
    return r.height && (r.bottom > box.bottom + 1 || r.right > box.right + 1);
  });
  return over ? [i + 1] : [];
}));

const pages = await page.$$('.page');
for (const [k, el] of pages.entries()) await el.screenshot({ path: `${SHOTS}/${String(k + 1).padStart(2, '0')}.png` });

await page.emulateMedia({ media: 'print' });
await page.pdf({ path: OUT, width: '1920px', height: '1080px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await browser.close();

console.log(`export-pdf: ${info.main} main slides + ${info.appendix} appendix slides -> ${OUT}`);
info.zooms.forEach((z, k) => { if (z < 0.7) console.log(`  page ${k + 1} shrunk to ${Math.floor(z * 100)}% to fit`); });
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
if (clipped.length) { console.error(`export-pdf FAILED: content cut off on page(s) ${clipped.join(', ')}`); process.exit(1); }
if (info.main > 7 || info.appendix > 10 || pages.length !== info.main + info.appendix) {
  console.error(`export-pdf FAILED: ${info.main} main / ${info.appendix} appendix / ${pages.length} pages`);
  process.exit(1);
}
