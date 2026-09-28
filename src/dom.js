// Tiny DOM builders. h() for HTML, s() for SVG.

const SVG_NS = 'http://www.w3.org/2000/svg';

function build(el, attrs, kids) {
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const h = (tag, attrs, ...kids) => build(document.createElement(tag), attrs, kids);
export const s = (tag, attrs, ...kids) => build(document.createElementNS(SVG_NS, tag), attrs, kids);

// Design canvas is 1920×1080 at 1rem = 22px; SVG units are design pixels.
export const REM = 22;

let uid = 0;

export function srTable({ caption, head, rows }) {
  return h('table', { class: 'sr-only' },
    h('caption', {}, caption),
    h('thead', {}, h('tr', {}, head.map((t) => h('th', { scope: 'col' }, t)))),
    h('tbody', {}, rows.map((row) =>
      h('tr', {}, row.map((t, k) => (k === 0 ? h('th', { scope: 'row' }, t) : h('td', {}, t)))))));
}

// An accessible chart shell: <figure> with a titled SVG and a screen-reader data table.
export function frame({ w, h: ht, title, desc, table, cls = '' }) {
  const id = `chart-${++uid}`;
  const svg = s('svg', {
    viewBox: `0 0 ${w} ${ht}`, role: 'img', 'aria-labelledby': `${id}-t ${id}-d`,
    class: `chart ${cls}`, style: `--w:${w};width:${w / REM}rem;height:${ht / REM}rem`,
  }, s('title', { id: `${id}-t` }, title), s('desc', { id: `${id}-d` }, desc));
  const fig = h('figure', { class: 'fig' }, svg, table ? srTable({ caption: title, ...table }) : null);
  return { fig, svg };
}

// A value that may be "n/d": carries its reason as a tooltip.
export function nd(text, tip) {
  if (!tip) return h('span', {}, text);
  return h('span', { class: 'has-tip', tabindex: '0', 'data-tip': tip }, text);
}
