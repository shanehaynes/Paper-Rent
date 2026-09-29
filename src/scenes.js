// Scene builders. Each returns { id, chapter, label, beats, el, onBeat? } at its resting layout.
// Elements carry data-show="from-to" (beat range in which they are visible).

import * as c from './content.js';
import { h, nd } from './dom.js';
import {
  heroArt, stepChart, mixBar, divergingBars, niCfoLines, sparkline, timeline, waterfall,
} from './charts.js';

const pad2 = (n) => String(n).padStart(2, '0');

function scene({ id, chapter, beats = 1, head, body, cls = '' }) {
  const label = c.rail[chapter - 1];
  const hid = `${id}-h`;
  const el = h('section', {
    class: `scene ${cls}`, id, 'data-chapter': chapter, 'data-beats': beats,
    'aria-labelledby': hid, style: `--beats:${beats}`,
  },
    h('div', { class: 'stage' },
      h('div', { class: 'frame' },
        head && h('header', { class: 'scene-head' },
          h('div', { class: 'eyebrow-row' },
            h('p', { class: 'eyebrow' }, `${pad2(chapter)} · ${label}`),
            head.badges && h('div', { class: 'badge-slot' }, head.badges)),
          h('h2', { id: hid, class: 'headline' }, head.headline),
          head.sub && h('p', { class: 'sub' }, head.sub)),
        h('div', { class: 'scene-body' }, body))));
  return { id, chapter, label, beats, el };
}

const badge = (text, show) => h('p', { class: 'badge', 'data-show': show }, text);

// ---------------------------------------------------------------- 1 Title card (part of slide 1)
function hero() {
  const x = c.hero;
  return scene({
    id: 'hero', chapter: 1, beats: 2, cls: 'scene-hero',
    body: [
      h('p', { class: 'eyebrow' }, x.eyebrow),
      h('h1', { id: 'hero-h', class: 'title' }, x.title),
      h('p', { class: 'subtitle' }, x.subtitle),
      h('p', { class: 'people' }, x.people),
      heroArt({ buildings: x.buildings, tokenLabels: x.tokenLabels, title: x.artTitle, desc: x.artDesc }),
      h('div', { class: 'swap hero-foot' },
        h('p', { class: 'cue', 'data-show': '0-0' }, x.cue),
        h('p', { class: 'hero-caption', 'data-show': '1-1' }, x.caption)),
    ],
  });
}

// ---------------------------------------------------------------- 1 Issue
function issue() {
  const x = c.issue;
  return scene({
    id: 'ch1', chapter: 1, beats: 2, head: { headline: x.headline },
    body: [
      h('div', { class: 'layer issue-a', 'data-show': '0-0' },
        h('p', { class: 'lede' }, x.body),
        h('p', { class: 'lede allegation pop' }, x.allegation),
        h('div', { class: 'statements' }, x.statements.map((st) =>
          h('article', { class: 'card statement pop' },
            h('h3', {}, st.title),
            h('ul', {}, st.lines.map((l) => h('li', {}, l))))))),
      h('div', { class: 'layer issue-b', 'data-show': '1-1' },
        stepChart({ labels: x.explainer.labels, title: x.explainer.title, desc: x.explainer.desc }),
        h('div', { class: 'aside' },
          h('h3', { class: 'aside-title' }, x.explainer.title),
          h('p', { class: 'caption-lg pop' }, x.explainer.caption))),
    ],
  });
}

