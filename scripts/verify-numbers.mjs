// Build-time number check. Renders dist/paper-rent.html and fails the build unless:
// 1. every $…, …% and …× token (text, tooltips, chart labels, screen-reader tables, appendix) is a
//    JSON or derived value through the formatter WITH ITS SIGN. A magnitude of a negative value is
//    accepted only for the values listed in shownAsMagnitude();
// 2. a token quoted from a JSON string sits in text that contains that whole string;
// 3. every figure with a known position (performance grid, accruals chart, risk tiles, appendix input
//    and ratio tables, named spot checks) equals the value expected there, computed here from the JSON;
// 4. the stored ratios equal a fresh computation from the inputs (scripts/compute-ratios.mjs --check).
// Exempt from 1: years and footnote indices (neither carries $, % or ×).
import { chromium } from 'playwright';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { allDerived, shownAsMagnitude, J } from '../src/derive.js';
import { usd, pct, mult, num } from '../src/format.js';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['scripts/compute-ratios.mjs', '--check'], { stdio: 'inherit' });

const MINUS = '−';
// A leading hyphen is read as a minus sign; nothing else is altered, so signs are compared exactly.
const norm = (s) => s.replace(/^-/, MINUS).replace(/,/g, '');

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
const magnitudes = shownAsMagnitude();
for (const v of values) {
  for (const x of magnitudes.includes(v) ? [v, Math.abs(v)] : [v]) {
    for (const decimals of [0, 1]) {
      for (const plus of [false, true]) { allow(usd(x, { decimals, plus }), v); allow(pct(x, { decimals, plus }), v); }
    }
    for (const decimals of [2, 3]) allow(mult(x, { decimals }), v);
  }
}

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

// ---- figures with a known position
const at = await page.evaluate(() => {
  const txt = (el) => (el ? [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim() : null);
  const rows = (table) => [...table.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((c) => c.textContent.trim()));
  return {
    dupont: [...document.querySelectorAll('#ch3 .cell')].flatMap((cell) =>
      [...cell.querySelectorAll('[data-k]')].map((el) => ({ co: cell.dataset.co, year: cell.dataset.year, k: el.dataset.k, text: txt(el) }))),
    accruals: rows(document.querySelector('#ch4 .acc-a table.sr-only')),
    tiles: [...document.querySelectorAll('#ch5 .tile')].map((tile) => ({
      title: tile.querySelector('h3').textContent,
      rows: [...tile.querySelectorAll('.row')].map((r) => [r.querySelector('.co').textContent, r.querySelector('.latest').textContent.trim()]),
    })),
    inputs: rows(document.querySelector('#ap-inputs table')),
    ratios: rows(document.querySelector('#ap-ratios table')),
    spots: Object.fromEntries(Object.entries({
      callout: '#ch2 .callout', point3: '#ch3 .points li:nth-child(3)', chips: '#ch4 .chips',
      signal1: '#ch6 .signal', check: '#ch6 .check', slSummary: '#ch5 .tile .summary', mpwNote: '#ap-mpw .footnote',
    }).map(([k, sel]) => [k, [...document.querySelectorAll(sel)].map((e) => e.textContent).join(' | ')])),
  };
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
        // quoted from a JSON string (notes, timeline, profiles): the whole string must be in this text
        if (strings.some((str) => str.includes(tok) && text.includes(str))) continue;
        orphans.set(tok, text.trim().slice(0, 90));
      }
    }
  }
}

// ---- expected value at each known position, computed from the JSON alone
const Y = J.years;
const COS = ['MPW', 'OHI', 'SBRA'];
const PRE = Y.slice(0, 3);
const D = (co, item, y) => J.data[co][item][Y.indexOf(Number(y))];
const S = (co, item, y) => J.supplementary[co][item][Y.indexOf(Number(y))];
const R = (co, name, y) => J.ratios[co][String(y)]?.[name] ?? null;
const misplaced = [];
const expect = (where, got, want) => { if (got !== want) misplaced.push(`${where}: shows "${got}", expected "${want}"`); };
const has = (where, text, want) => { if (!text.includes(want)) misplaced.push(`${where}: expected "${want}" in "${text.slice(0, 90)}"`); };

const NI = 'Net income (loss), consolidated';
const CFO = 'Cash flow from operations (CFO)';
const GRID = {
  roe: (co, y) => pct(R(co, 'ROE', y)), ni: (co, y) => usd(D(co, NI, y)), cfo: (co, y) => usd(D(co, CFO, y)),
};
if (at.dupont.length !== COS.length * 3 * 3) misplaced.push(`performance grid: ${at.dupont.length} figures found`);
for (const c of at.dupont) expect(`performance ${c.co} FY${c.year} ${c.k}`, c.text, GRID[c.k](c.co, c.year));

const GAIN = S('MPW', 'Gain on sale of real estate', 2022);
const exGain = R('MPW', 'Accruals', 2022) - GAIN;
COS.forEach((co, i) => Y.forEach((y, k) =>
  expect(`accruals chart ${co} FY${y}`, at.accruals[i]?.[k + 1], usd(R(co, 'Accruals', y), { decimals: 1, plus: true }))));
