// Chart geometry (d3-scale / d3-shape / d3-array) rendered as inline SVG.
// Animation hooks: .draw (paths drawn in order), [data-grow] (bars from their baseline), .pop (labels).

import { scaleLinear, scaleBand, scalePoint, scaleTime } from 'd3-scale';
import { line, area, curveStepAfter } from 'd3-shape';
import { min, max, cumsum, range } from 'd3-array';
import { s, h, frame } from './dom.js';
import { showDate } from './format.js';

const fyLabel = (y) => `FY${y}`;
const add = (el, ...kids) => el.append(...kids.flat(Infinity).filter((k) => k != null && k !== false));

// ------------------------------------------------------------ Chapter 1: straight-line explainer
// Schematic only: an illustrative 10-year lease with annual escalators. No filing figures.
export function stepChart({ labels, title, desc }) {
  const W = 1180, H = 560, m = { l: 150, r: 250, t: 30, b: 44 };
  const split = 360; // top of the receivable band
  const years = range(1, 11);
  const cash = years.map((k) => 70 + 6 * (k - 1));
  const sl = cash.reduce((a, b) => a + b, 0) / cash.length;
  const rec = Array.from(cumsum(cash.map((c) => sl - c)));

  const x = scaleLinear([0, 10], [m.l, W - m.r]);
  const y = scaleLinear([55, 130], [split - 40, m.t]);
  const yr = scaleLinear([0, max(rec)], [H - m.b, split + 30]);

  const { fig, svg } = frame({
    w: W, h: H, title, desc, cls: 'chart-step',
    table: {
      head: ['Lease year', labels.cash, labels.revenue, labels.receivable],
      rows: years.map((k, i) => [`${labels.year} ${k}`, cash[i] < sl ? 'below straight-line' : 'above straight-line', 'flat', i < 5 ? 'growing' : 'unwinding']),
    },
  });

  const steps = [...years.map((k, i) => [k - 1, cash[i]]), [10, cash[9]]];
  const stepLine = line().x((d) => x(d[0])).y((d) => y(d[1])).curve(curveStepAfter);
  const gap = area().x((d) => x(d[0])).y0((d) => y(d[1])).y1(() => y(sl)).curve(curveStepAfter);
  const cross = steps.findIndex((d) => d[1] > sl);

  add(svg, 
    s('path', { class: 'gap pop', d: gap([...steps.slice(0, cross), [cross, cash[cross - 1]]]) }),
    s('path', { class: 'gap gap-late pop', d: gap(steps.slice(cross)) }),
    s('line', { class: 'baseline', x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b }),
    s('path', { class: 'series c-dim draw', d: stepLine(steps) }),
    s('path', { class: 'series c-ill draw', d: `M${x(0)},${y(sl)}L${x(10)},${y(sl)}` }),
    s('text', { class: 'lbl tag c-dim', x: m.l, y: m.t - 4 }, labels.tag),
    s('text', { class: 'lbl c-dim pop', x: x(10) + 14, y: y(cash[9]) + 6 }, labels.cash),
    s('text', { class: 'lbl c-ill pop', x: x(10) + 14, y: y(sl) + 6 }, labels.revenue),
    s('text', { class: 'lbl c-ill pop', x: m.l - 16, y: yr(max(rec) / 2), 'text-anchor': 'end' }, labels.receivable),
    years.map((k, i) => rec[i] > 0.5 && s('rect', {
      class: `bar c-ill ${i >= 5 ? 'late' : ''}`, 'data-grow': 'v', 'data-base': H - m.b,
      x: x(k - 1) + 8, width: x(1) - x(0) - 16, y: yr(rec[i]), height: H - m.b - yr(rec[i]),
    })),
    years.map((k) => s('text', { class: 'axis', x: x(k - 0.5), y: H - 14, 'text-anchor': 'middle' }, `${labels.year} ${k}`)),
  );
  return fig;
}

