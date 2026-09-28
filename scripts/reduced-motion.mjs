// Reduced-motion check: no scrubbed timelines, every resting state fully visible.
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
await page.goto(pathToFileURL(resolve('dist/paper-rent.html')).href);
await page.waitForFunction(() => window.__deck);
const n = await page.evaluate(() => window.__deck.deck.states.length);
let bad = 0;
for (let i = 1; i < n; i++) {
  await page.keyboard.press('PageDown');
  await page.waitForTimeout(900);
  const r = await page.evaluate(() => {
    const { deck, scenes } = window.__deck;
    const st = deck.states[deck.index];
    const el = document.getElementById(scenes[st.si].id);
    const hidden = [...el.querySelectorAll('.draw, [data-grow], .pop, [data-show].is-on')]
      .filter((x) => !x.closest('[data-show]:not(.is-on)') && Number(getComputedStyle(x).opacity) < 0.15).length;
    return { index: deck.index, hidden, motion: document.documentElement.classList.contains('has-motion') };
  });
  if (r.index !== i || r.hidden || r.motion) { bad += 1; console.log('problem at', i, r); }
}
console.log(`reduced-motion: ${n} states stepped with PageDown, ${bad} problem(s)`);
await browser.close();
process.exit(bad ? 1 : 0);
