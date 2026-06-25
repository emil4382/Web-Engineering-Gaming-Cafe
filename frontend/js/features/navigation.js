/**
 * @file Shared site navigation behaviour, run on every page via main.js.
 *
 * Provides four independent, defensively-guarded pieces:
 * 1. Mobile menu toggle — `aria-expanded`, Escape closes, focus returns to button.
 * 2. Navbar "scrolled" state — toggles a class past a scroll threshold.
 * 3. Smooth-scroll for in-page `#anchor` links (respects reduced-motion).
 * 4. Auth-state reflector — swaps the navbar Login link for a "Konto" link
 *    when a session exists; fully fail-silent in mock/offline mode.
 *
 * Each piece no-ops if its markup is absent, so the same module is safe on
 * pages that only have some of these elements.
 *
 * @module features/navigation
 */

import { qs, qsa } from '../utils/dom.js';
import { getMe } from '../api/api.js';

/** Scroll distance (px) past which the navbar gets its `scrolled` class. */
const SCROLL_THRESHOLD = 50;

/**
 * Initialise all shared navigation behaviour. Safe to call once per page.
 * @returns {void}
 */
export default function init() {
  initMobileMenu();
  initScrolledState();
  initSmoothScroll();
  initAuthReflector();
}

/* ------------------------------------------------------------------ */
/* 1. Mobile menu                                                     */
/* ------------------------------------------------------------------ */

/**
 * Wire up the mobile hamburger menu with accessible state.
 * Looks for a toggle button (`#mobileMenuBtn` / `.mobile-menu-btn`) and the
 * links container (`#navLinks` / `.nav-links`).
 * @returns {void}
 */
function initMobileMenu() {
  const btn = qs('#mobileMenuBtn') || qs('.mobile-menu-btn');
  const menu = qs('#navLinks') || qs('.nav-links');
  if (!btn || !menu) return;

  btn.setAttribute('aria-expanded', 'false');
  if (!btn.getAttribute('aria-controls') && menu.id) {
    btn.setAttribute('aria-controls', menu.id);
  }

  /**
   * @param {boolean} open - Whether the menu should be open.
   * @returns {void}
   */
  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  };

  btn.addEventListener('click', () => {
    setOpen(!menu.classList.contains('open'));
  });

  // Escape closes the menu and returns focus to the toggle button.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      setOpen(false);
      btn.focus();
    }
  });

  // Selecting a link closes the menu (mobile UX).
  qsa('a', menu).forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });
}

/* ------------------------------------------------------------------ */
/* 2. Navbar scrolled state                                           */
/* ------------------------------------------------------------------ */

/**
 * Toggle a `scrolled` class on the navbar based on scroll position.
 * Uses a passive listener and rAF to stay cheap.
 * @returns {void}
 */
function initScrolledState() {
  const navbar = qs('#navbar') || qs('.nav') || qs('nav');
  if (!navbar) return;

  let ticking = false;
  const update = () => {
    navbar.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

/* ------------------------------------------------------------------ */
/* 3. Smooth scroll                                                   */
/* ------------------------------------------------------------------ */

/**
 * Enable smooth in-page scrolling for `<a href="#section">` links.
 * Honours `prefers-reduced-motion` by falling back to instant jumps.
 * @returns {void}
 */
function initSmoothScroll() {
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  qsa('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = qs(href);
      if (!target) return; // let the browser handle unknown anchors

      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });
}

/* ------------------------------------------------------------------ */
/* 4. Auth-state reflector                                            */
/* ------------------------------------------------------------------ */

/**
 * Reflect the current session in the navbar: when logged in, the Login link
 * becomes a "Konto" link showing the username. Fully fail-silent — any error
 * (offline, mock mode, 401) simply leaves the default "Login" state.
 * @returns {void}
 */
function initAuthReflector() {
  const loginLink = qs('#navLogin') || qs('.nav-right .login') || qs('.nav-login');
  if (!loginLink) return;

  getMe()
    .then((user) => {
      if (!user) return; // logged out / offline → keep "Login"
      const name = user.username || user.name || 'Konto';
      loginLink.textContent = name;
      loginLink.setAttribute('href', '/konto.html');
      loginLink.setAttribute('aria-label', `Eingeloggt als ${name}`);
      loginLink.dataset.authenticated = 'true';
    })
    .catch(() => {
      /* fail silent: navbar stays in logged-out state */
    });
}
