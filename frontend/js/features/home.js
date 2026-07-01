// home page

import { qs, qsa } from '../utils/dom.js';

const COUNT_DURATION = 1100;

// helpers
function formatCount( value) {
  return Math.round(value).toLocaleString('de-DE');
}

function countUp(node) {
  const target = Number( node.dataset.countTo );
  const suffix = node.dataset.countSuffix || '';
  if (!Number.isFinite(target)) return;

  const start = performance.now( );

  function frame( now) {
    const t = Math.min(1,  (now - start) / COUNT_DURATION);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = formatCount(target * eased) + suffix;
    if (t < 1 ) {
      requestAnimationFrame(frame);
     } else {
      node.textContent = formatCount(target ) + suffix;
    }
  }

  requestAnimationFrame(frame);
}

// init
export default function init() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = qsa('[data-reveal]');
  const counters = qsa('.stat-row [data-count-to]');

  if (reduceMotion || typeof IntersectionObserver === 'undefined' ) {
    reveals.forEach( ( s) => s.classList.add('is-visible'));
    return;
  }

  // section reveal
  const revealObserver = new IntersectionObserver((entries,  obs) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
     }
  },  { threshold: 0.12,  rootMargin: '0px 0px -8% 0px'  });

  reveals.forEach((section) => revealObserver.observe( section) );

  // count-up
  if (counters.length) {
    const statRow = qs('.stat-row');
    const countObserver = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting ) continue;
        counters.forEach(countUp);
        obs.unobserve(entry.target);
      }
    }, { threshold: 0.5 });

    if (statRow) countObserver.observe(statRow );
  }
}