// ------------------------------------------------------------ Chapter 2: revenue mix
export function mixBar({ co, parts, title }) {
  const W = 1500, H = 40;
  const x = scaleLinear([0, 1], [0, W]);
  const { fig, svg } = frame({
    w: W, h: H, title, desc: parts.map((p) => `${p.label} ${p.text}`).join(', '), cls: `chart-mix c-${co}`,
    table: { head: ['Component', 'Share of revenue'], rows: parts.map((p) => [p.label, p.text]) },
  });
  let acc = 0;
  parts.forEach((p, k) => {
    add(svg, s('rect', {
      class: `seg seg-${k}`, 'data-grow': 'h', 'data-base': x(acc),
      x: x(acc), y: 0, width: Math.max(x(p.share) - 3, 1), height: H, rx: 3,
    }));
    acc += p.share;
  });
  fig.append(h('ul', { class: `mix-labels c-${co}`, 'aria-hidden': 'true' },
    parts.map((p, k) => h('li', { class: 'pop' }, h('i', { class: `sw seg-${k}` }), `${p.label} `, h('b', {}, p.text)))));
  return fig;
}

// ------------------------------------------------------------ Chapter 4: diverging accruals
export function divergingBars({ bars, notes, title, glow, marker }) {
  const W = 1640, H = 560, m = { l: 10, r: 10, t: 96, b: 44 };
  const all = [...bars.flatMap((b) => b.values.map((v) => v.value)), marker.value];
  const y = scaleLinear([min(all), max(all)], [H - m.b, m.t]);
  const xg = scaleBand(bars.map((b) => b.co), [m.l, W - m.r]).paddingInner(0.12);
  const { fig, svg } = frame({
    w: W, h: H, title, cls: 'chart-accruals',
    desc: `${notes.glow}. ${notes.normal}.`,
    table: {
      head: ['Company', ...bars[0].values.map((v) => fyLabel(v.year))],
      rows: [
        ...bars.map((b) => [b.co, ...b.values.map((v) => v.text)]),
        [`${marker.co} ${fyLabel(marker.year)}`, ...bars[0].values.map((v) => (v.year === marker.year ? marker.text : ''))],
      ],
    },
  });
  add(svg, s('line', { class: 'baseline', x1: m.l, x2: W - m.r, y1: y(0), y2: y(0) }));
  for (const b of bars) {
    const xi = scaleBand(b.values.map((v) => v.year), [xg(b.co), xg(b.co) + xg.bandwidth()]).padding(0.22);
    add(svg, s('text', { class: `lbl name c-${b.co}`, x: xg(b.co) + xg.bandwidth() / 2, y: 26, 'text-anchor': 'middle' }, b.co));
    for (const v of b.values) {
      const pos = v.value >= 0;
      const top = pos ? y(v.value) : y(0);
      const ht = Math.abs(y(v.value) - y(0));
      const cx = xi(v.year) + xi.bandwidth() / 2;
      const hot = glow.co === b.co && glow.year === v.year;
      add(svg, 
        s('rect', {
          class: `bar c-${b.co} ${hot ? 'glow' : ''} ${b.co === 'MPW' ? '' : 'peer'}`,
          'data-grow': 'v', 'data-base': y(0), 'data-order': v.year,
          x: xi(v.year), width: xi.bandwidth(), y: top, height: Math.max(ht, 1), rx: 3,
        }),
        s('text', { class: 'axis pop', x: cx, y: pos ? y(0) + 30 : y(0) - 12, 'text-anchor': 'middle' }, fyLabel(v.year)),
        s('text', { class: `lbl val pop ${hot ? 'c-MPW strong' : ''}`, x: cx, y: pos ? top - 12 : top + ht + 28, 'text-anchor': 'middle' }, v.text),
      );
      if (hot) {
        const my = y(marker.value);
        add(svg, s('g', { class: 'marker c-MPW pop' },
          s('line', { class: 'stem', x1: cx, x2: cx, y1: y(0) + 40, y2: my }),
          s('line', { class: 'cap', x1: xi(v.year), x2: xi(v.year) + xi.bandwidth(), y1: my, y2: my }),
          s('text', { class: 'lbl val c-MPW', x: cx, y: my + 28, 'text-anchor': 'middle' }, marker.text)));
      }
    }
  }
  add(svg, 
    s('text', { class: 'lbl note c-dim pop', x: xg('OHI') + xg.bandwidth() / 2, y: y(min(all) * 0.62), 'text-anchor': 'middle' }, notes.normal),
    s('text', { class: 'lbl note c-neg pop', x: xg('MPW') + xg.bandwidth() + 6, y: y(min(all) * 0.8), 'text-anchor': 'start' }, notes.loss),
  );
  return fig;
}

