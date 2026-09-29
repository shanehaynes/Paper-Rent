// All copy for the site. No financial figure is typed here: every number is read from
// paper_rent_data.json (via derive.js) and formatted by format.js.

import {
  J, F, L, YEARS, COS, d, s, r, note,
  sbraComparableRevenue, sbraComparableDupont, growth, dupont, accrualsExGain, mpwCfoLessLoans,
  mpwSlRecOnRevenueBeforeReserves,
  stewardChargesTotal, phpNoncashRevenue, mpwAltAcl, ohiParentEquityGap,
  revenueMix, niAttributable, ohiAclTotal,
} from './derive.js';
import { usd, pct, pctRange, mult, multRange, num, count, arrow, showDate, ND } from './format.js';

const [Y21, Y22, Y23, Y24] = YEARS;
const PRE = [Y21, Y22, Y23];
const FLOW = [Y22, Y23, Y24];
const fy = (y) => `FY${y}`;
const P = F.profiles_FY2024;
const TEN = pct(F.concentration_disclosure_threshold, { decimals: 0 });

export const NAMES = {
  MPW: 'Medical Properties Trust',
  OHI: 'Omega Healthcare Investors',
  SBRA: 'Sabra Health Care REIT',
};

export const GROUP = 'Sliver 1A';
export const PEOPLE = ['Annie Wang', 'Rachel Rosenberg', 'Shane Haynes'];

export const footer =
  `Source: company Form 10-K filings ${fy(Y21)}–${fy(Y24)} (SEC EDGAR). GAAP figures only; FFO/AFFO excluded.`;

export const authors = `${GROUP} · ${PEOPLE.join(' · ')}`;

export const badges = {
  pre: `Pre-event window ${fy(Y21)}–${fy(Y23)}: filed before Steward’s May ${Y24} bankruptcy`,
  outcome: `Outcome window ${fy(Y24)}`,
  both: `Pre-event window: ${fy(Y21)}–${fy(Y23)} · Outcome window: ${fy(Y24)}`,
};

// One entry per main slide (chapter). The title card is part of slide 1.
export const rail = [
  'The issue', 'Business models', 'Performance', 'Earnings vs. cash',
  'Pre-event risk', 'Verdict', 'AI use',
];

const ratioSeries = (co, name, years) => years.map((y) => r(co, name, y));
const pctSeries = (co, name, years) => arrow(ratioSeries(co, name, years).map((v) => pct(v)));
const roeSeries = (co) => arrow(FLOW.map((y) => pct(r(co, 'ROE', y))));
const GAIN = 'Gain on sale of real estate';

// ---------------------------------------------------------------- Slide 1 · title card
export const hero = {
  eyebrow: `MGT 402 · Peer Case 1 · ${GROUP}`,
  title: 'Paper Rent',
  subtitle:
    'How well did Medical Properties Trust’s reported rent and earnings reflect its tenants’ ability to pay?',
  people: PEOPLE.join(' · '),
  buildings: COS.map((co) => ({ co, name: NAMES[co] })),
  tokenLabels: { out: 'loan', back: 'rent', tenant: 'Tenant' },
  artTitle: 'Three healthcare REITs',
  artDesc: 'Outlined buildings for MPW, OHI and SBRA. A dollar token leaves MPW for its tenant as a loan and returns as rent.',
  cue: 'Scroll ↓ or press →',
  caption:
    `The allegation (Viceroy Research, ${showDate(F.MPW_viceroy_report_date)}): MPW lends to its tenants, ` +
    'and the money comes back as rent.',
};

// ---------------------------------------------------------------- Slide 1 · the issue
export const issue = {
  headline: 'How well did reported rent and earnings reflect tenants’ ability to pay?',
  body:
    'Accrual accounting records rent when it is earned, not when it is paid, so revenue ahead of cash can be ' +
    'normal. The case question is whether MPW’s tenants could pay what it recognized, and whether lending to ' +
    'those same tenants made its earnings look stronger than its economics.',
  allegation:
    `On ${showDate(F.MPW_viceroy_report_date)}, short-seller Viceroy Research alleged that MPW was lending ` +
    'tenants the money to pay its rent.',
  statements: [
    { title: 'Income statement', lines: ['Rent revenue, incl. straight-line rent', 'Credit-loss provisions', 'Impairments'] },
    { title: 'Balance sheet', lines: ['Straight-line rent receivable', 'Loans and investments in tenants', 'Allowance for credit losses'] },
    { title: 'Cash flow statement', lines: ['Net income → CFO reconciliation', 'Straight-line rent deducted as non-cash revenue', 'Loans to tenants: investing'] },
    { title: 'Footnotes', lines: ['Collectability and cash-basis moves', 'Tenant concentration', 'Exposure to tenants'] },
  ],
  explainer: {
    title: 'Straight-line rent',
    labels: {
      cash: 'Contractual cash rent', revenue: 'Straight-line revenue', receivable: 'Receivable', year: 'Yr',
      tag: 'Illustrative lease',
    },
    desc: 'Illustrative lease. Cash rent rises in annual steps while straight-line revenue is flat and starts above cash; the gap accumulates as a receivable.',
    caption:
      'With annual escalators, early rent revenue exceeds the cash due, and the gap builds a receivable. ' +
      'It is not an overdue bill, but it is collected only if the tenant lasts.',
  },
};

// ---------------------------------------------------------------- Slide 2 · business models
const mixFor = (co) =>
  revenueMix(co, Y24).map((p) => ({ label: p.label, value: p.value, share: p.share, text: pct(p.share) }));

