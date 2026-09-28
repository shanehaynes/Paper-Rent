// All copy for the site. No financial figure is typed here: every number is read from
// paper_rent_data.json (via derive.js) and formatted by format.js.

import {
  J, F, L, YEARS, COS, d, s, r, note,
  sbraComparableRevenue, sbraComparableDupont, growth, dupont, accrualsExGain, mpwCfoLessLoans,
  mpwSlRecOnRevenueBeforeReserves, mpwSlRecSeriesPreEvent,
  mpwSlOnRentBilled, stewardChargesTotal, phpNoncashRevenue, mpwAltAcl, ohiParentEquityGap,
  revenueMix,
} from './derive.js';
import { usd, pct, pctRange, mult, multRange, num, count, arrow, showDate, ND } from './format.js';

const [Y21, Y22, Y23, Y24] = YEARS;
const PRE = [Y21, Y22, Y23];
const FLOW = [Y22, Y23, Y24];
const fy = (y) => `FY${y}`;
const P = F.profiles_FY2024;

export const NAMES = {
  MPW: 'Medical Properties Trust',
  OHI: 'Omega Healthcare Investors',
  SBRA: 'Sabra Health Care REIT',
};

export const footer =
  `Source: company Form 10-K filings ${fy(Y21)}–${fy(Y24)} (SEC EDGAR). GAAP figures only; FFO/AFFO excluded.`;

export const authors = ['Annie Wang', 'Rachel Rosenberg', 'Shane Haynes'].join(' · ');

export const badges = {
  pre: `Pre-event window ${fy(Y21)}–${fy(Y23)}`,
  outcome: `Outcome window ${fy(Y24)}`,
  both: `Pre-event window: ${fy(Y21)}–${fy(Y23)} · Outcome window: ${fy(Y24)}`,
};

export const rail = [
  'The issue', 'Three landlords', 'Who performed better?', 'Earnings vs. cash',
  'The warning lights', 'The verdict', 'How we used AI', 'Questions',
];

const ratioSeries = (co, name, years) => years.map((y) => r(co, name, y));
const pctSeries = (co, name, years) => arrow(ratioSeries(co, name, years).map((v) => pct(v)));
const roeSeries = (co) => arrow(FLOW.map((y) => pct(r(co, 'ROE', y))));

// ---------------------------------------------------------------- Chapter 0
export const hero = {
  eyebrow: 'MGT 402 · Peer Case 1',
  title: 'Paper Rent',
  subtitle:
    'Was Medical Properties Trust (MPW) paying its own rent — and would the financial statements have told you?',
  buildings: COS.map((co) => ({ co, name: NAMES[co] })),
  tokenLabels: { out: 'loan', back: 'rent', tenant: 'Tenant' },
  artTitle: 'Three healthcare REITs',
  artDesc: 'Outlined buildings for MPW, OHI and SBRA. A dollar token leaves MPW for its tenant as a loan and returns as rent.',
  cue: 'Scroll ↓ or press →',
  caption:
    `The allegation (Viceroy Research, ${showDate(F.MPW_viceroy_report_date)}): MPW lends to its tenant, ` +
    'and the money comes back as rent.',
};

// ---------------------------------------------------------------- Chapter 1
export const issue = {
  headline: 'When does recognized rent stop being income?',
  body:
    'A landlord books rent evenly over a lease (straight-line) and can lend money to the tenants who pay it. ' +
    'Both let reported earnings run ahead of cash. The question is whether MPW’s did — and whether it ' +
    'recognized in time that its tenants couldn’t pay.',
  allegation:
    `On ${showDate(F.MPW_viceroy_report_date)}, short-seller Viceroy Research alleged that MPW was lending ` +
    'tenants the money to pay its rent.',
  statements: [
    { title: 'Income statement', lines: ['Straight-line rent revenue', 'Reserves booked as negative revenue'] },
    { title: 'Balance sheet', lines: ['Straight-line rent receivable', 'Loans to tenants', 'Allowance for credit losses (ACL)'] },
    { title: 'Cash flow statement', lines: ['Net income vs. cash flow from operations (CFO)', 'The “straight-line rent” add-back'] },
    { title: 'Footnotes', lines: ['Tenant concentration', 'Moves to cash basis', 'Write-offs'] },
  ],
  explainer: {
    title: 'Straight-line rent',
    labels: {
      cash: 'Contractual cash rent', revenue: 'Straight-line revenue', receivable: 'Receivable', year: 'Yr',
      tag: 'Illustrative lease',
    },
    desc: 'Illustrative lease. Cash rent rises in annual steps while straight-line revenue is flat and starts above cash; the gap accumulates as a receivable.',
    caption: 'Revenue now, cash later. The receivable is a bet that the tenant lasts.',
  },
};