// ------------------------------------------------------------ Chapter 4: NI vs CFO
export function niCfoLines({ ni, cfo, labels, title, desc }) {
  const W = 1000, H = 560, m = { l: 70, r: 60, t: 60, b: 60 };
  const years = ni.map((d) => d.year);
  const x = scalePoint(years, [m.l, W - m.r]);
  const all = [...ni, ...cfo].map((d) => d.value);
  const y = scaleLinear([min(all), max(all)], [H - m.b - 30, m.t]);
  const path = line().x((d) => x(d.year)).y((d) => y(d.value));
  const { fig, svg } = frame({
    w: W, h: H, title, desc, cls: 'chart-lines',
    table: {
      head: ['Series', ...years.map(fyLabel)],
      rows: [[labels.ni, ...ni.map((d) => d.text)], [labels.cfo, ...cfo.map((d) => d.text)]],
    },
  });
  add(svg, 
    s('line', { class: 'baseline', x1: m.l - 30, x2: W - m.r + 30, y1: y(0), y2: y(0) }),
    years.map((yr) => s('text', { class: 'axis', x: x(yr), y: H - 16, 'text-anchor': 'middle' }, fyLabel(yr))),
    s('path', { class: 'series c-dim draw', d: path(cfo) }),
    s('path', { class: 'series c-MPW draw', d: path(ni) }),
  );
  years.forEach((yr, k) => {
    const niAbove = ni[k].value >= cfo[k].value;
    const put = (d, cls, above, name) => {
      // A label under a steeply falling line sits to the left of its point instead.
      const side = !above && k > 0 && d.value < 0;
      add(svg,
        s('circle', { class: `dot ${cls} pop`, cx: x(yr), cy: y(d.value), r: 7 }),
        s('text', {
          class: `lbl val ${cls} pop`, x: x(yr) - (side ? 18 : 0), y: y(d.value) + (side ? 6 : above ? -18 : 32),
          'text-anchor': side ? 'end' : 'middle',
        }, k === 0 ? `${name} ${d.text}` : d.text));
    };
    put(ni[k], 'c-MPW', niAbove, labels.ni);
    put(cfo[k], 'c-dim', !niAbove, labels.cfo);
  });
  return fig;
}

// ------------------------------------------------------------ Chapter 5: sparkline
export function sparkline({ co, values, domain, title }) {
  const W = 300, H = 64, pad = 10;
  const pts = values.filter((v) => v.value != null);
  const { fig, svg } = frame({
    w: W, h: H, title, cls: `chart-spark c-${co} ${co === 'MPW' ? '' : 'peer'}`,
    desc: values.map((v) => `${fyLabel(v.year)} ${v.text}`).join(', '),
    table: { head: ['Year', 'Value'], rows: values.map((v) => [fyLabel(v.year), v.text]) },
  });
  if (!pts.length) {
    add(svg, s('line', { class: 'nd-line', x1: pad, x2: W - pad, y1: H / 2, y2: H / 2 }));
    return fig;
  }
  const x = scalePoint(values.map((v) => v.year), [pad, W - pad]);
  const y = scaleLinear(domain, [H - pad, pad]);
  add(svg, 
    s('path', { class: 'series draw', d: line().x((d) => x(d.year)).y((d) => y(d.value))(pts) }),
    pts.map((d) => s('circle', { class: 'dot pop', cx: x(d.year), cy: y(d.value), r: 6 })),
  );
  return fig;
}

// ------------------------------------------------------------ Chapter 5: cash-basis timeline
function parseDate(str) {
  const q = /^(\d{4})-Q(\d)$/.exec(str);
  if (q) return new Date(Number(q[1]), (Number(q[2]) - 1) * 3 + 1, 15);
  const [yy, mm, dd] = str.split('-').map(Number);
  return new Date(yy, mm - 1, dd ?? 15);
}
function wrap(text, n) {
  const out = [''];
  for (const w of text.split(' ')) {
    if ((out[out.length - 1] + ' ' + w).trim().length > n) out.push(w);
    else out[out.length - 1] = (out[out.length - 1] + ' ' + w).trim();
  }
  return out;
}

