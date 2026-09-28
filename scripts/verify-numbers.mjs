// Build-time number check. Renders dist/paper-rent.html, extracts every $…, …% and …× token
// (text, tooltips, chart labels, screen-reader tables, appendix) and asserts each one derives
// from paper_rent_data.json through the formatter. Any orphan fails the build.
// Exempt: years and footnote indices (neither carries $, % or ×).
import { chromium } from 'playwright';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { allDerived, J } from '../src/derive.js';
import { usd, pct, mult } from '../src/format.js';

const MINUS = '−';
const norm = (s) => s.replace(/[-–−]/g, MINUS).replace(/^\+/, '').replace(/,/g, '');

// ---- candidate set: every numeric leaf in the JSON plus every derived value, through every formatter variant
const values = [];
const strings = [];
(function walk(v) {
  if (typeof v === 'number') values.push(v);
  else if (typeof v === 'string') strings.push(v);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
})(J);
values.push(...allDerived());

const allowed = new Map();
const allow = (token, v) => { const k = norm(token); if (!allowed.has(k)) allowed.set(k, v); };
for (const v of values) {
  for (const x of [v, Math.abs(v)]) {
    for (const decimals of [0, 1]) { allow(usd(x, { decimals }), v); allow(pct(x, { decimals }), v); }
    allow(mult(x), v);
  }
}
const jsonText = norm(strings.join('\n'));

// ---- tokens on the rendered page
const file = resolve('dist/paper-rent.html');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(file).href);
await page.waitForFunction(() => window.__deck);
const texts = await page.evaluate(() => {
  const out = [];
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    if (n.parentElement.closest('script, style')) continue;
    if (n.textContent.trim()) out.push(n.textContent);
  }
  for (const el of document.querySelectorAll('[data-tip], [aria-label], [title]')) {
    for (const a of ['data-tip', 'aria-label', 'title']) if (el.hasAttribute(a)) out.push(el.getAttribute(a));
  }
  return out;
});
await browser.close();

const NUM = String.raw`\d[\d,]*(?:\.\d+)?`;
const SIGN = String.raw`[+\-−]?`;
const RX = [
  new RegExp(String.raw`${SIGN}\$${NUM}[MB]?`, 'g'),                                   // $787M, −$1.06B
  new RegExp(String.raw`(?:${NUM}[–-])?${SIGN}${NUM}%`, 'g'),                     // 10.8%, 47–51%
  new RegExp(String.raw`${SIGN}${NUM}×`, 'g'),                                    // 2.36×
];

let count = 0;
const orphans = new Map();
for (const text of texts) {
  for (const rx of RX) {
    for (const m of text.matchAll(rx)) {
      let tokens = [m[0]];
      const range = /^(\d[\d,.]*)[–-](.+%)$/.exec(m[0]);
      if (range) tokens = [`${range[1]}%`, range[2]];
      for (const tok of tokens) {
        count += 1;
        const k = norm(tok);
        if (allowed.has(k)) continue;
        if (jsonText.includes(k)) continue; // quoted verbatim from a JSON string (notes, timeline, profiles)
        orphans.set(tok, text.trim().slice(0, 90));
      }
    }
  }
}

// ---- no figures typed into source
const typed = [];
const SRC_RX = /\$\d|\d%|\d×/;
for (const f of ['index.html', ...(await readdir('src')).filter((n) => n !== 'format.js').map((n) => `src/${n}`)]) {
  if (!/\.(js|html)$/.test(f)) continue;
  (await readFile(f, 'utf8')).split('\n').forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '');
    if (SRC_RX.test(code)) typed.push(`${f}:${i + 1}  ${line.trim().slice(0, 90)}`);
  });
}

console.log(`verify-numbers: ${count} tokens checked against ${allowed.size} formatted candidates from ${values.length} values.`);
if (orphans.size || typed.length) {
  for (const [tok, ctx] of orphans) console.error(`  ORPHAN ${tok}   in "${ctx}"`);
  for (const t of typed) console.error(`  TYPED FIGURE ${t}`);
  console.error(`verify-numbers FAILED: ${orphans.size} orphan token(s), ${typed.length} typed figure(s).`);
  process.exit(1);
}
console.log('verify-numbers passed: every $, % and × on the page traces to paper_rent_data.json.');