// ---------------------------------------------------------------- Chapter 2
const mixFor = (co) =>
  revenueMix(co, Y24).map((p) => ({ label: p.label, value: p.value, share: p.share, text: pct(p.share) }));

export const landlords = {
  headline: 'Same industry. Very different bets.',
  columns: [
    {
      co: 'MPW', name: NAMES.MPW,
      big: count(P.MPW.properties), bigLabel: 'properties',
      sub: `${count(P.MPW.tenants)} tenants`,
      mix: P.MPW.mix,
      largest: `Largest tenants: ${P.MPW.largest}`,
      was:
        `Steward was the largest in ${fy(Y22)}: ${pct(F.MPW_steward_revenue_share_2022)} of revenue, ` +
        `${pct(F.MPW_steward_share_of_assets[Y22])} of assets. It filed for bankruptcy in ${Y24}.`,
    },
    {
      co: 'OHI', name: NAMES.OHI,
      big: count(P.OHI.facilities), bigLabel: 'facilities',
      sub: `${count(P.OHI.operators)} operators`,
      mix: P.OHI.mix,
      largest: `Largest tenant: ${P.OHI.largest}`,
    },
    {
      co: 'SBRA', name: NAMES.SBRA,
      big: count(P.SBRA.properties), bigLabel: 'properties',
      sub: `${count(P.SBRA.loans)} loans · ${count(P.SBRA.preferred_equity)} preferred equity investments`,
      mix: P.SBRA.mix,
      largest: `Largest tenant: ${P.SBRA.largest}`,
    },
  ],
  mixTitle: `${fy(Y24)} revenue mix`,
  mix: { MPW: mixFor('MPW'), OHI: mixFor('OHI'), SBRA: mixFor('SBRA') },
  callout:
    `${pct(F.SBRA_resident_fee_share_2024)} of SBRA’s ${fy(Y24)} revenue is resident-fee revenue from its managed ` +
    'senior housing, not rent. The ratios that follow use total revenue for all three companies.',
  mixNote:
    'Only MPW reports straight-line rent as its own revenue line. OHI’s sits inside rental income ' +
    `(${usd(Math.abs(d('OHI', L.slAdj, Y24)))} of non-cash straight-line rent and effective interest in ${fy(Y24)}, ` +
    'per its cash flow statement); SBRA’s sits inside rental revenue.',
  takeaway:
    'MPW: few, large, financially fragile hospital operators. OHI: many nursing-home operators. ' +
    'SBRA: diversified, part-landlord, part-operator.',
};

// ---------------------------------------------------------------- Chapter 3
const sbraLev = FLOW.map((y) => r('SBRA', 'Leverage', y));

export const performance = {
  headline: 'OHI earned more, more steadily, with cash to show for it.',
  formula: 'ROE = margin × turnover × leverage',
  years: FLOW,
  grid: COS.map((co) => ({
    co,
    cells: FLOW.map((y) => {
      const dp = dupont(co, y);
      return {
        year: y, ...dp,
        text: { roe: pct(dp.roe), margin: pct(dp.margin), turnover: mult(dp.turnover, { decimals: 3 }), leverage: mult(dp.leverage) },
      };
    }),
  })),
  points: [
    `OHI ROE ${roeSeries('OHI')}; positive every year, CFO above net income every year.`,
    `MPW ROE collapses ${roeSeries('MPW')} as Steward unwinds; CFO falls three years running ` +
      `(${arrow([usd(d('MPW', L.cfo, Y21)), usd(d('MPW', L.cfo, Y24))])}).`,
    `SBRA’s losses (${fy(Y21)}–${String(Y22).slice(2)}) are mostly joint-venture (JV) impairments; ${fy(Y22)} also ` +
      `reflects real-estate impairments (${usd(d('SBRA', L.impair, Y22), { decimals: 1 })}) and a tenant write-off ` +
      `(${usd(F.SBRA_north_american_writeoff_2022.total, { decimals: 1 })}). Lowest leverage (${multRange(sbraLev)}), improving.`,
  ],
  verdict: 'OHI > SBRA > MPW',
  footnote:
    `Average-balance ratios on total revenue (SBRA’s includes resident fees). Total equity incl. ` +
    `noncontrolling interests (OHI parent-only equity is ` +
    `~${pct(ohiParentEquityGap(Y23), { decimals: 0 })} lower).`,
};