export const landlords = {
  headline: 'Same industry, very different bets.',
  columns: [
    {
      co: 'MPW', name: NAMES.MPW,
      big: count(P.MPW.properties), bigLabel: 'properties',
      sub: `${count(P.MPW.tenants)} tenants, as of ${showDate(F.MPW_portfolio_date)}`,
      mix: `Hospitals: ${P.MPW.mix}`,
      largest:
        `Largest tenant, ${fy(Y22)} revenue: Steward ${pct(F.MPW_steward_revenue_share_2022)} ` +
        `(first disclosed in the ${F.MPW_steward_share_first_disclosed_in})`,
      largestEmph: `Steward ${pct(F.MPW_steward_revenue_share_2022)}`,
      largestLater: `Largest tenants, ${fy(Y24)} revenue: ${P.MPW.largest}`,
      was:
        `Also lends to and invests in its operators. Steward was also ` +
        `${pct(F.MPW_steward_share_of_assets[Y22])} of total assets at ${fy(Y22)} year-end.`,
      wasEmph: `${pct(F.MPW_steward_share_of_assets[Y22])} of total assets`,
    },
    {
      co: 'OHI', name: NAMES.OHI,
      big: count(P.OHI.facilities), bigLabel: 'facilities',
      sub: `${count(P.OHI.operators)} operators`,
      mix: `Mostly nursing homes: ${P.OHI.mix}`,
      largest:
        `Largest operator: ${F.OHI_largest_operator[Y22].name} ${pct(r('OHI', 'Largest tenant / revenue', Y22))} ` +
        `of ${fy(Y22)} revenue (excluding write-offs)`,
      largestLater: `Largest operator: ${P.OHI.largest} of ${fy(Y24)} revenue`,
      was: 'Leases and mortgage loans to many operators; loans are a larger share of its assets than at SBRA.',
    },
    {
      co: 'SBRA', name: NAMES.SBRA,
      big: count(P.SBRA.properties), bigLabel: 'properties',
      sub: `${count(P.SBRA.loans)} loans · ${count(P.SBRA.preferred_equity)} preferred equity investments`,
      mix: P.SBRA.mix,
      largest: `Largest tenant: ${P.SBRA.largest} in any year`,
      was: 'Landlord and, through managers, operator of senior housing: it books residents’ fees as revenue.',
    },
  ],
  mixTitle: `${fy(Y24)} revenue mix`,
  mix: { MPW: mixFor('MPW'), OHI: mixFor('OHI'), SBRA: mixFor('SBRA') },
  callout:
    `${pct(F.SBRA_resident_fee_share_2024)} of SBRA’s ${fy(Y24)} revenue is resident fees from senior housing it ` +
    'operates, with operating costs to match, so its revenue is not all rent. We use total revenue as the case ' +
    'asks and flag the difference wherever a ratio depends on it.',
  mixNote:
    'Only MPW reports straight-line rent as its own revenue line. OHI’s sits inside rental income ' +
    `(${usd(Math.abs(d('OHI', L.slAdj, Y24)))} of non-cash straight-line rent and effective interest in ${fy(Y24)}, ` +
    'per its cash flow statement); SBRA’s sits inside rental revenue.',
  takeaway:
    'MPW: few, large hospital operators, also financed by MPW. OHI: many nursing-home operators. ' +
    'SBRA: diversified, part landlord, part operator.',
};

// ---------------------------------------------------------------- Slide 3 · performance
const sbraDebtAssets = FLOW.map((y) => r('SBRA', 'Debt / assets', y));

export const performance = {
  headline: 'OHI performed best: profitable every year, with cash flow above earnings.',
  formula: 'Return on equity (ROE) = net income ÷ average total equity',
  years: FLOW,
  grid: COS.map((co) => ({
    co,
    cells: FLOW.map((y) => ({
      year: y,
      roe: r(co, 'ROE', y), ni: d(co, L.ni, y), cfo: d(co, L.cfo, y),
      text: { roe: pct(r(co, 'ROE', y)), ni: usd(d(co, L.ni, y)), cfo: usd(d(co, L.cfo, y)) },
    })),
  })),
  labels: { ni: 'Net income', cfo: 'CFO' },
  points: [
    `OHI: ROE ${roeSeries('OHI')}, CFO above net income every year. ${fy(Y22)} earnings include a ` +
      `${usd(s('OHI', 'Gain on assets sold', Y22), { decimals: 1 })} gain on assets sold, so not all of it is rent.`,
    `MPW: ROE ${roeSeries('MPW')} as Steward unwinds; CFO falls every year ` +
      `(${arrow([usd(d('MPW', L.cfo, Y21)), usd(d('MPW', L.cfo, Y24))])}).`,
    `SBRA: losses in ${fy(Y21)}–${String(Y22).slice(2)} come mostly from joint-venture impairments; profitable ` +
      `since ${fy(Y23)}. Lowest leverage of the three, though debt ÷ assets rose (${arrow(sbraDebtAssets.map((v) => pct(v)))}).`,
  ],
  verdict: 'OHI > SBRA > MPW',
  footnote:
    'Consolidated net income and total equity, both including noncontrolling interests; average of opening and ' +
    'closing equity. SBRA’s revenue includes resident fees. The full margin × turnover × leverage breakdown is in the appendix.',
};

// ---------------------------------------------------------------- Slide 4 · earnings vs. cash
const ACC_YEARS = YEARS;
const proceeds22 = s('MPW', 'Net proceeds from sale of real estate (CFS)', Y22);