// Annual counts are drawn as year-long bands; dated events as points.
export function timeline({ events, bands, lanes, title }) {
  const W = 1640, H = 600, m = { l: 60, r: 60 }, mid = 200;
  const years = bands.map((b) => b.year);
  const last = years[years.length - 1];
  const x = scaleTime([new Date(years[0], 0, 1), new Date(last + 1, 1, 15)], [m.l, W - m.r]);
  const { fig, svg } = frame({
    w: W, h: H, title, cls: 'chart-timeline',
    desc: [...bands.map((b) => `${b.year}: ${b.co} ${b.text}`), ...events.map((e) => `${showDate(e.date)}: ${e.text}`)].join('. '),
    table: {
      head: ['Company', 'Date', 'Event'],
      rows: [...bands.map((b) => [b.co, b.year, b.text]), ...events.map((e) => [e.co, showDate(e.date), e.text])],
    },
  });
  add(svg,
    s('line', { class: 'baseline strong draw', x1: m.l, x2: W - m.r, y1: mid, y2: mid }),
    [...years, last + 1].map((yr) => s('g', {},
      s('line', { class: 'tick', x1: x(new Date(yr, 0, 1)), x2: x(new Date(yr, 0, 1)), y1: mid - 9, y2: mid + 9 }),
      s('text', { class: 'axis', x: x(new Date(yr, 0, 1)) + 8, y: mid + 30 }, yr))),
    s('text', { class: 'lbl name c-OHI', x: m.l, y: 30 }, lanes.above),
    s('text', { class: 'lbl name c-MPW', x: m.l, y: H - 12 }, lanes.below),
  );
  for (const b of bands) {
    const x0 = x(new Date(b.year, 0, 1)) + 6, x1 = x(new Date(b.year + 1, 0, 1)) - 6;
    const lines = wrap(b.text, 28);
    add(svg, s('g', { class: `band c-${b.co} pop`, 'data-order': x0 },
      s('rect', { class: 'span', x: x0, y: mid - 44, width: x1 - x0, height: 30, rx: 4 }),
      lines.map((ln, i) => s('text', { class: 'lbl ev', x: x0 + 4, y: mid - 62 - (lines.length - 1 - i) * 30 }, ln))));
  }
  const evs = events.map((e) => ({ ...e, px: x(parseDate(e.date)), lines: wrap(e.text, 26) }));
  evs.forEach((e, k) => {
    const crowdedNext = evs[k + 1] && evs[k + 1].px - e.px < 330;
    const crowdedPrev = evs[k - 1] && e.px - evs[k - 1].px < 330;
    e.anchor = crowdedNext ? 'end' : crowdedPrev ? 'start' : 'middle';
    e.stem = crowdedNext ? 150 : crowdedPrev ? 40 : 70;
  });
  // A label that would run off the right edge drops below its neighbour instead.
  evs.forEach((e, k) => {
    if (e.anchor !== 'start' || e.px + 12 + Math.max(...e.lines.map((ln) => ln.length)) * 12 < W) return;
    e.anchor = 'middle';
    e.stem = 240;
    if (evs[k - 1]) evs[k - 1].stem = 120;
  });
  for (const e of evs) {
    const dx = e.anchor === 'end' ? -12 : e.anchor === 'start' ? 12 : 0;
    const textTop = mid + e.stem + 34;
    add(svg, s('g', { class: `event c-${e.co} pop`, 'data-order': e.px },
      s('line', { class: 'stem', x1: e.px, x2: e.px, y1: mid, y2: mid + e.stem }),
      s('circle', { class: 'dot', cx: e.px, cy: mid, r: 9 }),
      s('text', { class: 'lbl date', x: e.px + dx, y: textTop, 'text-anchor': e.anchor }, showDate(e.date)),
      e.lines.map((ln, i) => s('text', { class: 'lbl ev', x: e.px + dx, y: textTop + 30 + i * 28, 'text-anchor': e.anchor }, ln)),
    ));
  }
  return fig;
}