// ---------------------------------------------------------------- Chapter 4
const GAIN = 'Gain on sale of real estate';

export const accruals = {
  headline: `In ${fy(Y22)}, MPW’s earnings rose while its cash fell.`,
  sub:
    'Depreciation is a large non-cash expense, so a landlord’s net income normally sits below its cash flow ' +
    'from operations (CFO): accruals (net income − CFO) are normally negative.',
  barsTitle: 'Total accruals (net income − CFO)',
  bars: COS.map((co) => ({
    co,
    values: PRE.map((y) => {
      const v = r(co, 'Accruals', y);
      return { year: y, value: v, text: usd(v, { decimals: 1, plus: true }) };
    }),
  })),
  exGain: {
    co: 'MPW', year: Y22, value: accrualsExGain(Y22),
    text: `${usd(accrualsExGain(Y22), { decimals: 1, plus: true })} ex-gain`,
  },
  barNotes: {
    normal: 'Below zero is normal',
    glow:
      `MPW ${fy(Y22)} turned positive (${usd(r('MPW', 'Accruals', Y22), { decimals: 1, plus: true })}) only through a ` +
      `${usd(s('MPW', GAIN, Y22), { decimals: 1 })} gain on property sales, mainly the Macquarie sale; ` +
      `${usd(accrualsExGain(Y22), { decimals: 1, plus: true })} without it`,
    loss: 'reserves & impairments',
  },
  lines: {
    title: 'MPW: net income vs. CFO',
    ni: PRE.map((y) => ({ year: y, value: d('MPW', L.ni, y), text: usd(d('MPW', L.ni, y)) })),
    cfo: PRE.map((y) => ({ year: y, value: d('MPW', L.cfo, y), text: usd(d('MPW', L.cfo, y)) })),
    labels: { ni: 'Net income', cfo: 'CFO' },
    callout:
      `In ${fy(Y22)}, net income rises (${pct(growth('MPW', L.ni, Y22), { plus: true })}) ` +
      `while CFO falls (${pct(r('MPW', 'CFO growth', Y22))}).`,
  },
  chipsTitle: `What explains the gap · MPW ${fy(Y22)}`,
  chips: [
    `Gain on property sales ${usd(s('MPW', GAIN, Y22), { decimals: 1 })}`,
    `Straight-line rent and other non-cash revenue ${usd(Math.abs(d('MPW', L.slAdj, Y22)), { decimals: 1 })}`,
    `Offset: impairments ${usd(d('MPW', L.impair, Y22), { decimals: 1 })}`,
  ],
  limit: {
    title: 'What this test cannot see',
    body:
      'Rent paid out of the landlord’s own loan still counts in CFO; the loan sits in investing. ' +
      'Accruals cannot detect round-tripping.',
    test:
      `Harshest case, CFO less every new loan advanced: ${arrow(PRE.map((y) => usd(mpwCfoLessLoans(y))))} ` +
      `(reported ${arrow(PRE.map((y) => usd(d('MPW', L.cfo, y))))}).`,
  },
  anomalies:
    `SBRA ${fy(Y21)}–${String(Y22).slice(2)}: large negative accruals from impairments and write-offs while CFO held ` +
    `at ${arrow([Y21, Y22].map((y) => usd(d('SBRA', L.cfo, y))))}. The cash was fine; the assets were marked down. ` +
    `MPW ${fy(Y23)}–${String(Y24).slice(2)} is different: its cash fell too.`,
};

// ---------------------------------------------------------------- Chapter 5
const spark = (co, values) => ({
  co,
  values: values.map((v, k) => ({ year: PRE[k], value: v, text: pct(v) })),
  latest: pct(values[values.length - 1]),
});
const mpwSl = mpwSlRecSeriesPreEvent();
const stewardAssets = PRE.map((y) => F.MPW_steward_share_of_assets[y]);

const chargeItems = (o) =>
  Object.entries(o).filter(([k]) => k !== 'total').map(([label, v]) => ({ label, value: v, text: usd(v) }));

