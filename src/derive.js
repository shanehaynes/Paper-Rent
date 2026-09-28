// Accessors and derived values. Pure functions of paper_rent_data.json.
// verify-numbers.mjs imports allDerived() to build its candidate set.

import json from '../paper_rent_data.json' with { type: 'json' };

export const J = json;
export const YEARS = json.years;
export const COS = ['MPW', 'OHI', 'SBRA'];
export const F = json.story_facts;

export const L = {
  revenue: 'Total revenue',
  ni: 'Net income (loss) attributable to common stockholders',
  cfo: 'Cash flow from operations (CFO)',
  slAdj: 'Straight-line rent adjustment (non-cash)',
  assets: 'Total assets',
  equity: 'Total equity',
  debt: 'Total debt (sum of all borrowings)',
  slRec: 'Straight-line rent receivable (balance)',
  loans: 'Loans to tenants (mortgage and other loans receivable)',
  acl: 'Allowance for credit losses on loans',
  writeoffs: 'Straight-line rent / receivable write-offs during the year',
  largest: 'Revenue from largest single tenant',
  impair: 'Impairment charges (real estate and other)',
  jv: 'Income (loss) from unconsolidated joint ventures',
};

const i = (y) => YEARS.indexOf(Number(y));
export const d = (co, item, y) => json.data[co][item][i(y)];
export const s = (co, item, y) => json.supplementary[co][item][i(y)];
export const r = (co, name, y) => json.ratios[co][String(y)]?.[name] ?? null;
export const note = (co, item) => json.notes[`${co}|${item}`] ?? null;

const avg = (co, item, y) => (d(co, item, y) + d(co, item, y - 1)) / 2;

// Sabra revenue excluding resident fees (managed senior housing).
export const sbraComparableRevenue = (y) =>
  s('SBRA', 'Rental and related revenues', y) + s('SBRA', 'Interest and other income', y);

export const growth = (co, item, y) => d(co, item, y) / d(co, item, y - 1) - 1;

// ROE = margin × turnover × leverage, average balances, total revenue for every company.
export function dupont(co, y) {
  return {
    roe: r(co, 'ROE', y),
    margin: r(co, 'Net margin', y),
    turnover: r(co, 'Asset turnover', y),
    leverage: r(co, 'Leverage', y),
  };
}

// Sabra's margin and turnover on comparable (rental + interest) revenue. Appendix only.
export function sbraComparableDupont(y) {
  const rev = sbraComparableRevenue(y);
  return { margin: d('SBRA', L.ni, y) / rev, turnover: rev / avg('SBRA', L.assets, y) };
}

export const accrualsExGain = (y) => r('MPW', 'Accruals', y) - s('MPW', 'Gain on sale of real estate', y);

// CFO with every new loan advanced treated as if it came straight back as rent or interest.
export const mpwCfoLessLoans = (y) => d('MPW', L.cfo, y) - s('MPW', 'Investment in loans receivable (CFS)', y);

// MPW FY2023 straight-line receivable on revenue, both before reserves: the Steward straight-line
// reserve is added back to the receivable and the reserves booked as negative revenue to revenue.
export const mpwSlRecOnRevenueBeforeReserves = () =>
  (d('MPW', L.slRec, 2023) + F.MPW_steward_charges_2023['Reserve of straight-line rent receivables']) /
  (d('MPW', L.revenue, 2023) + F.MPW_2023_revenue_reserves);

export const mpwSlRecSeriesPreEvent = () => [
  r('MPW', 'SL rec / revenue', 2021),
  r('MPW', 'SL rec / revenue', 2022),
  mpwSlRecOnRevenueBeforeReserves(),
];

export const mpwSlOnRentBilled = (y) =>
  s('MPW', 'Straight-line rent revenue', y) / s('MPW', 'Rent billed', y);

export const stewardChargesTotal = () =>
  F.MPW_steward_charges_2023.total + F.MPW_steward_charges_2024.total;

export const phpNoncashRevenue = () => {
  const p = F.MPW_2023_noncash_revenue_from_PHP_equity;
  return p.financing_lease_income + p.interest_income;
};

// Allowance over everything it covers: loans + financing leases (gross of allowance).
export const mpwAltAcl = (y) =>
  d('MPW', L.acl, y) /
  (d('MPW', L.loans, y) + s('MPW', 'Investment in financing leases', y) + d('MPW', L.acl, y));

export const ohiParentEquityGap = (y) => 1 - F.OHI_parent_only_equity[y] / d('OHI', L.equity, y);

const MIX = {
  MPW: [
    ['Rent billed', 'Rent billed'],
    ['Straight-line rent', 'Straight-line rent revenue'],
    ['Financing leases', 'Income from financing leases'],
    ['Interest and other', 'Interest and other income'],
  ],
  OHI: [
    ['Rental income', 'Rental income'],
    ['Real-estate loan interest', 'Real estate loans interest income'],
    ['Non-RE loan interest', 'Non-real estate loans interest income'],
    ['Miscellaneous', 'Miscellaneous income'],
  ],
  SBRA: [
    ['Rental', 'Rental and related revenues'],
    ['Resident fees & services', 'Resident fees and services'],
    ['Interest', 'Interest and other income'],
  ],
};

// Shares are of the component sum, which can differ from reported total revenue by rounding.
export function revenueMix(co, y) {
  const parts = MIX[co].map(([label, key]) => ({ label, key, value: s(co, key, y) }));
  const complete = parts.every((p) => p.value != null);
  const total = parts.reduce((a, p) => a + (p.value ?? 0), 0);
  return parts.map((p) => ({ ...p, share: complete ? p.value / total : null }));
}

// Negative JSON values that the page shows as magnitudes. verify-numbers.mjs rejects any other sign change.
export const shownAsMagnitude = () => [d('MPW', L.slAdj, 2022), d('OHI', L.slAdj, 2024)];

export function allDerived() {
  const out = [];
  for (const y of YEARS) {
    out.push(sbraComparableRevenue(y), mpwSlOnRentBilled(y), mpwAltAcl(y), ohiParentEquityGap(y));
    out.push(accrualsExGain(y), mpwCfoLessLoans(y));
    if (y > YEARS[0]) out.push(sbraComparableDupont(y).margin, sbraComparableDupont(y).turnover);
    for (const co of COS) {
      for (const p of revenueMix(co, y)) if (p.share != null) out.push(p.share);
      if (y > YEARS[0]) {
        out.push(growth(co, L.ni, y), growth(co, L.cfo, y));
      }
    }
  }
  out.push(mpwSlRecOnRevenueBeforeReserves(), stewardChargesTotal(), phpNoncashRevenue());
  return out.filter((v) => Number.isFinite(v));
}