// ---------------------------------------------------------------- 2 Business models
function landlords() {
  const x = c.landlords;
  return scene({
    id: 'ch2', chapter: 2, beats: 2, head: { headline: x.headline },
    body: [
      h('div', { class: 'layer cols3', 'data-show': '0-0' }, x.columns.map((col) =>
        h('article', { class: `profile c-${col.co} pop` },
          h('h3', {}, `${col.name} (${col.co})`),
          h('p', { class: 'big' }, col.big, h('span', {}, col.bigLabel)),
          h('p', { class: 'line strong' }, col.sub),
          h('p', { class: 'line' }, col.mix),
          h('p', { class: 'line dim' }, col.largest),
          col.was && h('p', { class: 'line' }, col.was)))),
      h('div', { class: 'layer mix', 'data-show': '1-1' },
        h('h3', { class: 'section-title' }, x.mixTitle),
        Object.entries(x.mix).map(([co, parts]) =>
          h('div', { class: `mix-row c-${co}` },
            h('p', { class: 'mix-name' }, co),
            mixBar({ co, parts, title: `${c.NAMES[co]}: ${x.mixTitle}` }))),
        h('p', { class: 'footnote pop' }, x.mixNote),
        h('p', { class: 'callout c-SBRA pop' }, x.callout),
        h('p', { class: 'takeaway pop' }, x.takeaway)),
    ],
  });
}

// ---------------------------------------------------------------- 3 Performance
function performance() {
  const x = c.performance;
  const pointCo = ['OHI', 'MPW', 'SBRA'];
  return scene({
    id: 'ch3', chapter: 3, beats: 1, head: { headline: x.headline },
    body: h('div', { class: 'perf' },
      h('div', { class: 'dupont' },
        h('p', { class: 'formula' }, x.formula),
        h('div', { class: 'dupont-grid' },
          h('span', {}), x.years.map((y) => h('p', { class: 'colhead' }, `FY${y}`)),
          x.grid.map((row) => [
            h('p', { class: `rowhead c-${row.co}`, 'data-co': row.co }, row.co),
            row.cells.map((cell) =>
              h('div', { class: `cell c-${row.co}`, 'data-co': row.co, 'data-year': cell.year },
                h('p', { class: `roe ${cell.roe < 0 ? 'neg' : ''}`, 'data-k': 'roe' }, cell.text.roe, h('span', {}, 'ROE')),
                h('dl', { class: 'parts' }, ['ni', 'cfo'].map((k) =>
                  h('div', {},
                    h('dt', {}, x.labels[k]),
                    h('dd', { class: cell[k] < 0 ? 'neg' : '', 'data-k': k }, cell.text[k])))))),
          ]))),
      h('div', { class: 'perf-side' },
        h('ol', { class: 'points' }, x.points.map((t, k) =>
          h('li', { class: `c-${pointCo[k]}`, 'data-co': pointCo[k] }, t))),
        h('p', { class: 'verdict-line' }, x.verdict),
        h('p', { class: 'footnote' }, x.footnote))),
  });
}

// ---------------------------------------------------------------- 4 Earnings vs. cash
function accruals() {
  const x = c.accruals;
  return scene({
    id: 'ch4', chapter: 4, beats: 3,
    head: { headline: x.headline, sub: x.sub, badges: badge(c.badges.both) },
    body: [
      h('div', { class: 'layer acc-a', 'data-show': '0-0' },
        divergingBars({
          bars: x.bars, notes: x.barNotes, title: x.barsTitle, marker: x.exGain,
          glow: { co: x.exGain.co, year: x.exGain.year },
        }),
        h('p', { class: 'chart-title' }, x.barsTitle, ' · ', h('span', { class: 'c-MPW' }, x.barNotes.glow), '. ', x.gainNote),
        h('p', { class: 'chart-title dim' }, x.barNotes.exGain)),
      h('div', { class: 'layer acc-b', 'data-show': '1-2' },
        niCfoLines({ ...x.lines, desc: x.lines.callout }),
        h('div', { class: 'aside' },
          h('h3', { class: 'aside-title' }, x.lines.title),
          h('p', { class: 'caption-lg pop' }, x.lines.callout),
          h('div', { class: 'swap' },
            h('div', { class: 'chips', 'data-show': '1-1' },
              h('p', { class: 'chips-title' }, x.chipsTitle),
              x.chips.map((t) => h('p', { class: 'chip pop' }, t)),
              h('p', { class: 'anomalies pop' }, x.anomalies)),
            h('div', { class: 'chips', 'data-show': '2-2' },
              h('p', { class: 'chips-title' }, x.limit.title),
              h('p', { class: 'limit pop' }, x.limit.body),
              h('p', { class: 'limit strong pop' }, x.limit.test))))),
    ],
  });
}