export const warnings = {
  headline: 'The signals were in the filings before Steward failed.',
  tiles: [
    {
      title: 'Straight-line receivable ÷ revenue',
      series: [
        spark('MPW', mpwSl),
        spark('OHI', ratioSeries('OHI', 'SL rec / revenue', PRE)),
        spark('SBRA', ratioSeries('SBRA', 'SL rec / revenue', PRE)),
      ],
      summary:
        `MPW ${pctRange(mpwSl)} vs OHI ${pctRange(ratioSeries('OHI', 'SL rec / revenue', PRE))} (SBRA ${ND})`,
      caption: 'MPW carried half a year or more of revenue as rent not yet billed.',
      footnote:
        `MPW ${fy(Y23)} is shown before reserves on both sides (${pct(mpwSlRecOnRevenueBeforeReserves())}): ` +
        `${usd(F.MPW_steward_charges_2023['Reserve of straight-line rent receivables'])} of straight-line reserves ` +
        `added back to the receivable, ${usd(F.MPW_2023_revenue_reserves)} of reserves added back to revenue. ` +
        `The raw ${pct(r('MPW', 'SL rec / revenue', Y23))} is distorted by them.`,
      nd: { SBRA: note('SBRA', L.slRec) },
    },
    {
      title: 'Allowance for credit losses (ACL) ÷ gross loans',
      series: COS.map((co) => spark(co, ratioSeries(co, 'ACL / gross loans', PRE))),
      summary:
        `MPW ${pctSeries('MPW', 'ACL / gross loans', PRE)}, OHI ${pctSeries('OHI', 'ACL / gross loans', PRE)}, ` +
        `SBRA ${pct(r('SBRA', 'ACL / gross loans', Y23))}`,
      caption:
        `Like for like (loans + financing leases), MPW reserved ${arrow(PRE.map((y) => pct(mpwAltAcl(y))))} against ` +
        `OHI’s ${pctSeries('OHI', 'ACL / gross loans', PRE)}, while lending Steward a further ` +
        `${usd(F.MPW_new_steward_loan_2022Q2)} in ${Y22}.`,
      footnote:
        'MPW’s allowance also covers financing leases, but the ratio plotted divides it by loans only, ' +
        'so the plotted MPW line is overstated.',
    },
    {
      title: 'Largest tenant ÷ revenue',
      series: [
        spark('MPW', PRE.map(() => null)),
        spark('OHI', ratioSeries('OHI', 'Largest tenant / revenue', PRE)),
        spark('SBRA', ratioSeries('SBRA', 'Largest tenant / revenue', PRE)),
      ],
      summary:
        `MPW ${ND}; OHI ${pctSeries('OHI', 'Largest tenant / revenue', PRE)}; ` +
        `SBRA <${pct(F.concentration_disclosure_threshold, { decimals: 0 })}, ${ND}`,
      caption:
        `Steward ${arrow(stewardAssets.map((v) => pct(v)))} of assets. MPW’s ${fy(Y21)}–${String(Y23).slice(2)} 10-Ks ` +
        `said only that Steward was more than ${pct(F.concentration_disclosure_threshold, { decimals: 0 })} of revenue; ` +
        `the ${fy(Y22)} share (${pct(F.MPW_steward_revenue_share_2022)}) first appeared in the ` +
        `${F.MPW_steward_share_first_disclosed_in}.`,
      pulse: 'MPW',
      nd: { MPW: note('MPW', L.largest), SBRA: note('SBRA', L.largest) },
    },
    {
      title: 'Debt ÷ assets',
      series: COS.map((co) => spark(co, ratioSeries(co, 'Debt / assets', PRE))),
      summary:
        `MPW ${pctSeries('MPW', 'Debt / assets', PRE)}, OHI ${pctSeries('OHI', 'Debt / assets', PRE)}, ` +
        `SBRA ${pctRange(ratioSeries('SBRA', 'Debt / assets', PRE))}`,
      caption: `Leverage did not set MPW apart — until ${fy(Y24)}.`,
    },
  ],
  timeline: {
    title: 'When did they admit it?',
    lanes: { above: 'OHI', below: 'MPW' },
    bands: PRE.map((y, k) => ({
      co: 'OHI', year: y,
      text:
        k === 0 ? `${count(F.OHI_operators_moved_to_cash_basis[y])} operators moved to cash basis`
        : k === 1 ? `${count(F.OHI_operators_moved_to_cash_basis[y])} more ` +
          `(${pct(s('OHI', "Cash-basis operators' share of revenue", y))} of revenue)`
        : `${count(F.OHI_operators_moved_to_cash_basis[y])} more, and ` +
          `${count(F.OHI_operators_moved_to_cash_basis[Y24])} in ${Y24}`,
    })),
    events: [
      { co: 'MPW', date: F.MPW_prospect_cash_basis_date, text: 'MPW moves Prospect to cash basis' },
      { co: 'MPW', date: F.MPW_viceroy_report_date, text: 'Viceroy report' },
      {
        co: 'MPW', date: `${Y23}-Q4`,
        text: `Steward pays ${usd(F.MPW_steward_q4_2023_paid)} of ${usd(F.MPW_steward_q4_2023_due)} due`,
      },
      { co: 'MPW', date: F.MPW_steward_cash_basis_date, text: 'MPW moves Steward to cash basis' },
    ],
  },
  check: {
    title: `The ${fy(Y24)} check`,
    waterfallTitle: 'Steward charges',
    charges: [
      {
        year: Y23, total: F.MPW_steward_charges_2023.total, totalText: usd(F.MPW_steward_charges_2023.total),
        items: chargeItems(F.MPW_steward_charges_2023),
      },
      {
        year: Y24, total: F.MPW_steward_charges_2024.total, totalText: usd(F.MPW_steward_charges_2024.total),
        items: chargeItems(F.MPW_steward_charges_2024),
      },
    ],
    side: [
      {
        label: 'MPW allowance for credit losses',
        value: arrow([usd(d('MPW', L.acl, Y23)), usd(d('MPW', L.acl, Y24))]),
        sub: `after ${usd(F.MPW_credit_loss_provision[Y24])} of provisions`,
      },
      { label: `${fy(Y24)} debt ÷ assets`, value: pct(r('MPW', 'Debt / assets', Y24)), sub: '' },
    ],
    closing:
      'The combination (heavy straight-line accruals, thin reserves, a concentration disclosed only as ' +
      `“more than ${pct(F.concentration_disclosure_threshold, { decimals: 0 })} of revenue”, late moves to cash basis) ` +
      'was MPW’s alone.',
  },
};

