// Prints every chapter's copy as plain text with all numbers resolved.
import * as c from '../src/content.js';

const out = [];
const p = (s = '', n = 0) => out.push(' '.repeat(n) + s);
const h = (s) => { p(); p('='.repeat(78)); p(s); p('='.repeat(78)); };

h('SLIDE 1 · THE ISSUE (title card + issue)');
p(c.hero.eyebrow); p(c.hero.title); p(c.hero.subtitle); p(c.hero.people);
p(`[visual] buildings: ${c.hero.buildings.map((b) => b.co).join(', ')}; token labels: ${c.hero.tokenLabels.out} / ${c.hero.tokenLabels.back}`);
p(`[title beat 2 caption] ${c.hero.caption}`);
p(); p(c.issue.headline); p(c.issue.body); p(c.issue.allegation); p();
for (const s of c.issue.statements) p(`${s.title}: ${s.lines.join('; ')}`, 2);
p(); p(`[explainer] ${Object.values(c.issue.explainer.labels).join(' / ')}`, 2);
p(c.issue.explainer.caption, 2);

h('SLIDE 2 · BUSINESS MODELS');
p(c.landlords.headline); p();
for (const col of c.landlords.columns) {
  p(`${col.co} · ${col.name}`, 2);
  p(`${col.big} ${col.bigLabel} · ${col.sub}`, 4);
  p(col.mix, 4); p(col.largest, 4); if (col.largestLater) p(`[beat 2] ${col.largestLater}`, 4); if (col.was) p(col.was, 4);
}
p(); p(c.landlords.mixTitle, 2);
for (const [co, parts] of Object.entries(c.landlords.mix)) {
  p(`${co}: ${parts.map((x) => `${x.label} ${x.text}`).join(' | ')}`, 4);
}
p(); p(`[footnote] ${c.landlords.mixNote}`); p(`[callout] ${c.landlords.callout}`); p(c.landlords.takeaway);

h('SLIDE 3 · PERFORMANCE');
p(c.performance.headline); p(c.performance.formula); p();
for (const row of c.performance.grid) {
  for (const x of row.cells) p(`${row.co} FY${x.year}: ROE ${x.text.roe} · net income ${x.text.ni} · CFO ${x.text.cfo}`, 2);
}
p(); c.performance.points.forEach((t, k) => p(`${k + 1}. ${t}`));
p(`Verdict: ${c.performance.verdict}`); p(`Footnote: ${c.performance.footnote}`);

h('SLIDE 4 · EARNINGS VS. CASH');
p(`[badge] ${c.badges.both}`);
p(c.accruals.headline); p(c.accruals.sub); p();
p(`[beat 1] ${c.accruals.barsTitle}`);
for (const b of c.accruals.bars) p(`${b.co}: ${b.values.map((v) => `FY${v.year} ${v.text}`).join(' | ')}`, 2);
p(`marker: ${c.accruals.exGain.co} FY${c.accruals.exGain.year} ${c.accruals.exGain.text}`, 2);
p(`labels: ${Object.values(c.accruals.barNotes).join(' · ')}`, 2);
p(c.accruals.gainNote, 2);
p(`[beat 2] ${c.accruals.lines.title}`);
p(`${c.accruals.lines.labels.ni}: ${c.accruals.lines.ni.map((v) => `FY${v.year} ${v.text}`).join(' | ')}`, 2);
p(`${c.accruals.lines.labels.cfo}: ${c.accruals.lines.cfo.map((v) => `FY${v.year} ${v.text}`).join(' | ')}`, 2);
p(c.accruals.lines.callout, 2);
p(c.accruals.chipsTitle, 2);
c.accruals.chips.forEach((t) => p(t, 4));
p(c.accruals.anomalies, 2);
p(`[beat 3] ${c.accruals.limit.title}`);
p(c.accruals.limit.body, 2); p(c.accruals.limit.test, 2);