// ------------------------------------------------------------ Chapter 5: Steward charges waterfall
export function waterfall({ charges, title }) {
  const W = 1140, row = 42, gap = 22;
  const n = charges.reduce((a, g) => a + g.items.length + 1, 0);
  const H = n * row + gap * (charges.length - 1) + 8;
  const x = scaleLinear([0, max(charges, (g) => g.total)], [530, W - 120]);
  const { fig, svg } = frame({
    w: W, h: H, title, cls: 'chart-waterfall',
    desc: charges.map((g) => `${fyLabel(g.year)} total ${g.totalText}`).join(', '),
    table: {
      head: ['Year', 'Item', 'Charge'],
      rows: charges.flatMap((g) => [...g.items.map((it) => [fyLabel(g.year), it.label, it.text]), [fyLabel(g.year), 'Total', g.totalText]]),
    },
  });
  let yy = 0;
  charges.forEach((g, gi) => {
    let acc = 0;
    add(svg, 
      s('text', { class: 'lbl name c-MPW', x: 518, y: yy + 28, 'text-anchor': 'end' }, `${fyLabel(g.year)} total`),
      s('rect', { class: 'bar total', 'data-grow': 'h', 'data-base': x(0), x: x(0), y: yy + 8, width: x(g.total) - x(0), height: row - 16, rx: 3 }),
      s('text', { class: 'lbl val strong pop', x: x(g.total) + 10, y: yy + 27 }, g.totalText),
    );
    yy += row;
    for (const it of g.items) {
      add(svg, 
        s('text', { class: 'lbl c-dim', x: 518, y: yy + 28, 'text-anchor': 'end' }, it.label),
        s('rect', { class: 'bar item', 'data-grow': 'h', 'data-base': x(acc), x: x(acc), y: yy + 9, width: Math.max(x(it.value) - x(0), 2), height: row - 18, rx: 3 }),
        s('text', { class: 'lbl val pop', x: x(acc + it.value) + 10, y: yy + 26 }, it.text),
      );
      acc += it.value;
      yy += row;
    }
    if (gi < charges.length - 1) yy += gap;
  });
  return fig;
}

// ------------------------------------------------------------ Chapter 0: hero
export function heroArt({ buildings, tokenLabels, title, desc }) {
  const W = 1300, H = 380, ground = 330;
  const { fig, svg } = frame({ w: W, h: H, title, desc, cls: 'chart-hero' });
  const spec = { MPW: { x: 170, w: 170, ht: 250 }, OHI: { x: 800, w: 150, ht: 210 }, SBRA: { x: 1040, w: 150, ht: 180 } };
  const building = (x, w, ht, cls, label) => {
    const g = s('g', { class: `bldg ${cls}` });
    add(g, s('rect', { class: 'draw', x, y: ground - ht, width: w, height: ht, rx: 4 }));
    const cols = 3, rows = Math.floor(ht / 50);
    for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) {
      add(g, s('rect', { class: 'win pop', x: x + 22 + cc * ((w - 44 - 22) / (cols - 1)), y: ground - ht + 24 + rr * 46, width: 22, height: 24, rx: 2 }));
    }
    add(g, s('text', { class: 'lbl name', x: x + w / 2, y: ground + 36, 'text-anchor': 'middle' }, label));
    return g;
  };
  add(svg, s('line', { class: 'baseline', x1: 40, x2: W - 40, y1: ground, y2: ground }));
  for (const b of buildings) add(svg, building(spec[b.co].x, spec[b.co].w, spec[b.co].ht, `c-${b.co}`, b.co));
  add(svg, building(500, 120, 130, 'c-dim tenant', tokenLabels.tenant));
  const out = 'M340,150 C400,60 470,60 530,190';
  const back = 'M530,270 C470,330 400,330 340,250';
  add(svg, 
    s('path', { id: 'hero-out', class: 'flow c-MPW draw', d: out }),
    s('path', { id: 'hero-back', class: 'flow c-MPW draw', d: back }),
    s('text', { class: 'lbl c-MPW pop', x: 435, y: 44, 'text-anchor': 'middle' }, tokenLabels.out),
    s('text', { class: 'lbl c-MPW pop', x: 435, y: 300, 'text-anchor': 'middle' }, tokenLabels.back),
    s('g', { id: 'hero-token', class: 'token c-MPW', transform: 'translate(435,83)' },
      s('circle', { r: 18 }), s('text', { y: 8, 'text-anchor': 'middle' }, '$')),
  );
  return fig;
}