// ---------------------------------------------------------------- Chapter 6
export const verdict = {
  headline: 'Overstated? Yes, in substance. Fabricated? No evidence.',
  signals: [
    {
      kicker: 'Signal 1 · Cash flows',
      title: 'Earnings outran cash.',
      body:
        `${fy(Y22)} net income ${pct(growth('MPW', L.ni, Y22), { plus: true })}, CFO ` +
        `${pct(r('MPW', 'CFO growth', Y22))}; CFO then fell every year to ${fy(Y24)}. Non-cash straight-line rent was ` +
        `${pctRange([mpwSlOnRentBilled(Y21), mpwSlOnRentBilled(Y22)])} on top of every dollar of rent billed ` +
        `(${fy(Y21)}–${String(Y22).slice(2)}).`,
    },
    {
      kicker: 'Signal 2 · Balance sheet and footnotes',
      title: 'Losses were recognized late.',
      body:
        `Allowance ${pctRange(PRE.map((y) => mpwAltAcl(y)))} of the loans and financing leases it covered vs OHI’s ` +
        `${pctRange(ratioSeries('OHI', 'ACL / gross loans', PRE))} of loans; Steward’s revenue share given only as ` +
        `more than ${pct(F.concentration_disclosure_threshold, { decimals: 0 })}; Steward moved to cash basis only ` +
        `after it stopped paying in full. Then ${usd(stewardChargesTotal())} of Steward charges in ` +
        `${fy(Y23)}–${String(Y24).slice(2)}.`,
    },
  ],
  paper: {
    title: 'Paper rent, literally.',
    body:
      `In ${Y23}, MPW recognized about ${usd(phpNoncashRevenue())} of revenue from Prospect, a tenant already on ` +
      'cash basis, paid in equity of Prospect’s own managed-care business, “in lieu of cash.”',
  },
  against: {
    title: 'Strongest fact against us',
    fact:
      `A Wachtell Lipton review, engaged by ${F.MPW_wachtell_review.engaged_by}, found no evidence of ` +
      `round-tripping. The first Steward shortfall MPW disclosed was ${showDate(F.MPW_steward_first_shortfall_date)} ` +
      `rent, after about ${usd(F.MPW_steward_payments_since_lease_start)} of rent and interest paid since ` +
      `${F.MPW_steward_lease_start_year}.`,
    response:
      'This narrows our claim; it doesn’t reverse it. GAAP-compliant timing choices can still overstate economic ' +
      'performance. The issue is when losses were recognized, not whether revenue was invented.',
  },
};

