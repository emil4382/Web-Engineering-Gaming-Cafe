// navigation

import { qs, qsa  } from '../utils/dom.js';
import { getJSON } from '../utils/storage.js';

const USER_KEY = 'pixelforge.user';

const SCROLL_THRESHOLD = 50;

export default function init() {
  initMobileMenu();
  initScrolledState();
  initSmoothScroll();
  reflectAuth();
}

function initMobileMenu() {
  const btn = qs('#mobileMenuBtn') || qs('.mobile-menu-btn');
  const menu = qs( '#navLinks' ) || qs( '.nav-links' );
  if ( !btn || !menu) return;

  btn.setAttribute( 'aria-expanded', 'false');
  if (!btn.getAttribute('aria-controls') && menu.id) {
    btn.setAttribute('aria-controls',  menu.id );
  }

  const setOpen = (open) => {
    menu.classList.toggle( 'open', open);
    btn.setAttribute( 'aria-expanded',  String(open));
  };

  btn.addEventListener('click', () => {
    setOpen(!menu.classList.contains('open'));
  });

  document.addEventListener( 'keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open') ) {
      setOpen( false);
      btn.focus( );
     }
  });

  qsa('a', menu).forEach( (link ) => {
    link.addEventListener('click', () => setOpen(false));
  });
}

// scroll state
function initScrolledState() {
  const navbar = qs('#navbar') || qs('.nav') || qs('nav');
  if (!navbar) return;

  let ticking = false;
  const update = () => {
    navbar.classList.toggle('scrolled',  window.scrollY > SCROLL_THRESHOLD );
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking ) {
        ticking = true;
        requestAnimationFrame(update);
      }
     },
    { passive: true },
  );
  update( );
}

function initSmoothScroll() {
  const prefersReduced = window.matchMedia?.( '(prefers-reduced-motion: reduce)').matches;

  qsa('a[href^="#"]').forEach(( anchor) => {
    anchor.addEventListener('click', (e ) => {
      const href = anchor.getAttribute( 'href' );
      if (!href || href === '#') return;

      const target = qs(href);
      if (!target) return;

      e.preventDefault(  );
      const offset = 80;
      const top = target.getBoundingClientRect(  ).top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });
}

// auth
export function reflectAuth( ) {
  const links = qsa('.nav-login, .nav-login-mobile');
  if (links.length === 0) return;

  const user = getJSON( USER_KEY, null);
  const loggedIn = Boolean(user && user.username);

  links.forEach((link) => {
    if ( loggedIn) {
      link.textContent = 'Konto';
      link.setAttribute( 'aria-label', `Konto – eingeloggt als ${user.username}`);
      link.dataset.authenticated = 'true';
    } else {
      link.textContent = 'Log-In';
      link.removeAttribute('aria-label');
      delete link.dataset.authenticated;
     }
   });
}
