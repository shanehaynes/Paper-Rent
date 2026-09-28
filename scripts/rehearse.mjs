// Rehearsal: drives the deck by keyboard with motion on, screenshots every resting state,
// and reports the number of key presses from start to end. Also checks clicker keys and overlays.
import { createServer, preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const mode = process.argv[2] ?? 'dev'; // dev | file
const OUT = `screenshots/rehearsal-${mode}`;
await mkdir(OUT, { recursive: true });

let server, url;
if (mode === 'file') url = pathToFileURL(resolve('dist/paper-rent.html')).href;
else { server = await createServer({ server: { port: 5198 }, logLevel: 'error' }); await server.listen(); url = server.resolvedUrls.local[0]; }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const failed = [];
const external = [];
if (mode === 'file') {
  await ctx.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith('file:') || u.startsWith('data:')) return route.continue();
    external.push(u);
    return route.abort();
  });
}
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('requestfailed', (r) => failed.push(r.url()));
await page.goto(url);
if (mode === 'file') await ctx.setOffline(true);
await page.waitForFunction(() => window.__deck);
await page.waitForTimeout(2500);

const state = () => page.evaluate(() => {
  const { deck, scenes } = window.__deck;
  const st = deck.states[deck.index];
  return { index: deck.index, id: scenes[st.si].id, beat: st.beat, y: Math.round(scrollY), total: deck.states.length };
});
const settle = async () => {
  let last = -1;
  for (let i = 0; i < 40; i++) {
    const y = await page.evaluate(() => Math.round(scrollY));
    if (y === last) break;
    last = y;
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(1100);
};
const hiddenAtRest = () => page.evaluate(() => {
  const { deck, scenes } = window.__deck;
  const st = deck.states[deck.index];
  const el = document.getElementById(scenes[st.si].id);
  const out = [];
  for (const n of el.querySelectorAll('.draw, [data-grow], .pop')) {
    if (n.closest('[data-show]:not(.is-on)')) continue;
    const cs = getComputedStyle(n);
    if (Number(cs.opacity) < 0.15 && !n.closest('#hero')) out.push(`${n.tagName}.${n.getAttribute('class')} opacity ${cs.opacity}`);
    if (n.hasAttribute('data-grow')) {
      const b = n.getBBox();
      if (b.width < 0.5 || b.height < 0.5) out.push(`${n.tagName}.${n.getAttribute('class')} not grown`);
    }
    if (n.classList.contains('draw') && Math.abs(parseFloat(cs.strokeDashoffset) || 0) > 1) out.push(`${n.tagName}.${n.getAttribute('class')} not drawn`);
  }
  return out.slice(0, 5);
});

let presses = 0;
const keys = ['ArrowRight', 'PageDown', 'Space', 'ArrowDown'];
let s = await state();
await page.screenshot({ path: `${OUT}/${String(0).padStart(2, '0')}-${s.id}-b${s.beat}.png` });
const log = [`start: ${s.id} beat ${s.beat}`];
const problems = [];
while (s.index < s.total - 1) {
  const key = keys[presses % keys.length];
  await page.keyboard.press(key);
  presses += 1;
  await settle();
  const n = await state();
  if (n.index !== s.index + 1) problems.push(`${key} went from ${s.index} to ${n.index}`);
  s = n;
  const bad = await hiddenAtRest();
  if (bad.length) problems.push(`${s.id} beat ${s.beat}: ${bad.join('; ')}`);
  log.push(`press ${presses} (${key}) -> ${s.id} beat ${s.beat}`);
  await page.screenshot({ path: `${OUT}/${String(presses).padStart(2, '0')}-${s.id}-b${s.beat}.png` });
}

// back keys, Home, overlays
const checks = {};
await page.keyboard.press('PageUp'); await settle();
checks.pageUp = (await state()).index === s.total - 2;
await page.keyboard.press('ArrowLeft'); await settle();
checks.arrowLeft = (await state()).index === s.total - 3;
await page.keyboard.press('ArrowUp'); await settle();
checks.arrowUp = (await state()).index === s.total - 4;
await page.keyboard.press('Home'); await settle();
checks.home = (await state()).index === 0;
await page.keyboard.press('a');
checks.appendixOpens = await page.evaluate(() => !document.getElementById('appendix').hidden);
await page.keyboard.press('PageDown');
checks.appendixPaging = await page.evaluate(() => !document.querySelectorAll('.panel')[1].hidden);
checks.deckHeldWhileAppendixOpen = (await state()).index === 0;
await page.screenshot({ path: `${OUT}/appendix.png` });
await page.keyboard.press('Escape');
checks.escClosesAppendix = await page.evaluate(() => document.getElementById('appendix').hidden);
await page.keyboard.press('t');
await page.waitForTimeout(1200);
checks.timerShows = await page.evaluate(() => { const t = document.querySelector('.timer'); return !t.hidden && /^4:5\d$/.test(t.textContent); });
await page.keyboard.press('t');
checks.timerHides = await page.evaluate(() => document.querySelector('.timer').hidden);

console.log(log.join('\n'));
console.log(`\nResting states: ${s.total}. Key presses start to end: ${presses}.`);
console.log('Checks:', checks);
if (mode === 'file') console.log(`Offline file:// run. External requests attempted: ${external.length}. Failed requests: ${failed.length}.`);
if (errors.length) console.log('Page errors:', errors);
if (problems.length) console.log('Problems:\n ' + problems.join('\n '));
await browser.close();
await server?.close();
const ok = !problems.length && !errors.length && Object.values(checks).every(Boolean) && external.length === 0;
process.exit(ok ? 0 : 1);
