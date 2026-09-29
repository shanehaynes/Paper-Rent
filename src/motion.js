// Scroll-scrubbed motion layered on top of the resting layouts.
// Each (scene, beat) gets one timeline scrubbed over the half-viewport of scroll that leads
// into its resting position, so every animation is complete when the deck comes to rest.
// With prefers-reduced-motion nothing here runs: beats cross-fade in CSS and all content is visible.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const entryBeat = (el) => {
  const gate = el.closest('[data-show]');
  return gate ? Number(gate.dataset.show.split('-')[0]) : 0;
};
const byOrder = (a, b) => Number(a.dataset.order ?? 0) - Number(b.dataset.order ?? 0);

function prepDraw(path) {
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len}`;
  return len;
}

function beatTimeline(sc, beat, els) {
  const draws = els.filter((e) => e.classList.contains('draw'));
  const grows = els.filter((e) => e.hasAttribute('data-grow')).sort(byOrder);
  const pops = els.filter((e) => e.classList.contains('pop') && !e.hasAttribute('data-grow'));
  if (!draws.length && !grows.length && !pops.length) return;

  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    scrollTrigger: {
      start: () => sc.el.offsetTop + (beat - 0.5) * window.innerHeight,
      end: () => sc.el.offsetTop + (beat - 0.04) * window.innerHeight,
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });

  draws.forEach((p, k) => {
    const len = prepDraw(p);
    tl.fromTo(p, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.6, ease: 'power1.inOut' }, 0.05 + k * 0.12);
  });
  grows.forEach((r, k) => {
    const base = Number(r.dataset.base);
    const from = r.dataset.grow === 'v' ? { y: base, height: 0 } : { x: base, width: 0 };
    tl.from(r, { attr: from, duration: 0.5 }, 0.1 + (k / Math.max(grows.length, 1)) * 0.45);
  });
  // Labels wait for the last bar to finish growing.
  const grown = grows.length ? 0.1 + ((grows.length - 1) / grows.length) * 0.45 + 0.5 : 0.35;
  pops.forEach((p, k) => {
    tl.from(p, { opacity: 0, y: 14, duration: 0.35 }, grown + (k / Math.max(pops.length, 1)) * 0.4);
  });
  tl.to({}, { duration: 0.01 }, Math.max(1, tl.duration()));
}

function heroMotion(sc) {
  const el = sc.el;
  const token = el.querySelector('#hero-token');
  const flows = [...el.querySelectorAll('.flow')];
  const outlines = [...el.querySelectorAll('.bldg rect.draw')];

  // Title card: a timed entrance on load, not tied to scroll.
  const intro = gsap.timeline({ defaults: { ease: 'power2.out' } });
  intro.from(el.querySelectorAll('.eyebrow, .title, .subtitle'), { opacity: 0, y: 24, duration: 1.0, stagger: 0.18 });
  outlines.forEach((r) => {
    const len = prepDraw(r);
    intro.fromTo(r, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.2, ease: 'power1.inOut' }, 0.5);
  });
  intro.from(el.querySelectorAll('.win, .bldg .name, .chart-hero .baseline'), { opacity: 0, duration: 0.8 }, 1.1);
  intro.from(el.querySelector('.cue'), { opacity: 0, duration: 0.8 }, 1.6);

  // Viceroy's claim, scrubbed: the token leaves MPW as a loan and returns as rent, twice, and rests at MPW.
  token.removeAttribute('transform');
  gsap.set(token, { opacity: 0 });
  gsap.set(flows, { opacity: 0 });
  const labels = el.querySelectorAll('.chart-hero > text.pop');
  gsap.set(labels, { opacity: 0 });
  const tl = gsap.timeline({
    defaults: { ease: 'power1.inOut' },
    scrollTrigger: {
      start: () => el.offsetTop + 0.04 * window.innerHeight,
      end: () => el.offsetTop + 0.96 * window.innerHeight,
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });
  const leg = (path) => ({ motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: 1 });
  tl.to(flows, { opacity: 0.55, duration: 0.3 }, 0)
    .to(token, { opacity: 1, duration: 0.2 }, 0)
    .to(token, leg('#hero-out'), 0.1)
    .to(labels[0], { opacity: 1, duration: 0.3 }, 0.3)
    .to(token, leg('#hero-back'), 1.1)
    .to(labels[1], { opacity: 1, duration: 0.3 }, 1.3)
    .to(token, leg('#hero-out'), 2.1)
    .to(token, leg('#hero-back'), 3.1);
}

export function initMotion({ scenes, reduced }) {
  if (reduced) return;
  document.documentElement.classList.add('has-motion');
  for (const sc of scenes) {
    if (sc.id === 'hero') { heroMotion(sc); continue; }
    const els = [...sc.el.querySelectorAll('.draw, [data-grow], .pop')];
    for (let beat = 0; beat < sc.beats; beat++) {
      beatTimeline(sc, beat, els.filter((e) => entryBeat(e) === beat));
    }
  }
  ScrollTrigger.refresh();
}