export const accruals = {
  headline: `In ${fy(Y22)}, MPW’s net income beat its cash flow, mostly because of a property-sale gain.`,
  sub:
    'Total accruals = net income − cash flow from operations (CFO). For a landlord they are normally negative: ' +
    'depreciation lowers net income but uses no cash. Large negatives can also mean impairments and reserves, ' +
    'so they are not a sign of strength.',
  barsTitle: 'Total accruals (net income − CFO)',
  bars: COS.map((co) => ({
    co,
    values: ACC_YEARS.map((y) => {
      const v = r(co, 'Accruals', y);
      return { year: y, value: v, text: usd(v, { decimals: 1, plus: true }) };
    }),
  })),
  exGain: {
    co: 'MPW', year: Y22, value: accrualsExGain(Y22),
    text: `${usd(accrualsExGain(Y22), { decimals: 1, plus: true })} ex-gain*`,
  },
  // MPW FY2023–24: the part of each bar that is Steward charges (all non-cash) vs. the rest.
  split: [Y23, Y24].map((y) => {
    const steward = F[`MPW_steward_charges_${y}`].total;
    return { co: 'MPW', year: y, steward: -steward, text: usd(steward) };
  }),
  barNotes: {
    normal: 'Below zero is normal',
    glow:
      `MPW ${fy(Y22)}: ${usd(r('MPW', 'Accruals', Y22), { decimals: 1, plus: true })}, because net income included a ` +
      `${usd(s('MPW', GAIN, Y22), { decimals: 1 })} gain on property sales`,
    loss: ['Solid: Steward charges (non-cash)', 'Faded: depreciation & other'],
    exGain: '* Analytical, not GAAP: accruals as if the gain were excluded.',
  },
  gainNote:
    'A sale gain raises net income but brings in no operating cash: the CFO reconciliation deducts it, and the ' +
    `${usd(proceeds22)} of sale proceeds is investing cash flow.`,
  lines: {
    title: `MPW: net income vs. CFO, ${fy(Y21)}–${String(Y23).slice(2)}`,
    ni: PRE.map((y) => ({ year: y, value: d('MPW', L.ni, y), text: usd(d('MPW', L.ni, y)) })),
    cfo: PRE.map((y) => ({ year: y, value: d('MPW', L.cfo, y), text: usd(d('MPW', L.cfo, y)) })),
    labels: { ni: 'Net income', cfo: 'CFO' },
    callout:
      `In ${fy(Y22)}, net income rose ${pct(growth('MPW', L.ni, Y22))} ` +
      `while CFO fell ${pct(Math.abs(r('MPW', 'CFO growth', Y22)))}.`,
  },
  chipsTitle: `How net income becomes CFO · MPW ${fy(Y22)}`,
  chips: [
    `Gain on property sales ${usd(s('MPW', GAIN, Y22), { decimals: 1 })}: deducted`,
    `“Straight-line rent revenue and other” ${usd(Math.abs(d('MPW', L.slAdj, Y22)), { decimals: 1 })}: non-cash revenue, deducted`,
    `Impairments ${usd(d('MPW', L.impair, Y22), { decimals: 1 })}: non-cash expense, added back`,
  ],
  anomalies:
    `Off-pattern years: MPW ${fy(Y22)} (positive, sale gain). MPW ${fy(Y23)}–${String(Y24).slice(2)} and SBRA ` +
    `${fy(Y21)}–${String(Y22).slice(2)} (large negatives from reserves, write-offs and impairments). SBRA’s CFO held at ` +
    `${arrow([Y21, Y22].map((y) => usd(d('SBRA', L.cfo, y))))}; MPW’s cash fell too.`,
  limit: {
    title: 'What CFO cannot show',
    body:
      'Making and collecting loans are investing activities (Class 7). If a tenant pays rent with money its ' +
      'landlord lent it, the rent lands in CFO and the loan in investing, so CFO alone cannot show self-financed rent.',
    test:
      `Illustrative sensitivity, not GAAP CFO: CFO less all loans advanced was ` +
      `${arrow(PRE.map((y) => usd(mpwCfoLessLoans(y))))} (reported ${arrow(PRE.map((y) => usd(d('MPW', L.cfo, y))))}). ` +
      'Loans went to all borrowers, and not every advance funded rent.',
  },
};

// ---------------------------------------------------------------- Slide 5 · pre-event risk
const spark = (co, values, fmt = pct, years = PRE) => ({
  co,
  values: values.map((v, k) => ({ year: years[k], value: v, text: fmt(v) })),
  latest: fmt(values[values.length - 1]),
});
const stewardAssets = PRE.map((y) => F.MPW_steward_share_of_assets[y]);
const aclUsd = (v) => usd(v, { decimals: 1 });
const OP = F.OHI_largest_operator;

