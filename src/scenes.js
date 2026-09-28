// Scene builders. Each returns { id, chapter, label, beats, el, onBeat? } at its resting layout.
// Elements carry data-show="from-to" (beat range in which they are visible).

import * as c from './content.js';
import { YEARS } from './derive.js';
import { h, nd } from './dom.js';
import {
  heroArt, stepChart, mixBar, dupontBars, divergingBars, niCfoLines, sparkline, timeline, waterfall,
} from './charts.js';

const pad2 = (n) => String(n).padStart(2, '0');

function scene({ id, chapter, beats = 1, head, body, cls = '' }) {
  const label = chapter ? c.rail[chapter - 1] : c.hero.title;
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

// ---------------------------------------------------------------- 0 Hero
function hero() {
  const x = c.hero;
  const sc = scene({
    id: 'hero', chapter: 0, beats: 2, cls: 'scene-hero',
    body: [
      h('p', { class: 'eyebrow' }, x.eyebrow),
      h('h1', { id: 'hero-h', class: 'title' }, x.title),
      h('p', { class: 'subtitle' }, x.subtitle),
      heroArt({ buildings: x.buildings, tokenLabels: x.tokenLabels, title: x.artTitle, desc: x.artDesc }),
      h('p', { class: 'cue' }, x.cue),
    ],
  });
  return sc;
}

// ---------------------------------------------------------------- 1 Issue
function issue() {
  const x = c.issue;
  return scene({
    id: 'ch1', chapter: 1, beats: 2, head: { headline: x.headline },
    body: [
      h('div', { class: 'layer issue-a', 'data-show': '0-0' },
        h('p', { class: 'lede' }, x.body),
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

// ---------------------------------------------------------------- 2 Landlords
function landlords() {
  const x = c.landlords;
  return scene({
    id: 'ch2', chapter: 2, beats: 2, head: { headline: x.headline },
    body: [
      h('div', { class: 'layer cols3', 'data-show': '0-0' }, x.columns.map((col) =>
        h('article', { class: `profile c-${col.co} pop` },
          h('h3', {}, col.name),
          h('p', { class: 'big' }, col.big, h('span', {}, col.bigLabel)),
          h('p', { class: 'line strong' }, col.sub),
          h('p', { class: 'line' }, col.mix),
          h('p', { class: 'line dim' }, col.largest)))),
      h('div', { class: 'layer mix', 'data-show': '1-1' },
        h('h3', { class: 'section-title' }, x.mixTitle),
        Object.entries(x.mix).map(([co, parts]) =>
          h('div', { class: `mix-row c-${co}` },
            h('p', { class: 'mix-name' }, c.SHORT[co]),
            mixBar({ co, parts, title: `${c.NAMES[co]}: ${x.mixTitle}` }))),
        h('p', { class: 'callout c-SBRA pop' }, x.callout),
        h('p', { class: 'takeaway pop' }, x.takeaway)),
    ],
  });
}

// ---------------------------------------------------------------- 3 Performance
function performance() {
  const x = c.performance;
  const focusOrder = [null, 'OHI', 'MPW', 'SBRA'];
  const pointCo = ['OHI', 'MPW', 'SBRA'];
  const sc = scene({
    id: 'ch3', chapter: 3, beats: 4, head: { headline: x.headline },
    body: h('div', { class: 'perf' },
      h('div', { class: 'dupont' },
        h('p', { class: 'formula' }, x.formula),
        h('div', { class: 'dupont-grid' },
          h('span', {}), x.years.map((y) => h('p', { class: 'colhead' }, `FY${y}`)),
          x.grid.map((row) => [
            h('p', { class: `rowhead c-${row.co}`, 'data-co': row.co }, row.co),
            row.cells.map((cell) =>
              h('div', { class: `cell c-${row.co}`, 'data-co': row.co },
                h('p', { class: `roe ${cell.roe < 0 ? 'neg' : ''}` }, cell.text.roe, h('span', {}, 'ROE')),
                dupontBars({ co: row.co, cell }))),
          ]))),
      h('div', { class: 'perf-side' },
        h('ol', { class: 'points' }, x.points.map((t, k) =>
          h('li', { class: `c-${pointCo[k]}`, 'data-co': pointCo[k] }, t))),
        h('p', { class: 'verdict-line' }, x.verdict),
        h('p', { class: 'footnote' }, x.footnote))),
  });
  sc.onBeat = (k) => {
    const f = focusOrder[k];
    if (f) sc.el.setAttribute('data-focus', f); else sc.el.removeAttribute('data-focus');
  };
  return sc;
}

// ---------------------------------------------------------------- 4 Accruals
function accruals() {
  const x = c.accruals;
  return scene({
    id: 'ch4', chapter: 4, beats: 3,
    head: { headline: x.headline, sub: x.sub, badges: badge(c.badges.both) },
    body: [
      h('div', { class: 'layer acc-a', 'data-show': '0-0' },
        divergingBars({ bars: x.bars, notes: x.barNotes, title: x.barsTitle, glow: { co: 'MPW', year: YEARS[1] } }),
        h('p', { class: 'chart-title' }, x.barsTitle, ' · ', h('span', { class: 'c-MPW' }, x.barNotes.glow))),
      h('div', { class: 'layer acc-b', 'data-show': '1-2' },
        niCfoLines({ ...x.lines, desc: x.lines.callout }),
        h('div', { class: 'aside' },
          h('h3', { class: 'aside-title' }, x.lines.title),
          h('p', { class: 'caption-lg pop' }, x.lines.callout),
          h('div', { class: 'chips', 'data-show': '2-2' },
            h('p', { class: 'chips-title' }, x.chipsTitle),
            x.chips.map((t) => h('p', { class: 'chip pop' }, t)),
            h('p', { class: 'anomalies pop' }, x.anomalies)))),
    ],
  });
}

// ---------------------------------------------------------------- 5 Warnings
function warnings() {
  const x = c.warnings;
  const tile = (t) => {
    const vals = t.series.flatMap((sr) => sr.values.map((v) => v.value)).filter((v) => v != null);
    const domain = [Math.min(...vals), Math.max(...vals)];
    return h('article', { class: `tile pop ${t.pulse ? 'has-pulse' : ''}` },
      h('h3', {}, t.title),
      h('div', { class: 'tile-grid' },
        h('div', { class: 'rows' }, t.series.map((sr) =>
          h('div', { class: `row c-${sr.co} ${sr.co === 'MPW' ? 'is-mpw' : ''} ${t.pulse === sr.co ? 'pulse' : ''}` },
            h('span', { class: 'co' }, sr.co),
            sparkline({ co: sr.co, values: sr.values, domain, title: `${sr.co}: ${t.title}` }),
            h('span', { class: 'latest' }, nd(sr.latest, t.nd?.[sr.co]))))),
        h('div', { class: 'tile-text' },
          h('p', { class: 'summary' }, t.summary),
          h('p', { class: 'caption' }, t.caption),
          t.footnote && h('p', { class: 'footnote' }, t.footnote))));
  };
  return scene({
    id: 'ch5', chapter: 5, beats: 3,
    head: { headline: x.headline, badges: [badge(c.badges.pre, '0-1'), badge(c.badges.outcome, '2-2')] },
    body: [
      h('div', { class: 'layer tiles', 'data-show': '0-0' }, x.tiles.map(tile)),
      h('div', { class: 'layer tl', 'data-show': '1-1' },
        h('h3', { class: 'section-title' }, x.timeline.title),
        timeline({ ...x.timeline, years: YEARS })),
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

// ---------------------------------------------------------------- 6 Verdict
function verdict() {
  const x = c.verdict;
  return scene({
    id: 'ch6', chapter: 6, beats: 3, head: { headline: x.headline },
    body: h('div', { class: 'verdict' },
      x.signals.map((sg) => h('article', { class: 'card signal', 'data-show': '0-2' },
        h('p', { class: 'kicker c-MPW' }, sg.kicker),
        h('h3', {}, sg.title),
        h('p', {}, sg.body))),
      h('article', { class: 'card paper', 'data-show': '1-2' },
        h('h3', {}, x.paper.title),
        h('p', {}, x.paper.body)),
      h('article', { class: 'card against', 'data-show': '2-2' },
        h('p', { class: 'kicker' }, x.against.title),
        h('p', { class: 'fact' }, x.against.fact),
        h('p', { class: 'response' }, x.against.response))),
  });
}

// ---------------------------------------------------------------- 7 AI
function ai() {
  const x = c.ai;
  return scene({
    id: 'ch7', chapter: 7, head: { headline: x.headline },
    body: h('div', { class: 'cols3 ai' }, x.columns.map((col) =>
      h('article', { class: 'card pop' },
        h('h3', {}, col.title),
        h('ul', {}, col.bullets.map((b) => h('li', {}, b)))))),
  });
}

export const buildScenes = () => [hero(), issue(), landlords(), performance(), accruals(), warnings(), verdict(), ai()];

// ---------------------------------------------------------------- Appendix overlay
export function buildAppendix() {
  const x = c.appendix;
  const table = (t) => h('div', { class: 'table-wrap' },
    h('table', { class: 'data' },
      h('caption', {}, t.unit),
      h('thead', {}, h('tr', {}, t.head.map((hd) => h('th', { scope: 'col' }, hd)))),
      h('tbody', {}, t.rows.map((row) => h('tr', {}, row.map((cell, k) =>
        k === 0 ? h('th', { scope: 'row' }, cell.text) : h('td', {}, nd(cell.text, cell.tip))))))));
  const panel = (p, k) => h('section', {
    class: `panel ${p.table && p.table.head.length > 6 ? 'wide' : ''}`, id: `ap-${p.id}`, role: 'tabpanel',
    'aria-labelledby': `ap-tab-${p.id}`, 'data-panel': k, hidden: k !== 0,
  },
    h('h3', {}, `${k + 1}. ${p.title}`),
    p.table && table(p.table),
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
        h('p', { class: 'hint' }, x.hint)),
      h('div', { class: 'tabs', role: 'tablist', 'aria-label': x.title }, x.panels.map((p, k) =>
        h('button', {
          class: 'tab', role: 'tab', id: `ap-tab-${p.id}`, 'aria-controls': `ap-${p.id}`,
          'aria-selected': k === 0 ? 'true' : 'false', 'data-panel': k, type: 'button',
        }, `${k + 1} · ${p.title}`))),
      h('div', { class: 'panels' }, x.panels.map(panel))));
}
