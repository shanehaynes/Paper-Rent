// Recomputes json.ratios from json.data and json.supplementary, so every ratio has one definition.
// `node scripts/compute-ratios.mjs` rewrites paper_rent_data.json; `--check` fails if the stored
// ratios differ from a fresh computation (verify-numbers.mjs runs the check).
//
// Definitions (consolidated scope throughout: net income, equity and CFO all include
// noncontrolling interests):
//   ROE              = net income / average total equity
//   Net margin       = net income / total revenue
//   Asset turnover   = total revenue / average total assets
//   Leverage         = average total assets / average total equity   (equity multiplier)
//   CFO/NI           = CFO / net income
//   Accruals         = net income − CFO                                ($M)
//   Revenue growth, CFO growth = this year / prior year − 1
//   SL rec / revenue = straight-line rent receivable (year-end) / total revenue   (reported GAAP)
//   ACL / gross loans= allowance / (net loans + allowance) for OHI and SBRA (allowance on loans only).
//                      MPW's allowance covers loans AND financing leases, so its denominator is
//                      net loans + net financing leases + allowance (combined exposure).
//   Largest tenant / revenue = disclosed revenue share (OHI), or tenant revenue / total revenue
//                      where a dollar figure is disclosed (MPW FY2022 via the FY2024 10-K; FY2024).
//   Debt / assets    = total debt (carrying value of all borrowings) / total assets
// Flow ratios on average balances start in the second year; FY2021 has point-in-time ratios only.
import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../paper_rent_data.json', import.meta.url);
const J = JSON.parse(await readFile(path, 'utf8'));
const Y = J.years;
const NI = 'Net income (loss), consolidated';
const D = (co, k, y) => J.data[co][k][Y.indexOf(y)];
const S = (co, k, y) => J.supplementary[co][k]?.[Y.indexOf(y)] ?? null;
const avg = (co, k, y) => (D(co, k, y) + D(co, k, y - 1)) / 2;

function acl(co, y) {
  const a = D(co, 'Allowance for credit losses on loans', y);
  const loans = D(co, 'Loans to tenants (mortgage and other loans receivable)', y);
  if (a == null || loans == null) return null;
  if (co === 'MPW') return a / (loans + S('MPW', 'Investment in financing leases', y) + a);
  return a / (loans + a);
}

function largest(co, y) {
  if (co === 'OHI') return S('OHI', 'Largest operator share of total revenue (disclosed)', y);
  const v = D(co, 'Revenue from largest single tenant', y);
  return v == null ? null : v / D(co, 'Total revenue', y);
}

export function computeRatios() {
  const out = {};
  for (const co of Object.keys(J.data)) {
    out[co] = {};
    for (const y of Y) {
      const ni = D(co, NI, y), cfo = D(co, 'Cash flow from operations (CFO)', y), rev = D(co, 'Total revenue', y);
      const sl = D(co, 'Straight-line rent receivable (balance)', y);
      const r = {};
      if (y > Y[0]) {
        r.ROE = ni / avg(co, 'Total equity', y);
        r['Net margin'] = ni / rev;
        r['Asset turnover'] = rev / avg(co, 'Total assets', y);
        r.Leverage = avg(co, 'Total assets', y) / avg(co, 'Total equity', y);
        r['CFO/NI'] = cfo / ni;
      }
      r.Accruals = ni - cfo;
      if (y > Y[0]) {
        r['Revenue growth'] = rev / D(co, 'Total revenue', y - 1) - 1;
        r['CFO growth'] = cfo / D(co, 'Cash flow from operations (CFO)', y - 1) - 1;
      }
      r['SL rec / revenue'] = sl == null ? null : sl / rev;
      r['ACL / gross loans'] = acl(co, y);
      r['Largest tenant / revenue'] = largest(co, y);
      r['Debt / assets'] = D(co, 'Total debt (sum of all borrowings)', y) / D(co, 'Total assets', y);
      out[co][String(y)] = r;
    }
  }
  return out;
}

const fresh = computeRatios();
if (process.argv.includes('--check')) {
  const bad = [];
  for (const co of Object.keys(fresh)) for (const y of Object.keys(fresh[co])) for (const [k, v] of Object.entries(fresh[co][y])) {
    const got = J.ratios[co]?.[y]?.[k];
    if (!(got === v || (got != null && v != null && Math.abs(got - v) < 1e-12))) bad.push(`${co} FY${y} ${k}: stored ${got}, computed ${v}`);
  }
  if (bad.length) { console.error(bad.join('\n')); console.error(`compute-ratios --check FAILED: ${bad.length} stale ratio(s).`); process.exit(1); }
  console.log('compute-ratios --check passed: stored ratios equal a fresh computation from the inputs.');
} else {
  J.ratios = fresh;
  await writeFile(path, `${JSON.stringify(J, null, 1)}\n`);
  console.log('compute-ratios: ratios rewritten.');
}
