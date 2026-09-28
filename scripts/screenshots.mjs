// Screenshots every resting state at each viewport and checks that nothing overflows the screen.
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const SIZES = (process.argv[2] ?? '1920x1080,1440x900,1280x720').split(',').map((s) => s.split('x').map(Number));
const OUT = 'screenshots';

const server = await createServer({ server: { port: 5199, strictPort: false }, logLevel: 'error' });
await server.listen();
const url = `${server.resolvedUrls.local[0]}?static`;
const browser = await chromium.launch();
let failures = 0;

for (const [width, height] of SIZES) {
  const dir = `${OUT}/${width}x${height}`;
  await mkdir(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
  await page.goto(url);
  await page.waitForFunction(() => window.__deck);
  const n = await page.evaluate(() => window.__deck.deck.states.length);
  for (let i = 0; i < n; i++) {
    const info = await page.evaluate((k) => {
      const { deck, scenes } = window.__deck;
      deck.go(k, { instant: true });
      const st = deck.states[k];
      const el = document.getElementById(scenes[st.si].id);
      const frame = el.querySelector('.frame').getBoundingClientRect();
      const bad = [];
      for (const node of el.querySelectorAll('.frame *')) {
        if (node.closest('.sr-only') || !node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
        if (node.closest('[data-show]:not(.is-on)')) continue;
        const r = node.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        if (r.bottom > frame.bottom + 1 || r.right > frame.right + 1 || r.top < frame.top - 1 || r.left < frame.left - 1) {
          bad.push(`${node.tagName.toLowerCase()}.${String(node.className?.baseVal ?? node.className).split(' ')[0]} "${(node.textContent || '').trim().slice(0, 40)}"`);
        }
      }
      return { id: scenes[st.si].id, beat: st.beat, bad: [...new Set(bad)].slice(0, 6) };
    }, i);
    await page.waitForTimeout(900);
    const name = `${String(i).padStart(2, '0')}-${info.id}-b${info.beat}.png`;
    await page.screenshot({ path: `${dir}/${name}` });
    if (info.bad.length) { failures += 1; console.log(`OVERFLOW ${width}x${height} ${name}\n   ${info.bad.join('\n   ')}`); }
  }
  // appendix panels
  const panels = await page.evaluate(() => { window.__deck.appendix.open(); return document.querySelectorAll('.panel').length; });
  for (let k = 0; k < panels; k++) {
    const over = await page.evaluate((j) => {
      window.__deck.appendix.show(j);
      const ap = document.getElementById('appendix');
      return { scrollY: ap.scrollHeight > ap.clientHeight + 1, scrollX: ap.scrollWidth > ap.clientWidth + 1 };
    }, k);
    await page.screenshot({ path: `${dir}/ap-${String(k + 1).padStart(2, '0')}.png` });
    if (over.scrollX) { failures += 1; console.log(`APPENDIX X-OVERFLOW ${width}x${height} panel ${k + 1}`); }
    if (over.scrollY) console.log(`appendix panel ${k + 1} scrolls vertically at ${width}x${height}`);
  }
  await page.close();
  console.log(`${width}x${height}: ${n} resting states + ${panels} appendix panels -> ${dir}`);
}
await browser.close();
await server.close();
if (failures) { console.error(`${failures} overflow problem(s)`); process.exit(1); }