expect('accruals chart ex-gain marker', at.accruals[3]?.[2], `${usd(exGain, { decimals: 1, plus: true })} ex-gain*`);

const slBefore = (D('MPW', 'Straight-line rent receivable (balance)', 2023) +
  J.story_facts.MPW_steward_charges_2023['Reserve of straight-line rent receivables']) /
  (D('MPW', 'Total revenue', 2023) + J.story_facts.MPW_2023_revenue_reserves);
const TEN = pct(J.story_facts.concentration_disclosure_threshold, { decimals: 0 });
const TILES = [
  ['SL rec / revenue', (co) => (co === 'SBRA' ? 'not disclosed' : pct(R(co, 'SL rec / revenue', 2023)))],
  ['Allowance level', (co) => usd(D(co, 'Allowance for credit losses on loans', 2023), { decimals: 1 })],
  ['Largest tenant / revenue', (co) => ({ MPW: `>${TEN}`, SBRA: `<${TEN}` }[co] ?? pct(R(co, 'Largest tenant / revenue', 2023)))],
  ['Debt / assets', (co) => pct(R(co, 'Debt / assets', 2023))],
];
TILES.forEach(([name, want], i) => COS.forEach((co, k) => expect(`tile "${name}" ${co}`, at.tiles[i]?.rows[k]?.[1], want(co))));
expect('tile "Steward / MPW assets" MPW', at.tiles[2]?.rows[3]?.[1], pct(J.story_facts.MPW_steward_share_of_assets[2023]));

const ITEMS = Object.keys(J.data.MPW);
const COLS = COS.flatMap((co) => Y.map((y) => [co, y]));
ITEMS.forEach((item, i) => COLS.forEach(([co, y], k) =>
  expect(`appendix inputs ${co} FY${y} ${item}`, at.inputs[i]?.[k + 1], num(D(co, item, y)))));

const plusPct = (v) => pct(v, { plus: true });
const RATIOS = {
  ROE: pct, 'Net margin': pct, 'Asset turnover': (v) => mult(v, { decimals: 3 }), Leverage: mult, 'CFO/NI': mult,
  Accruals: (v) => num(v, { plus: true }), 'Revenue growth': plusPct, 'CFO growth': plusPct,
  'SL rec / revenue': pct, 'ACL / gross loans': pct, 'Largest tenant / revenue': pct, 'Debt / assets': pct,
};
Object.entries(RATIOS).forEach(([name, fmt], i) => COLS.forEach(([co, y], k) => {
  const v = J.ratios[co][String(y)][name];
  expect(`appendix ratios ${co} FY${y} ${name}`, at.ratios[i]?.[k + 1], v === undefined ? '–' : fmt(v));
}));

const cfoLessLoans = (y) => D('MPW', CFO, y) - S('MPW', 'Investment in loans receivable (CFS)', y);
const range = (vals) => `${(Math.min(...vals) * 100).toFixed(0)}–${(Math.max(...vals) * 100).toFixed(0)}%`;
has('Ch2 callout', at.spots.callout, pct(J.story_facts.SBRA_resident_fee_share_2024));
has('Ch3 point 3', at.spots.point3, [2022, 2023, 2024].map((y) => pct(R('SBRA', 'Debt / assets', y))).join(' → '));
has('Ch4 gain chip', at.spots.chips, `Gain on property sales ${usd(GAIN, { decimals: 1 })}`);
has('Ch4 loan test', at.spots.chips, PRE.map((y) => usd(cfoLessLoans(y))).join(' → '));
has('Ch5 reported SL ratio', at.spots.slSummary, pct(R('MPW', 'SL rec / revenue', 2023)));
has('Appendix SL sensitivity', at.spots.mpwNote, pct(slBefore));
has('Ch6 signal 1', at.spots.signal1, range(PRE.map((y) => R('MPW', 'SL rec / revenue', y))));
has('Ch6 FY2024 allowance', at.spots.check, usd(D('MPW', 'Allowance for credit losses on loans', 2024)));
has('Ch6 later-disclosed share', at.spots.check, pct(J.story_facts.MPW_steward_revenue_share_2022));

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
const placed = at.dupont.length + COS.length * Y.length + 1 + TILES.length * COS.length +
  (ITEMS.length + Object.keys(RATIOS).length) * COLS.length + 9;
console.log(`verify-numbers: ${placed} positioned figures checked against their expected values.`);
if (orphans.size || typed.length || misplaced.length) {
  for (const [tok, ctx] of orphans) console.error(`  ORPHAN ${tok}   in "${ctx}"`);
  for (const t of typed) console.error(`  TYPED FIGURE ${t}`);
  for (const m of misplaced) console.error(`  MISPLACED ${m}`);
  console.error(`verify-numbers FAILED: ${orphans.size} orphan token(s), ${typed.length} typed figure(s), ${misplaced.length} misplaced figure(s).`);
  process.exit(1);
}
console.log('verify-numbers passed: every $, % and × on the page traces to paper_rent_data.json with its sign, and every positioned figure is the expected one.');