// ---------------------------------------------------------------- 5 Pre-event risk
export function riskTile(t) {
  const vals = t.series.flatMap((sr) => sr.values.map((v) => v.value)).filter((v) => v != null);
  const domain = [0, Math.max(...vals)];
  return h('article', { class: `tile pop ${t.pulse ? 'has-pulse' : ''}` },
    h('h3', {}, t.title),
    h('div', { class: 'tile-grid' },
      h('div', { class: 'rows' }, t.series.map((sr) =>
        h('div', { class: `row c-${sr.co} ${sr.co === 'MPW' ? 'is-mpw' : ''} ${t.pulse === sr.co ? 'pulse' : ''}` },
          h('span', { class: 'co' }, sr.co),
          sparkline({ co: sr.co, values: sr.values, domain, title: `${sr.co}: ${t.title}` }),
          h('span', { class: `latest ${t.ndText?.[sr.co] ? 'is-nd' : ''}` },
            nd(t.ndText?.[sr.co] ?? sr.latest, t.nd?.[sr.co]))))),
      h('div', { class: 'tile-text' },
        h('p', { class: 'summary' }, t.summary),
        h('p', { class: 'caption' }, t.caption),
        t.footnote && h('p', { class: 'footnote' }, t.footnote))));
}

function warnings() {
  const x = c.warnings;
  return scene({
    id: 'ch5', chapter: 5, beats: 3,
    head: { headline: x.headline, badges: badge(c.badges.pre) },
    body: [
      h('div', { class: 'layer tiles', 'data-show': '0-0' }, x.tiles.slice(0, 2).map(riskTile)),
      h('div', { class: 'layer tiles', 'data-show': '1-1' }, x.tiles.slice(2).map(riskTile)),
      h('div', { class: 'layer tl', 'data-show': '2-2' },
        h('h3', { class: 'section-title' }, x.timeline.title),
        timeline(x.timeline),
        h('p', { class: 'tl-note pop' }, x.timeline.note)),
    ],
  });
}

// ---------------------------------------------------------------- 6 Verdict and FY2024 check
function verdict() {
  const x = c.verdict;
  return scene({
    id: 'ch6', chapter: 6, beats: 3,
    head: { headline: x.headline, badges: [badge(c.badges.pre, '0-1'), badge(c.badges.outcome, '2-2')] },
    body: [
      h('div', { class: 'layer verdict', 'data-show': '0-0' },
        h('p', { class: 'stance pop' }, x.position),
        x.signals.map((sg) => h('article', { class: 'card signal pop' },
          h('p', { class: 'kicker c-MPW' }, sg.kicker),
          h('h3', {}, sg.title),
          h('p', {}, sg.body),
          h('p', { class: 'limit-note' }, sg.limit))),
        h('p', { class: 'support pop' }, x.support)),
      h('div', { class: 'layer verdict-b', 'data-show': '1-1' },
        h('article', { class: 'card against pop' },
          h('p', { class: 'kicker' }, x.against.title),
          h('p', { class: 'fact' }, x.against.fact),
          h('ul', { class: 'more' }, x.against.more.map((t) => h('li', {}, t))),
          h('p', { class: 'response' }, x.against.response))),
      h('div', { class: 'layer check', 'data-show': '2-2' },
        h('div', {},
          h('h3', { class: 'section-title' }, `${x.check.title} · ${x.check.waterfallTitle}`),
          waterfall({ charges: x.check.charges, title: x.check.waterfallTitle })),
        h('div', { class: 'aside' },
          x.check.side.map((sd) => h('div', { class: 'stat pop' },
            h('p', { class: 'stat-label' }, sd.label),
            h('p', { class: 'stat-value c-MPW' }, sd.value),
            sd.sub && h('p', { class: 'stat-sub' }, sd.sub))),
          h('p', { class: 'closing pop' }, x.check.closing))),
    ],
  });
}

