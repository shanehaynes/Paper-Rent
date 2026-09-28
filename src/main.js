import './styles.css';
import * as c from './content.js';
import { h } from './dom.js';
import { buildScenes, buildAppendix } from './scenes.js';
import { createDeck, bindKeys } from './nav.js';
import { initMotion } from './motion.js';

const params = new URLSearchParams(location.search);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = params.has('static'); // resting layouts only, used by the screenshot script

const deckEl = document.getElementById('deck');
const scenes = buildScenes();
deckEl.append(...scenes.map((sc) => sc.el));

// ---- footer
document.body.append(
  h('footer', { class: 'site-footer' }, c.footer),
  h('p', { class: 'authors' }, c.authors),
);

// ---- progress rail: one dot per main chapter
const chapters = scenes.filter((sc) => sc.chapter > 0);
const rail = h('nav', { class: 'rail', 'aria-label': c.chrome.railLabel }, chapters.map((sc) =>
  h('button', { type: 'button', 'data-chapter': sc.chapter, 'aria-label': `${sc.chapter}. ${sc.label}`, onclick: () => deck.goChapter(sc.chapter) },
    h('span', {}, sc.label))));
document.body.append(rail);

// ---- appendix overlay
const apEl = buildAppendix();
document.body.append(apEl);
const tabs = [...apEl.querySelectorAll('.tab')];
const panels = [...apEl.querySelectorAll('.panel')];
let panelIndex = 0;
let lastFocus = null;
const appendix = {
  isOpen: () => !apEl.hidden,
  show(k) {
    panelIndex = (k + panels.length) % panels.length;
    panels.forEach((p, i) => { p.hidden = i !== panelIndex; });
    tabs.forEach((t, i) => { t.setAttribute('aria-selected', i === panelIndex ? 'true' : 'false'); t.tabIndex = i === panelIndex ? 0 : -1; });
    apEl.scrollTop = 0;
  },
  step(d) { this.show(panelIndex + d); tabs[panelIndex].focus(); },
  open() {
    lastFocus = document.activeElement;
    apEl.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    this.show(panelIndex);
    tabs[panelIndex].focus();
  },
  close() {
    if (apEl.hidden) return;
    apEl.hidden = true;
    document.documentElement.style.overflow = '';
    lastFocus?.focus?.();
  },
  toggle() { this.isOpen() ? this.close() : this.open(); },
};
tabs.forEach((t, i) => t.addEventListener('click', () => appendix.show(i)));

// ---- countdown timer
const timerEl = h('div', { class: 'timer', role: 'timer', 'aria-label': c.chrome.timerLabel, hidden: true });
document.body.append(timerEl);
let remaining = c.chrome.timerSeconds;
let tick = null;
const paint = () => {
  const a = Math.abs(remaining);
  timerEl.textContent = `${remaining < 0 ? '+' : ''}${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}`;
  timerEl.classList.toggle('over', remaining < 0);
};
const timer = {
  hide() { timerEl.hidden = true; clearInterval(tick); tick = null; },
  toggle() {
    if (!timerEl.hidden) return this.hide();
    remaining = c.chrome.timerSeconds;
    paint();
    timerEl.hidden = false;
    tick = setInterval(() => { remaining -= 1; paint(); }, 1000);
  },
};

// ---- deck
const deck = createDeck(scenes, {
  reduced: reduced || still,
  onChange: (state) => {
    const ch = scenes[state.si].chapter;
    rail.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(Number(b.dataset.chapter) === ch)));
  },
});
bindKeys({ deck, appendix, timer });
deck.update();

if (!still) initMotion({ scenes, reduced });

window.__deck = { deck, appendix, timer, scenes: scenes.map(({ id, chapter, beats, label }) => ({ id, chapter, beats, label })) };