// ---------------------------------------------------------------- Chapter 7
export const ai = {
  headline: 'AI did the retrieval. We did the judgment.',
  columns: [
    {
      title: 'Helpful',
      bullets: [
        'Pulled all 12 10-Ks and the SEC XBRL data in minutes',
        'Full-text search across filings for “cash basis,” “straight-line,” concentration',
        'Built and checked the ratio workbook from one data file',
      ],
    },
    {
      title: 'Bottlenecks',
      bullets: [
        'SEC blocks automated requests without a User-Agent; our cloud tool was blocked, so we went through a browser',
        'XBRL misses company-specific tags (MPW’s straight-line receivable, tenant concentration) → back to footnotes',
        `Restated comparatives vs as-filed numbers; MPW’s 10-Ks gave no Steward revenue figure before ${fy(Y24)}`,
      ],
    },
    {
      title: 'Learned',
      bullets: [
        'AI is fastest at finding, weakest at defining (what counts as a “loan to a tenant”?)',
        'Every ratio needed a human definition decision',
        'Absence of disclosure is itself a data point',
      ],
    },
  ],
};

// ---------------------------------------------------------------- Close
export const close = {
  headline: 'Overstated in substance, not fabricated.',
  question: 'Questions?',
  pointer: 'Every input, ratio, definition and source is in the appendix.',
  button: 'Open the appendix (A)',
};

// ---------------------------------------------------------------- Appendix
const RATIO_FMT = {
  ROE: pct, 'Net margin': pct, 'Asset turnover': (v) => mult(v, { decimals: 3 }), Leverage: mult, 'CFO/NI': mult,
  Accruals: (v) => num(v, { plus: true }),
  'Revenue growth': (v) => pct(v, { plus: true }), 'CFO growth': (v) => pct(v, { plus: true }),
  'SL rec / revenue': pct, 'ACL / gross loans': pct, 'Largest tenant / revenue': pct, 'Debt / assets': pct,
};
const RATIO_NAMES = Object.keys(RATIO_FMT);
const POINT_IN_TIME = ['Accruals', 'SL rec / revenue', 'ACL / gross loans', 'Largest tenant / revenue', 'Debt / assets'];
const NULL_NOTE = {
  'SL rec / revenue': L.slRec,
  'Largest tenant / revenue': L.largest,
};

const SBRA_RATIO_NOTE =
  'SBRA net margin and asset turnover use total revenue, as in Chapter 3. On comparable (rental + interest) ' +
  `revenue*, net margin is ${arrow(FLOW.map((y) => pct(sbraComparableDupont(y).margin)))} and asset turnover ` +
  `${arrow(FLOW.map((y) => mult(sbraComparableDupont(y).turnover, { decimals: 3 })))} ` +
  `(${fy(FLOW[0])}–${String(FLOW[2]).slice(2)}). * Excludes resident fees and services, so the net income in the ` +
  'numerator still includes senior-housing operations that the revenue in the denominator leaves out.';

const cols = COS.flatMap((co) => YEARS.map((y) => ({ co, year: y })));
const cell = (text, tip = null) => ({ text, tip });

const supTable = (co, keys, fmt = num) => ({
  unit: '$M',
  head: ['', ...YEARS.map(fy)],
  rows: keys.map(([label, get]) => [cell(label), ...YEARS.map((y) => cell(fmt(get(y))))]),
});

const urls = {
  MPW: [
    'https://www.sec.gov/Archives/edgar/data/1287865/000156459022008100/mpw-10k_20211231.htm',
    'https://www.sec.gov/Archives/edgar/data/1287865/000095017023005575/mpw-20221231.htm',
    'https://www.sec.gov/Archives/edgar/data/1287865/000095017024023248/mpw-20231231.htm',
    'https://www.sec.gov/Archives/edgar/data/1287865/000095017025030989/mpw-20241231.htm',
  ],
  OHI: [
    'https://www.sec.gov/Archives/edgar/data/888491/000088849122000007/ohi-20211231x10k.htm',
    'https://www.sec.gov/Archives/edgar/data/888491/000088849123000006/ohi-20221231x10k.htm',
    'https://www.sec.gov/Archives/edgar/data/888491/000088849124000007/ohi-20231231x10k.htm',
    'https://www.sec.gov/Archives/edgar/data/888491/000088849125000006/ohi-20241231x10k.htm',
  ],
  SBRA: [
    'https://www.sec.gov/Archives/edgar/data/1492298/000149229822000014/sbra-20211231.htm',
    'https://www.sec.gov/Archives/edgar/data/1492298/000149229823000006/sbra-20221231.htm',
    'https://www.sec.gov/Archives/edgar/data/1492298/000149229824000008/sbra-20231231.htm',
    'https://www.sec.gov/Archives/edgar/data/1492298/000149229825000008/sbra-20241231.htm',
  ],
};