export const warnings = {
  headline: 'Before Steward failed, MPW’s filings showed concentrated tenant credit risk.',
  tiles: [
    {
      title: 'Straight-line rent receivable ÷ total revenue',
      series: COS.map((co) => spark(co, ratioSeries(co, 'SL rec / revenue', PRE))),
      summary:
        `Reported GAAP: MPW ${pctSeries('MPW', 'SL rec / revenue', PRE)}; OHI ` +
        `${pctSeries('OHI', 'SL rec / revenue', PRE)}; SBRA not separately disclosed`,
      caption:
        'A balance built over years of leases, not unpaid rent. MPW’s is far larger relative to its revenue; its ' +
        `${fy(Y23)} jump is partly a smaller denominator (${usd(F.MPW_2023_revenue_reserves)} of reserves cut revenue).`,
      footnote: 'Lease length, escalators, acquisitions and sales all move this ratio.',
      nd: { SBRA: note('SBRA', L.slRec) },
      ndText: { SBRA: 'not disclosed' },
    },
    {
      title: 'Allowance for credit losses (level, $M)',
      series: COS.map((co) => spark(co, PRE.map((y) => d(co, L.acl, y)), aclUsd)),
      summary:
        `As a share of the exposure each allowance covers: OHI ${pctSeries('OHI', 'ACL / gross loans', PRE)} ` +
        `of loans; SBRA ${pctSeries('SBRA', 'ACL / gross loans', PRE)} of loans; MPW ` +
        `${pctSeries('MPW', 'ACL / gross loans', PRE)} of loans and financing leases combined`,
      caption:
        `MPW’s allowance more than doubled in ${fy(Y22)}, the year it lent Steward a further ` +
        `${usd(F.MPW_new_steward_loan_2022Q2)}, then fell in ${fy(Y23)} as reserves left with loans repaid or sold.`,
      footnote:
        'Not like for like: MPW reports one reserve for loans and financing leases, and hospital, nursing-home ' +
        'and senior-housing borrowers differ. Lower coverage alone does not prove under-reserving.',
    },
    {
      title: 'Tenant concentration: two different measures',
      groups: [
        {
          label: 'Largest tenant ÷ total revenue (as disclosed)',
          series: [
            spark('MPW', PRE.map(() => null)),
            spark('OHI', ratioSeries('OHI', 'Largest tenant / revenue', PRE)),
            spark('SBRA', PRE.map(() => null)),
          ],
          nd: { MPW: note('MPW', L.largest), SBRA: note('SBRA', L.largest) },
          ndText: { MPW: `>${TEN}`, SBRA: `<${TEN}` },
        },
        {
          label: `Steward ÷ MPW total assets · ${arrow(stewardAssets.map((v) => pct(v)))}`,
          series: [spark('MPW', stewardAssets)],
          pulse: 'MPW',
        },
      ],
      summary:
        `Revenue: MPW said only that Steward was above ${TEN} each year. OHI: ` +
        `${PRE.map((y) => `${OP[y].name} ${pct(r('OHI', 'Largest tenant / revenue', y))}`).join(' → ')} ` +
        `(excluding write-offs). SBRA: no tenant at or above ${TEN}.`,
      caption:
        'Revenue share: how much of the rent one tenant pays. Asset share: how much of the balance sheet it ' +
        'occupies. Before the bankruptcy, MPW gave an exact figure only for assets.',
    },
    {
      title: 'Total debt ÷ total assets',
      series: COS.map((co) => spark(co, ratioSeries(co, 'Debt / assets', PRE))),
      summary:
        `MPW ${pctSeries('MPW', 'Debt / assets', PRE)}, OHI ${pctSeries('OHI', 'Debt / assets', PRE)}, ` +
        `SBRA ${pctSeries('SBRA', 'Debt / assets', PRE)}`,
      caption: 'MPW’s leverage looked like OHI’s: leverage alone did not single MPW out.',
      footnote: 'Debt = carrying value of all borrowings.',
    },
  ],
  timeline: {
    title: 'How each recognized that tenants would not pay',
    lanes: { above: 'OHI', below: 'MPW' },
    bands: PRE.map((y, k) => ({
      co: 'OHI', year: y,
      text:
        k === 0 ? `${count(F.OHI_operators_moved_to_cash_basis[y])} operators moved to cash basis`
        : k === 1 ? `${count(F.OHI_operators_moved_to_cash_basis[y])} more ` +
          `(${pct(s('OHI', "Cash-basis operators' share of revenue", y))} of revenue)`
        : `${count(F.OHI_operators_moved_to_cash_basis[y])} more`,
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
    note:
      `OHI recognized non-payment early and often: ${arrow(PRE.map((y) => usd(d('OHI', L.writeoffs, y), { decimals: 1 })))} ` +
      `of straight-line and receivable write-offs. MPW booked ${usd(F.MPW_credit_loss_provision[Y22], { decimals: 1 })} ` +
      `of credit-loss provisions in ${fy(Y22)}; its large Steward write-downs came at ${fy(Y23)} year-end.`,
  },
};

// ---------------------------------------------------------------- Slide 6 · verdict and FY2024 check
const chargeItems = (o) =>
  Object.entries(o).filter(([k]) => k !== 'total').map(([label, v]) => ({ label, value: v, text: usd(v) }));

export const verdict = {
  headline: 'MPW’s earnings looked stronger than its cash and tenant credit justified.',
  position:
    'We agree with the substance of Viceroy’s critique. MPW’s reported earnings presented a stronger picture than ' +
    'its recurring cash generation and tenant credit exposure justified. The evidence supports concern about ' +
    'economic performance; it does not establish fabricated rent or a GAAP violation.',
  signals: [
    {
      kicker: 'Signal 1 · Straight-line receivable ÷ revenue',
      title: 'Much of the rent was not yet cash.',
      body:
        `MPW ${pctRange(ratioSeries('MPW', 'SL rec / revenue', PRE))} vs OHI ` +
        `${pctRange(ratioSeries('OHI', 'SL rec / revenue', PRE))}: more of MPW’s recognized rent depended on ` +
        'tenants paying for years to come.',
      limit: 'Limit: an accumulated balance, not overdue rent; lease terms differ.',
    },
    {
      kicker: 'Signal 2 · Largest tenant ÷ revenue',
      title: 'One fragile tenant, financed by MPW.',
      body:
        `Steward was more than ${TEN} of revenue and ${pctRange(stewardAssets)} of assets, and MPW lent it ` +
        `a further ${usd(F.MPW_new_steward_loan_2022Q2)} in ${Y22}. OHI’s largest operator was near ${TEN}; SBRA had none that large.`,
      limit: 'Limit: MPW gave only a threshold, not the exact revenue share.',
    },
  ],
  support:
    `Supporting, not independent: in ${fy(Y22)} net income rose ${pct(growth('MPW', L.ni, Y22))} ` +
    `while CFO fell, mostly a sale gain. In ${fy(Y23)}, ${usd(phpNoncashRevenue())} of revenue arrived as Prospect ` +
    'securities “in lieu of cash.”',
  against: {
    title: 'Strongest fact against us',
    fact:
      `A Wachtell Lipton review, engaged by ${F.MPW_wachtell_review.engaged_by}, found no evidence of ` +
      'round-tripping or fraudulent revenue recognition.',
    more: [
      `MPW moved Steward to cash basis on ${showDate(F.MPW_steward_cash_basis_date)}, after the first shortfall ` +
        `(${showDate(F.MPW_steward_first_shortfall_date)}) and before the bankruptcy.`,
      `The positive ${fy(Y22)} accrual came from a sale gain, not from rent.`,
    ],
    response:
      'This rules out the fraud version of the critique, not the credit risk. Our signals concern whether tenants ' +
      'could pay, not whether revenue was invented, so our position stands in narrower form.',
  },
  check: {
    title: `${fy(Y24)} outcome check`,
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
        sub: `after ${usd(F.MPW_credit_loss_provision[Y24])} of provisions and ${usd(F.MPW_allowance_writeoffs_2024)} written off`,
      },
      {
        label: `Steward’s ${fy(Y22)} revenue share`,
        value: pct(F.MPW_steward_revenue_share_2022),
        sub: `first disclosed in the ${F.MPW_steward_share_first_disclosed_in}, after the bankruptcy`,
      },
    ],
    closing:
      'The outcome matches the pre-event risk. It does not show that GAAP required these losses earlier: ' +
      'estimates change as new information arrives.',
  },
};

// ---------------------------------------------------------------- Slide 7 · AI use
// Group to confirm: each bullet must describe what the group actually did.
export const ai = {
  headline: 'AI sped up retrieval. Definitions still needed our judgment.',
  columns: [
    {
      title: 'Helpful',
      bullets: [
        'Pulled statement lines and footnotes from 12 10-Ks and the SEC’s XBRL data',
        'Searched filings for “cash basis,” “straight-line” and tenant concentration',
        'Kept every figure in one data file; a script checks each number on these slides against it',
      ],
    },
    {
      title: 'Bottlenecks',
      bullets: [
        'SEC blocks automated requests that lack a contact User-Agent',
        'XBRL lacks the key footnotes (allowance by instrument, tenant concentration): back to the filings',
        `Definitions change: OHI’s tenant share excluded write-offs through ${fy(Y23)}, included them in ${fy(Y24)}`,
      ],
    },
    {
      title: 'Learned',
      bullets: [
        'A first pass mixed scopes (common-shareholder income over total equity) and exposures (one allowance over two asset types); review caught both',
        'Every ratio needed a human definition decision',
        'Absence of disclosure is itself a data point',
      ],
    },
  ],
  question: 'Questions?',
  pointer: 'Every input, ratio, definition and source is in the appendix.',
  button: 'Open the appendix (A)',
};

// ---------------------------------------------------------------- Appendix (10 slides)
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
const RATIO_TIP = {
  'MPW|2022|Largest tenant / revenue':
    `Steward’s ${fy(Y22)} share, first disclosed in the ${F.MPW_steward_share_first_disclosed_in} (after the bankruptcy). ` +
    `The ${fy(Y22)} 10-K said only “more than ${TEN}”.`,
  'MPW|ACL / gross loans': 'Combined exposure: MPW’s one allowance over loans + financing leases (gross).',
  'OHI|Largest tenant / revenue': note('OHI', L.largest),
};

const cols = COS.flatMap((co) => YEARS.map((y) => ({ co, year: y })));
const cell = (text, tip = null) => ({ text, tip });
const coYearHead = ['', ...cols.map((c) => `${c.co} ${fy(c.year)}`)];

const supTable = (keys, { fmt = num, unit = '$M', title = null } = {}) => ({
  title,
  unit,
  head: ['', ...YEARS.map(fy)],
  rows: keys.map(([label, get, f = fmt]) => [cell(label), ...YEARS.map((y) => cell(f(get(y))))]),
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

const SBRA_RATIO_NOTE =
  'SBRA net margin and asset turnover use total revenue, as the case asks. On comparable (rental + interest) ' +
  `revenue*, net margin is ${arrow(FLOW.map((y) => pct(sbraComparableDupont(y).margin)))} and asset turnover ` +
  `${arrow(FLOW.map((y) => mult(sbraComparableDupont(y).turnover, { decimals: 3 })))} ` +
  `(${fy(FLOW[0])}–${String(FLOW[2]).slice(2)}). * Excludes resident fees and services, so the net income in the ` +
  'numerator still includes senior-housing operations that the revenue in the denominator leaves out.';

// Audit trail: formula, unit, source (filing, statement or note, printed page), timing.
const AUDIT = [
  ['Net income (consolidated)', 'CFS first line, incl. noncontrolling interests', '$M',
    'MPW FY2024 10-K CFS p.74 (FY2021: FY2023 10-K); OHI FY2024 10-K p.F-8; SBRA 10-K CFS', 'Filed each Feb–Mar'],
  ['CFO', '“Net cash provided by operating activities”', '$M', 'Same CFS pages', 'Filed each Feb–Mar'],
  ['Total accruals', 'Net income − CFO', '$M', 'Computed', 'All years'],
  ['ROE', 'Net income ÷ average total equity (incl. NCI)', '%', 'Balance sheets: MPW p.70, OHI p.F-4', 'FY2022–FY2024'],
  ['Net margin · asset turnover · leverage', 'NI ÷ revenue · revenue ÷ avg assets · avg assets ÷ avg equity', '% · × · ×',
    'Income statements: MPW p.71, OHI p.F-5', 'FY2022–FY2024'],
  ['Straight-line receivable ÷ revenue', 'Year-end “Straight-line rent receivables” ÷ “Total revenues”', '%',
    'MPW balance sheet p.70, income statement p.71; OHI rent receivable note', 'Pre-event FY2021–FY2023'],
  ['Allowance ÷ gross exposure', 'Allowance ÷ (net exposure + allowance); MPW: loans + financing leases', '%, $M',
    'MPW Note 2 “Credit Losses” p.85 (FY2023 10-K p.83); OHI Note 9 p.F-46; SBRA loans receivable note', 'Pre-event FY2021–FY2023'],
  ['Largest tenant ÷ revenue', 'As disclosed; MPW and SBRA give thresholds only', '%',
    'MPW FY2022 10-K p.85, FY2023 10-K p.96; OHI p.F-43 / F-51 / F-52; SBRA Item 1', 'Each 10-K for its own year'],
  ['Steward FY2022 revenue share', `Steward revenue ÷ total revenue`, '%', 'MPW FY2024 10-K concentration table p.100',
    'First disclosed after the bankruptcy'],
  ['Debt ÷ assets', 'Carrying value of all borrowings ÷ total assets', '%', 'Balance sheets', 'Pre-event FY2021–FY2023'],
  ['Sale gain, proceeds', '“(Gain) loss on sale of real estate”; “Net proceeds from sale of real estate”', '$M',
    'MPW FY2024 10-K CFS p.74', 'FY2022'],
  ['CFO less loans advanced', 'CFO − “Investment in loans receivable” (investing)', '$M', 'MPW CFS p.74', 'Illustrative sensitivity'],
];

export const appendix = {
  title: 'Appendix',
  hint: 'A toggles · Esc closes · ← → step',
  closeLabel: 'Close',
  panels: [
    {
      id: 'inputs', title: 'Inputs',
      table: {
        unit: '$M. Net income, equity and CFO are all consolidated (incl. noncontrolling interests).',
        head: coYearHead,
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
        head: coYearHead,
        rows: RATIO_NAMES.map((name) => [
          cell(name),
          ...cols.map((c) => {
            if (c.year === Y21 && !POINT_IN_TIME.includes(name)) return cell('–', 'Needs a prior-year balance or flow.');
            const v = r(c.co, name, c.year);
            const tip = RATIO_TIP[`${c.co}|${c.year}|${name}`] ?? RATIO_TIP[`${c.co}|${name}`] ??
              (v == null ? note(c.co, NULL_NOTE[name]) : null);
            return cell(RATIO_FMT[name](v), tip);
          }),
        ]),
      },
    },
    {
      id: 'performance', title: 'Performance detail',
      tables: [
        {
          title: 'ROE = net margin × asset turnover × leverage (DuPont)',
          unit: 'Consolidated scope. Leverage = average assets ÷ average equity.',
          head: ['', ...COS.flatMap((co) => FLOW.map((y) => `${co} ${fy(y)}`))],
          rows: [
            ['ROE', (co, y) => pct(dupont(co, y).roe)],
            ['Net margin', (co, y) => pct(dupont(co, y).margin)],
            ['Asset turnover', (co, y) => mult(dupont(co, y).turnover, { decimals: 3 })],
            ['Leverage', (co, y) => mult(dupont(co, y).leverage)],
          ].map(([label, f]) => [cell(label), ...COS.flatMap((co) => FLOW.map((y) => cell(f(co, y))))]),
        },
        {
          title: 'Net income: consolidated vs attributable to common stockholders',
          unit: '$M. The slides use consolidated net income so it matches total equity and CFO.',
          head: coYearHead,
          rows: [
            [cell('Consolidated (used)'), ...cols.map((c) => cell(num(d(c.co, L.ni, c.year))))],
            [cell('Attributable to common'), ...cols.map((c) => cell(num(niAttributable(c.co, c.year))))],
          ],
        },
        supTable([
          ['OHI gain on assets sold', (y) => s('OHI', 'Gain on assets sold', y)],
          ['MPW gain on sale of real estate', (y) => s('MPW', GAIN, y)],
          ['SBRA comparable revenue (rental + interest)', (y) => sbraComparableRevenue(y)],
        ], { title: 'Gains inside net income; SBRA revenue ex resident fees' }),
      ],
      note:
        `OHI parent-only equity is ~${pct(ohiParentEquityGap(Y23), { decimals: 0 })} below total equity; ` +
        'a common-shareholder ROE would pair attributable income with that equity. We do not mix the two.',
    },
    {
      id: 'cash', title: 'Earnings and cash detail',
      tables: [
        {
          title: 'Net income, CFO and total accruals',
          unit: '$M',
          head: coYearHead,
          rows: [
            [cell('Net income'), ...cols.map((c) => cell(num(d(c.co, L.ni, c.year))))],
            [cell('CFO'), ...cols.map((c) => cell(num(d(c.co, L.cfo, c.year))))],
            [cell('Total accruals'), ...cols.map((c) => cell(num(r(c.co, 'Accruals', c.year), { plus: true })))],
          ],
        },
        supTable([
          ['Cash flow from operations (CFO)', (y) => d('MPW', L.cfo, y)],
          ['Investment in loans receivable (investing)', (y) => s('MPW', 'Investment in loans receivable (CFS)', y)],
          ['Principal received on loans receivable (investing)', (y) => s('MPW', 'Principal received on loans receivable (CFS)', y)],
          ['CFO less loans advanced (illustrative)', (y) => mpwCfoLessLoans(y)],
          ['Net proceeds from sale of real estate (investing)', (y) => s('MPW', 'Net proceeds from sale of real estate (CFS)', y)],
        ], { title: 'MPW: operating cash, loans and sale proceeds' }),
      ],
      note:
        `MPW ${fy(Y22)} accruals excluding the ${usd(s('MPW', GAIN, Y22), { decimals: 1 })} gain: ` +
        `${usd(accrualsExGain(Y22), { decimals: 1, plus: true })}. Analytical only: GAAP net income includes the gain. ` +
        'CFO less loans advanced is an illustrative sensitivity, not GAAP CFO and not a floor: loans went to all ' +
        'borrowers, and principal received is left out because it swings with one-off repayments ' +
        `(${usd(s('MPW', 'Principal received on loans receivable (CFS)', Y21))} in ${fy(Y21)}).`,
    },
    {
      id: 'mpw', title: 'MPW revenue and exposure',
      tables: [
        supTable([
          ['Rent billed', (y) => s('MPW', 'Rent billed', y)],
          ['Straight-line rent', (y) => s('MPW', 'Straight-line rent revenue', y)],
          ['Income from financing leases', (y) => s('MPW', 'Income from financing leases', y)],
          ['Interest and other income', (y) => s('MPW', 'Interest and other income', y)],
          ['Total revenue', (y) => d('MPW', L.revenue, y)],
        ], { title: 'Revenue' }),
        supTable([
          ['Straight-line rent receivable', (y) => d('MPW', L.slRec, y)],
          ['Interest and rent receivables (billed, unpaid)', (y) => s('MPW', 'Interest and rent receivables (billed, unpaid)', y)],
          ['Loans to tenants', (y) => d('MPW', L.loans, y)],
          ['Investment in financing leases', (y) => s('MPW', 'Investment in financing leases', y)],
          ['Investments in unconsolidated operating entities', (y) => s('MPW', 'Investments in unconsolidated operating entities', y)],
        ], { title: 'Balance-sheet exposure to operators' }),
      ],
      note:
        `Sensitivity, not the reported ratio: adding back ${fy(Y23)} Steward straight-line reserves ` +
        `(${usd(F.MPW_steward_charges_2023['Reserve of straight-line rent receivables'])}) to the receivable and ` +
        `revenue reserves (${usd(F.MPW_2023_revenue_reserves)}) to revenue gives ` +
        `${pct(mpwSlRecOnRevenueBeforeReserves())} instead of the reported ` +
        `${pct(r('MPW', 'SL rec / revenue', Y23))}. The two add-backs are different amounts, so this is not a full ` +
        '“before reserves” reconstruction.',
    },
    {
      id: 'allowance', title: 'Allowance rollforwards',
      tables: [
        supTable([
          ['Allowance, year-end (loans + financing leases)', (y) => d('MPW', L.acl, y)],
          ['Provision for credit loss, net', (y) => s('MPW', 'Credit loss reserve: provision', y)],
          ['Written off or related to instruments sold, repaid or satisfied',
            (y) => s('MPW', 'Credit loss reserve: written off or related to instruments sold, repaid or satisfied', y)],
          ['Coverage of loans + financing leases (gross)', (y) => mpwAltAcl(y), pct],
        ], { title: 'MPW: one reserve for loans and financing leases' }),
        supTable([
          ['Real estate loans', (y) => s('OHI', 'Allowance: real estate loans', y)],
          ['Non-real estate loans', (y) => s('OHI', 'Allowance: non-real estate loans', y)],
          ['Loans subtotal (used)', (y) => d('OHI', L.acl, y)],
          ['Direct financing leases', (y) => s('OHI', 'Allowance: direct financing leases', y)],
          ['Unfunded loan commitments', (y) => s('OHI', 'Allowance: unfunded loan commitments', y)],
          ['Total, all instruments', (y) => ohiAclTotal(y)],
          ['Provision (recovery)', (y) => s('OHI', 'Allowance: provision (recovery)', y)],
          ['Write-offs', (y) => s('OHI', 'Allowance: write-offs', y)],
          ['Other additions', (y) => s('OHI', 'Allowance: other additions', y)],
        ], { title: 'OHI: allowance by instrument (provision, write-offs and additions are for the total)' }),
        supTable([
          ['Allowance for loan losses', (y) => d('SBRA', L.acl, y)],
          ['Provision (recovery)', (y) => s('SBRA', 'Allowance: provision (recovery)', y)],
          ['Write-offs', (y) => s('SBRA', 'Allowance: write-offs', y)],
        ], { title: 'SBRA: loans receivable' }),
      ],
      note:
        'An allowance estimates amounts not expected to be collected. Raising the estimate is a provision, an ' +
        'expense in the year. Writing off a loan already reserved uses the allowance and adds no new expense. ' +
        'Lease revenue reversals and impairments are separate: they follow each filing’s own treatment. ' +
        `${fy(Y21)} rollforward lines were not collected (n/d): the case uses the ${fy(Y22)}–${fy(Y24)} filings.`,
    },
    {
      id: 'concentration', title: 'Concentration disclosures',
      tables: [{
        title: 'What each 10-K said about its own year',
        unit: 'Share of total revenue unless stated',
        head: ['', ...YEARS.map(fy)],
        rows: [
          [cell('MPW: Steward, revenue'), ...YEARS.map((y) => cell(y < Y24 ? `>${TEN}` : 'bankrupt'))],
          [cell('MPW: Steward, total assets'), ...YEARS.map((y) => cell(y < Y24 ? pct(F.MPW_steward_share_of_assets[y]) : ND, y === Y21 ? F.MPW_asset_share_source : null))],
          [cell('MPW: largest tenant, revenue (FY2024 10-K)'), ...YEARS.map((y) => cell(y === Y22 ? pct(r('MPW', 'Largest tenant / revenue', y)) : y === Y24 ? pct(r('MPW', 'Largest tenant / revenue', y)) : ND,
            y === Y22 ? RATIO_TIP['MPW|2022|Largest tenant / revenue'] : null))],
          [cell('OHI: largest operator'), ...YEARS.map((y) => cell(`${OP[y].name} ${pct(r('OHI', 'Largest tenant / revenue', y))}`, `${OP[y].basis}; ${OP[y].filing}`))],
          [cell('OHI: basis'), ...YEARS.map((y) => cell(OP[y].basis))],
          [cell('SBRA: largest tenant'), ...YEARS.map(() => cell(`<${TEN}`, J.story_facts.sources.SBRA_no_tenant_10pct))],
        ],
      }],
      note:
        `OHI changed its definition, not its history: its ${fy(Y24)} 10-K gives CommuniCare ` +
        `${pct(F.OHI_communicare_2023_restated_basis)} of ${fy(Y23)} revenue including write-offs, against ` +
        `${pct(r('OHI', 'Largest tenant / revenue', Y23))} excluding them in the ${fy(Y23)} 10-K. SBRA’s total ` +
        'revenue includes resident fees, so a share of total revenue is not a share of rent.',
    },
    {
      id: 'recognition', title: 'Recognition history',
      groups: [F.MPW_steward_charges_2023, F.MPW_steward_charges_2024].map((o, k) => ({
        title: `MPW Steward charges ${fy([Y23, Y24][k])}`,
        rows: [...chargeItems(o).map((it) => [it.label, it.text]), ['Total', usd(o.total)]],
      })),
      tables: [{
        title: 'OHI cash-basis history',
        unit: 'Write-offs in $M',
        head: ['', ...YEARS.map(fy)],
        rows: [
          [cell('Operators moved to cash basis'), ...YEARS.map((y) => cell(count(F.OHI_operators_moved_to_cash_basis[y])))],
          [cell('Operators on cash basis at year-end'), ...YEARS.map((y) => cell(count(s('OHI', 'Operators on cash basis (count)', y))))],
          [cell('Cash-basis operators’ share of revenue'), ...YEARS.map((y) => cell(pct(s('OHI', "Cash-basis operators' share of revenue", y))))],
          [cell('Straight-line / receivable write-offs'), ...YEARS.map((y) => cell(num(d('OHI', L.writeoffs, y)), note('OHI', L.writeoffs)))],
        ],
      }],
      list: [
        `SBRA: Avamere write-off ${fy(Y21)} ${usd(F.SBRA_avamere_writeoff_2021.straight_line, { decimals: 1 })} ` +
          `(${usd(F.SBRA_avamere_writeoff_2021.total_incl_intangible, { decimals: 1 })} incl. above-market intangible); ` +
          `North American ${fy(Y22)} ${usd(F.SBRA_north_american_writeoff_2022.straight_line, { decimals: 1 })} ` +
          `(${usd(F.SBRA_north_american_writeoff_2022.total, { decimals: 1 })} total); Enlivant JV impairments ` +
          `${usd(F.SBRA_enlivant_jv_impairment[Y21], { decimals: 1 })} (${fy(Y21)}) and ` +
          `${usd(F.SBRA_enlivant_jv_impairment[Y22], { decimals: 1 })} (${fy(Y22)}).`,
        `MPW: Prospect to cash basis ${showDate(F.MPW_prospect_cash_basis_date)}; Steward to cash basis ` +
          `${showDate(F.MPW_steward_cash_basis_date)}, reserving all unpaid rent and interest.`,
      ],
    },
    {
      id: 'timeline', title: 'Timeline',
      list: F.timeline.map((e) => `${e.date} · ${e.text}`),
    },
    {
      id: 'audit', title: 'Audit trail and sources',
      tables: [{
        title: 'Calculation and source trail',
        unit: 'Pages are printed page numbers in the Form 10-K named.',
        head: ['Measure', 'Formula / line', 'Unit', 'Source', 'Timing'],
        rows: AUDIT.map((row) => row.map((t) => cell(t))),
        text: true,
      }],
      links: COS.flatMap((co) => urls[co].map((url, k) => ({ label: `${co} ${fy(YEARS[k])} Form 10-K`, url }))),
      list: [
        `Viceroy Research, “Medical Properties (dis)Trust,” ${showDate(F.MPW_viceroy_report_date)}.`,
        'MPW press release, “Medical Properties Trust Releases Findings of Independent Investigation Into ' +
          `Short-seller Allegations,” ${showDate(F.MPW_wachtell_review.released)}.`,
        'Debt: carrying value (net), sum of all borrowings. Loans to tenants: MPW mortgage + other loans + ' +
          'loan-type investments in unconsolidated operating entities; OHI real estate + non-real estate loans (net).',
      ],
    },
  ],
};

export const chapters = { hero, issue, landlords, performance, accruals, warnings, verdict, ai, appendix };
export const meta = { footer, badges, rail, json: J };

export const chrome = {
  railLabel: 'Chapters',
  timerLabel: 'Countdown',
  appendixLabel: 'Appendix',
  positionLabel: 'Position',
  timerSeconds: 5 * 60,
};