h('SLIDE 5 · PRE-EVENT RISK');
p(`[badge] ${c.badges.pre}`);
p(c.warnings.headline); p();
p('[beats 1-2] four measures, two per beat');
c.warnings.tiles.forEach((t, k) => {
  p(`${k + 1}. ${t.title}`, 2);
  for (const g of t.groups ?? [t]) {
    if (t.groups) p(`[${g.label}]`, 4);
    for (const s of g.series) p(`${s.co}: ${s.values.map((v) => `FY${v.year} ${v.text}`).join(' | ')} → big number ${g.ndText?.[s.co] ?? s.latest}`, 6);
  }
  p(t.summary, 6); p(`Caption: ${t.caption}`, 6);
  if (t.footnote) p(`Footnote: ${t.footnote}`, 6);
  for (const g of t.groups ?? [t]) if (g.nd) for (const [co, n] of Object.entries(g.nd)) p(`tooltip (${co}): ${n}`, 6);
});
p(`[beat 3] ${c.warnings.timeline.title}`);
for (const b of c.warnings.timeline.bands) p(`above · ${b.year} (year band) · ${b.co} ${b.text}`, 2);
for (const e of c.warnings.timeline.events) p(`below · ${e.date} · ${e.text}`, 2);
p(c.warnings.timeline.note, 2);

h('SLIDE 6 · VERDICT, COUNTERARGUMENT, FY2024 CHECK');
p(c.verdict.headline); p(c.verdict.position); p();
for (const s of c.verdict.signals) { p(`${s.kicker} — ${s.title}`, 2); p(s.body, 4); p(s.limit, 4); }
p(c.verdict.support, 2);
p(`[beat 2] ${c.verdict.against.title}`, 2); p(c.verdict.against.fact, 4);
c.verdict.against.more.forEach((t) => p(`• ${t}`, 4));
p(`Response: ${c.verdict.against.response}`, 4);
p(`[beat 3] ${c.verdict.check.title}   [badge] ${c.badges.outcome}`);
for (const g of c.verdict.check.charges) {
  p(`${c.verdict.check.waterfallTitle} FY${g.year}: ${g.totalText}`, 2);
  for (const it of g.items) p(`${it.label} ${it.text}`, 6);
}
for (const s of c.verdict.check.side) p(`${s.label}: ${s.value}${s.sub ? ` (${s.sub})` : ''}`, 2);
p(c.verdict.check.closing, 2);

h('SLIDE 7 · AI USE AND QUESTIONS');
p(c.ai.headline); p();
for (const col of c.ai.columns) { p(col.title, 2); col.bullets.forEach((b) => p(`• ${b}`, 4)); }
p(c.ai.question); p(c.ai.pointer); p(`[button] ${c.ai.button}`);

h('APPENDIX');
c.appendix.panels.forEach((panel, k) => {
  p(); p(`${k + 1}. ${panel.title}`);
  for (const t of [panel.table, ...(panel.tables ?? [])].filter(Boolean)) {
    if (t.title) p(t.title, 4);
    if (t.unit) p(`(${t.unit})`, 4);
    p(t.head.join(' | '), 4);
    for (const row of t.rows) p(row.map((x) => x.text).join(' | '), 4);
  }
  for (const g of panel.groups ?? []) { p(g.title, 4); g.rows.forEach((r) => p(r.join(': '), 6)); }
  for (const l of panel.list ?? []) p(`• ${l}`, 4);
  for (const l of panel.links ?? []) p(`${l.label}: ${l.url}`, 4);
  if (panel.note) p(`Note: ${panel.note}`, 4);
});

h('FOOTER');
p(c.footer);

const text = out.join('\n');
console.log(text);
const bad = text.match(/undefined|NaN|\{[^}]*\}|\[object/g);
if (bad) { console.error(`\nUNRESOLVED: ${[...new Set(bad)].join(', ')}`); process.exit(1); }
