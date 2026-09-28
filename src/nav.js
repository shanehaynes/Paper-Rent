// Resting-state registry, scroll → beat mapping, and keyboard navigation.
// A resting state is (scene, beat); its scroll position is scene top + beat × viewport height.

import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// In narrow mode the page is a plain document: one resting state per scene, every beat visible.
export function createDeck(scenes, { reduced, narrow, onChange }) {
  const states = scenes.flatMap((sc, si) => Array.from({ length: narrow ? 1 : sc.beats }, (_, beat) => ({ si, beat })));
  const gated = scenes.map((sc) => [...sc.el.querySelectorAll('[data-show]')].map((el) => {
    const [a, b] = el.dataset.show.split('-').map(Number);
    return { el, a, b };
  }));
  const tips = scenes.map((sc) => [...sc.el.querySelectorAll('.has-tip')]);
  const beatOf = scenes.map(() => -1);
  let index = 0;
  let tween = null;

  const vh = () => window.innerHeight;
  const posOf = (i) => Math.round(scenes[states[i].si].el.offsetTop + states[i].beat * vh());

  function nearest() {
    const y = window.scrollY;
    let best = 0;
    for (let i = 1; i < states.length; i++) if (Math.abs(posOf(i) - y) < Math.abs(posOf(best) - y)) best = i;
    return best;
  }

  function update() {
    const y = window.scrollY;
    scenes.forEach((sc, si) => {
      const beat = narrow ? 0 : clamp(Math.round((y - sc.el.offsetTop) / vh()), 0, sc.beats - 1);
      if (beat === beatOf[si]) return;
      beatOf[si] = beat;
      sc.el.dataset.beat = beat;
      for (const g of gated[si]) g.el.classList.toggle('is-on', narrow || (beat >= g.a && beat <= g.b));
      sc.onBeat?.(beat);
    });
    const at = nearest();
    if (!tween) index = at;
    // Only tooltips in the beat on screen take keyboard focus.
    tips.forEach((list, si) => list.forEach((tip) => {
      tip.tabIndex = narrow || (si === states[at].si && !tip.closest('[data-show]:not(.is-on)')) ? 0 : -1;
    }));
    onChange?.(states[at], at);
  }

  function go(i, { instant = false } = {}) {
    index = clamp(i, 0, states.length - 1);
    const y = posOf(index);
    tween?.kill();
    tween = null;
    if (instant || reduced) {
      window.scrollTo(0, y);
      update();
      return;
    }
    tween = gsap.to(window, {
      scrollTo: { y, autoKill: false }, duration: 1.0, ease: 'power2.inOut',
      onComplete: () => { tween = null; update(); },
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  if (!narrow) window.addEventListener('resize', () => go(index, { instant: true }));

  return {
    states,
    get index() { return index; },
    next: () => go(index + 1),
    prev: () => go(index - 1),
    home: () => go(0),
    go,
    goChapter: (ch) => go(states.findIndex((st) => scenes[st.si].chapter === ch)),
    update,
  };
}

export function bindKeys({ deck, appendix, timer }) {
  const FWD = ['ArrowRight', 'ArrowDown', ' ', 'Spacebar', 'PageDown'];
  const BACK = ['ArrowLeft', 'ArrowUp', 'PageUp'];
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onControl = e.target instanceof HTMLElement && e.target.matches('button, a') && (k === ' ' || k === 'Enter');
    if (onControl) return;
    if (k === 'Escape') { appendix.close(); timer.hide(); e.preventDefault(); return; }
    if (k === 'a' || k === 'A') { appendix.toggle(); e.preventDefault(); return; }
    if (k === 't' || k === 'T') { timer.toggle(); e.preventDefault(); return; }
    if (appendix.isOpen()) {
      if (FWD.includes(k)) { appendix.step(1); e.preventDefault(); }
      else if (BACK.includes(k)) { appendix.step(-1); e.preventDefault(); }
      return;
    }
    if (FWD.includes(k)) { deck.next(); e.preventDefault(); }
    else if (BACK.includes(k)) { deck.prev(); e.preventDefault(); }
    else if (k === 'Home') { deck.home(); e.preventDefault(); }
  });
}
