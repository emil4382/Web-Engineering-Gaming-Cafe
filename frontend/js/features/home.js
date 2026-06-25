/**
 * @file Home page feature module.
 * Adds two IntersectionObserver-driven enhancements, both gracefully
 * degrading and both gated by `prefers-reduced-motion`:
 *   (a) a count-up animation for the hero `.stat-row` numbers, and
 *   (b) a subtle fade/slide reveal of the main sections.
 * @module features/home
 */

import { qs, qsa } from '../utils/dom.js';

/** Total duration (ms) of the count-up animation. */
const COUNT_DURATION = 1100;

/**
 * Format an integer with German thousands separators (e.g. 2500 -> "2.500").
 * @param {number} value - Whole number to format.
 * @returns {string} Localised string.
 */
function formatCount(value) {
  return Math.round(value).toLocaleString('de-DE');
}

/**
 * Animate a single number element from 0 up to its target, then pin the
 * final value. Honours an optional `data-count-suffix` (e.g. "+").
 * @param {HTMLElement} node - The `[data-count-to]` element.
 * @returns {void}
 */
function countUp(node) {
  const target = Number(node.dataset.countTo);
  const suffix = node.dataset.countSuffix || '';
  if (!Number.isFinite(target)) return;

  const start = performance.now();

  /** @param {number} now */
  function frame(now) {
    const t = Math.min(1, (now - start) / COUNT_DURATION);
    // easeOutCubic for a natural deceleration.
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = formatCount(target * eased) + suffix;
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      node.textContent = formatCount(target) + suffix;
    }
  }

  requestAnimationFrame(frame);
}

/**
 * Initialise the home page enhancements.
 *
 * When `prefers-reduced-motion: reduce` is set (or IntersectionObserver is
 * unavailable), no animation runs: stat numbers keep their static markup and
 * every section is simply marked visible. Otherwise an IntersectionObserver
 * triggers the count-up and reveal exactly once per element as it scrolls in.
 *
 * @returns {void}
 */
export default function init() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = qsa('[data-reveal]');
  const counters = qsa('.stat-row [data-count-to]');

  // No motion (or no observer support): show everything statically, done.
  if (reduceMotion || typeof IntersectionObserver === 'undefined') {
    reveals.forEach((s) => s.classList.add('is-visible'));
    return;
  }

  // (b) Section reveal — fade/slide in once on first intersection.
  const revealObserver = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  reveals.forEach((section) => revealObserver.observe(section));

  // (a) Count-up — run once when the stat row enters the viewport.
  if (counters.length) {
    const statRow = qs('.stat-row');
    const countObserver = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        counters.forEach(countUp);
        obs.unobserve(entry.target);
      }
    }, { threshold: 0.5 });

    if (statRow) countObserver.observe(statRow);
  }
}