// ---------------------------------------------------------------- 7 AI use and questions
function ai(openAppendix) {
  const x = c.ai;
  return scene({
    id: 'ch7', chapter: 7, head: { headline: x.headline },
    body: h('div', { class: 'ai-wrap' },
      h('div', { class: 'cols3 ai' }, x.columns.map((col) =>
        h('article', { class: 'card pop' },
          h('h3', {}, col.title),
          h('ul', {}, col.bullets.map((b) => h('li', {}, b)))))),
      h('div', { class: 'close' },
        h('p', { class: 'question' }, x.question),
        h('p', { class: 'pointer' }, x.pointer),
        h('button', { class: 'btn', type: 'button', onclick: openAppendix }, x.button))),
  });
}

export const buildScenes = ({ openAppendix }) =>
  [hero(), issue(), landlords(), performance(), accruals(), warnings(), verdict(), ai(openAppendix)];

// ---------------------------------------------------------------- Appendix overlay
export function buildAppendix() {
  const x = c.appendix;
  const table = (t) => h('div', { class: 'table-wrap' },
    t.title && h('h4', { class: 'table-title' }, t.title),
    h('table', { class: `data ${t.text ? 'text' : ''}` },
      t.unit && h('caption', {}, t.unit),
      h('thead', {}, h('tr', {}, t.head.map((hd) => h('th', { scope: 'col' }, hd)))),
      h('tbody', {}, t.rows.map((row) => h('tr', {}, row.map((cell, k) =>
        k === 0 ? h('th', { scope: 'row' }, cell.text) : h('td', {}, nd(cell.text, cell.tip))))))));
  const panel = (p, k) => h('section', {
    class: `panel ${[p.table, ...(p.tables ?? [])].some((t) => t && t.head.length > 6) ? 'wide' : ''}`, id: `ap-${p.id}`, role: 'tabpanel',
    'aria-labelledby': `ap-tab-${p.id}`, 'data-panel': k, hidden: k !== 0,
  },
    h('h3', {}, `${k + 1}. ${p.title}`),
    p.table && table(p.table),
    p.tables && h('div', { class: 'tables' }, p.tables.map(table)),
    p.groups && h('div', { class: 'groups' }, p.groups.map((g) =>
      h('table', { class: 'data' }, h('caption', {}, g.title),
        h('tbody', {}, g.rows.map((r) => h('tr', { class: r[0] === 'Total' ? 'total' : '' }, h('th', { scope: 'row' }, r[0]), h('td', {}, r[1]))))))),
    p.list && h('ul', { class: 'plain' }, p.list.map((l) => h('li', {}, l))),
    p.links && h('ul', { class: 'links' }, p.links.map((l) => h('li', {}, h('span', {}, l.label), h('a', { href: l.url, rel: 'noopener' }, l.url)))),
    p.note && h('p', { class: 'footnote' }, p.note));
  return h('div', { class: 'appendix', id: 'appendix', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'appendix-h', hidden: true },
    h('div', { class: 'appendix-inner' },
      h('header', {},
        h('h2', { id: 'appendix-h' }, x.title),
        h('p', { class: 'hint' }, x.hint),
        h('button', { class: 'btn appendix-close', type: 'button' }, x.closeLabel)),
      h('div', { class: 'tabs', role: 'tablist', 'aria-label': x.title }, x.panels.map((p, k) =>
        h('button', {
          class: 'tab', role: 'tab', id: `ap-tab-${p.id}`, 'aria-controls': `ap-${p.id}`,
          'aria-selected': k === 0 ? 'true' : 'false', 'data-panel': k, type: 'button',
        }, `${k + 1} · ${p.title}`))),
      h('div', { class: 'panels' }, x.panels.map(panel))));
}