export const appendix = {
  title: 'Appendix',
  hint: 'A toggles · Esc closes',
  closeLabel: 'Close',
  panels: [
    {
      id: 'timeline', title: 'Timeline',
      list: F.timeline.map((e) => `${e.date} · ${e.text}`),
    },
    {
      id: 'inputs', title: 'Inputs: template line items',
      table: {
        unit: '$M',
        head: ['', ...cols.map((c) => `${c.co} ${fy(c.year)}`)],
        rows: Object.values(L).map((item) => [
          cell(item),
          ...cols.map((c) => cell(num(d(c.co, item, c.year)), note(c.co, item))),
        ]),
      },
    },
    {
      id: 'ratios', title: 'Ratios',
      note: SBRA_RATIO_NOTE,
      table: {
        unit: `Flow ratios ${fy(Y22)}–${fy(Y24)} on average balances; ${fy(Y21)} point-in-time ratios only. Accruals in $M.`,
        head: ['', ...cols.map((c) => `${c.co} ${fy(c.year)}`)],
        rows: RATIO_NAMES.map((name) => [
          cell(name),
          ...cols.map((c) => {
            if (c.year === Y21 && !POINT_IN_TIME.includes(name)) return cell('–', 'Needs a prior-year balance or flow.');
            const v = r(c.co, name, c.year);
            return cell(RATIO_FMT[name](v), v == null ? note(c.co, NULL_NOTE[name]) : null);
          }),
        ]),
      },
    },
    {
      id: 'definitions', title: 'Definitions and choices',
      list: [
        'Equity: total equity including noncontrolling interests.',
        'Debt: carrying value (net), sum of all borrowings.',
        `SBRA comparable revenue: rental + interest, excluding resident fees (${arrow(YEARS.map((y) => usd(sbraComparableRevenue(y))))}).`,
        'MPW “loans to tenants”: mortgage loans + other loans + loan-type investments in unconsolidated operating entities.',
        `MPW’s allowance also covers financing leases. Supplementary ratio on loans + financing leases: ${arrow(YEARS.map((y) => pct(mpwAltAcl(y))))}.`,
        'OHI largest-tenant revenue: implied from the disclosed percentage.',
      ],
    },
    {
      id: 'mpw-revenue', title: `MPW revenue decomposition ${fy(Y21)}–${String(Y24).slice(2)}`,
      table: supTable('MPW', [
        ['Rent billed', (y) => s('MPW', 'Rent billed', y)],
        ['Straight-line rent', (y) => s('MPW', 'Straight-line rent revenue', y)],
        ['Income from financing leases', (y) => s('MPW', 'Income from financing leases', y)],
        ['Interest and other income', (y) => s('MPW', 'Interest and other income', y)],
        ['Total revenue', (y) => d('MPW', L.revenue, y)],
      ]),
      note: note('MPW', L.revenue),
    },
    {
      id: 'mpw-exposure', title: 'MPW balance-sheet exposure to operators',
      table: supTable('MPW', [
        ['Straight-line rent receivable', (y) => d('MPW', L.slRec, y)],
        ['Interest and rent receivables (billed, unpaid)', (y) => s('MPW', 'Interest and rent receivables (billed, unpaid)', y)],
        ['Loans to tenants', (y) => d('MPW', L.loans, y)],
        ['Investment in financing leases', (y) => s('MPW', 'Investment in financing leases', y)],
        ['Investments in unconsolidated operating entities', (y) => s('MPW', 'Investments in unconsolidated operating entities', y)],
      ]),
      note:
        `Billed receivables, all tenants, tripled in ${fy(Y22)}: ` +
        arrow([Y21, Y22].map((y) => usd(s('MPW', 'Interest and rent receivables (billed, unpaid)', y)))) +
        '. The balance is not broken out by tenant, so it says nothing about Steward alone.',
    },
    {
      id: 'mpw-loans', title: 'MPW operating cash flow and loans advanced',
      table: supTable('MPW', [
        ['Cash flow from operations (CFO)', (y) => d('MPW', L.cfo, y)],
        ['Investment in loans receivable', (y) => s('MPW', 'Investment in loans receivable (CFS)', y)],
        ['Principal received on loans receivable', (y) => s('MPW', 'Principal received on loans receivable (CFS)', y)],
        ['CFO less investment in loans receivable', (y) => mpwCfoLessLoans(y)],
      ]),
      note:
        'Loans are to all borrowers, not only rent-paying tenants, and not every loan funded rent, so the last row ' +
        'is a floor on cash earnings, not an estimate. Principal received is left out: it swings with one-off ' +
        `repayments (${usd(s('MPW', 'Principal received on loans receivable (CFS)', Y21))} in ${fy(Y21)}).`,
    },
    {
      id: 'steward', title: 'Steward charges',
      groups: [F.MPW_steward_charges_2023, F.MPW_steward_charges_2024].map((o, k) => ({
        title: fy([Y23, Y24][k]),
        rows: [...chargeItems(o).map((it) => [it.label, it.text]), ['Total', usd(o.total)]],
      })),
    },
    {
      id: 'ohi-cash', title: 'OHI cash-basis history',
      table: {
        unit: 'Write-offs in $M',
        head: ['', ...YEARS.map(fy)],
        rows: [
          [cell('Operators moved to cash basis'), ...YEARS.map((y) => cell(count(F.OHI_operators_moved_to_cash_basis[y])))],
          [cell('Operators on cash basis at year-end'), ...YEARS.map((y) => cell(count(s('OHI', 'Operators on cash basis (count)', y))))],
          [cell('Cash-basis operators’ share of revenue'), ...YEARS.map((y) => cell(pct(s('OHI', "Cash-basis operators' share of revenue", y))))],
          [cell('Straight-line / receivable write-offs'), ...YEARS.map((y) => cell(num(d('OHI', L.writeoffs, y)), note('OHI', L.writeoffs)))],
        ],
      },
    },
    {
      id: 'sabra', title: 'SBRA adjustments',
      list: [
        `Resident fees and services: ${arrow(YEARS.map((y) => usd(s('SBRA', 'Resident fees and services', y))))} (excluded from comparable revenue).`,
        `Avamere write-off ${fy(Y21)}: ${usd(F.SBRA_avamere_writeoff_2021.straight_line, { decimals: 1 })} ` +
          `(${usd(F.SBRA_avamere_writeoff_2021.total_incl_intangible, { decimals: 1 })} incl. above-market intangible).`,
        `North American write-off ${fy(Y22)}: ${usd(F.SBRA_north_american_writeoff_2022.straight_line, { decimals: 1 })} ` +
          `(${usd(F.SBRA_north_american_writeoff_2022.total, { decimals: 1 })} total).`,
        `Enlivant JV impairments: ${usd(F.SBRA_enlivant_jv_impairment[Y21], { decimals: 1 })} (${fy(Y21)}) and ` +
          `${usd(F.SBRA_enlivant_jv_impairment[Y22], { decimals: 1 })} (${fy(Y22)}), inside the loss from unconsolidated JVs ` +
          `(${arrow([Y21, Y22].map((y) => usd(d('SBRA', L.jv, y), { decimals: 1 })))}).`,
      ],
    },
    {
      id: 'sources', title: 'Sources',
      links: COS.flatMap((co) => urls[co].map((url, k) => ({ label: `${co} ${fy(YEARS[k])} Form 10-K`, url }))),
      list: [
        `Viceroy Research, “Medical Properties (dis)Trust,” ${showDate(F.MPW_viceroy_report_date)}.`,
        'MPW press release, “Medical Properties Trust Releases Findings of Independent Investigation Into ' +
          `Short-seller Allegations,” ${showDate(F.MPW_wachtell_review.released)}.`,
      ],
    },
  ],
};

export const chapters = { hero, issue, landlords, performance, accruals, warnings, verdict, ai, close, appendix };
export const meta = { footer, badges, rail, json: J };

export const chrome = {
  railLabel: 'Chapters',
  timerLabel: 'Countdown',
  appendixLabel: 'Appendix',
  positionLabel: 'Position',
  timerSeconds: 5 * 60,
};
