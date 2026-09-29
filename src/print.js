// Static slide-deck view (?print): one 1920×1080 page per main slide (chapter) with every beat
// shown, then one page per appendix panel. scripts/export-pdf.mjs prints it to PDF.

import * as c from './content.js';
import { h } from './dom.js';
import { buildScenes, buildAppendix } from './scenes.js';

const W = 1920;
const H = 1080;

function foot(label) {
  return h('footer', { class: 'page-foot' },
    h('p', {}, c.authors),
    h('p', {}, label),
    h('p', { class: 'source' }, c.footer));
}

// Scales a page body's content down (uniformly, like a slide) until it fits under the header.
function fit(body) {
  const inner = h('div', { class: 'fit-inner' }, ...body.childNodes);
  body.append(inner);
  const bw = body.clientWidth, bh = body.clientHeight;
  let z = 1;
  for (let i = 0; i < 4; i++) {
    inner.style.width = `${bw / z}px`;
    const need = inner.scrollHeight;
    const next = Math.min(1, bh / need);
    if (Math.abs(next - z) < 0.01) break;
    z = next;
  }
  z = Math.floor(z * 97) / 100; // margin for text that wraps differently once scaled
  inner.style.width = `${bw / z}px`;
  inner.style.transform = `scale(${z})`;
  return z;
}

export function buildPrint() {
  document.documentElement.classList.add('print');
  const deck = document.getElementById('deck');
  const scenes = buildScenes({ openAppendix: () => {} }).filter((sc) => sc.id !== 'hero');
  const total = scenes.length;

  scenes.forEach((sc, k) => {
    sc.el.querySelectorAll('[data-show]').forEach((el) => el.classList.add('is-on'));
    // Chart that repeats a point made in text: left out of the one-page version.
    if (sc.id === 'ch4') sc.el.querySelector('.chart-lines')?.closest('.fig')?.remove();
    if (sc.id === 'ch1') {
      sc.el.querySelector('.scene-head').prepend(
        h('div', { class: 'print-title' },
          h('p', { class: 'eyebrow' }, c.hero.eyebrow),
          h('h1', { class: 'print-name' }, c.hero.title),
          h('p', { class: 'people' }, c.hero.people)));
    }
    sc.el.querySelector('.frame').append(foot(`Slide ${k + 1} of ${total}`));
    sc.el.classList.add('page');
    deck.append(sc.el);
  });

  const ap = buildAppendix();
  const panels = [...ap.querySelectorAll('.panel')];
  panels.forEach((p, k) => {
    p.hidden = false;
    const title = p.querySelector('h3');
    title.remove();
    deck.append(h('section', { class: 'page ap-page' },
      h('div', { class: 'frame' },
        h('header', { class: 'scene-head' },
          h('p', { class: 'eyebrow' }, `${c.appendix.title} ${k + 1} of ${panels.length}`),
          h('h2', { class: 'headline' }, title.textContent.replace(/^\d+\.\s*/, ''))),
        h('div', { class: 'scene-body' }, p),
        foot(`Appendix ${k + 1} of ${panels.length}`))));
  });

  const zooms = [...document.querySelectorAll('.page .scene-body')].map(fit);
  window.__print = { main: total, appendix: panels.length, zooms, size: [W, H] };
}
