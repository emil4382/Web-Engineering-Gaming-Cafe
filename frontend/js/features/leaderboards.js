/**
 * @file Leaderboards page feature module.
 *
 * Renders per-game ranked standings (Solo/Team) derived from the café
 * tournaments. Data comes from `GET /api/leaderboard?game=&type=` which falls
 * back to the static mock when no backend is present.
 *
 * Wiring:
 * - `#leaderboardTabs` (role=tablist) switches the active game; the tabs are
 *   keyboard-operable with Arrow/Home/End keys (roving tabindex).
 * - `#leaderboardToggle` (.segmented) switches Solo ↔ Team.
 * - FIFA is solo-only → the Team button is disabled while FIFA is active and
 *   the view is forced back to Solo.
 * - `#leaderboardRoot` is (re)rendered on every game/type change.
 *
 * @module features/leaderboards
 */

import { apiGet } from '../api/api.js';
import { qs, qsa, el } from '../utils/dom.js';

/** Games that only have a Solo board (no team standings). */
const SOLO_ONLY = new Set(['fifa']);

/**
 * Build the two initials shown inside a competitor's avatar bubble.
 * @param {string} name - Player or team name.
 * @returns {string} Up to two uppercase initials.
 */
function initials(name) {
  const parts = String(name).replace(/[^\p{L}\p{N} _-]/gu, ' ').trim().split(/[\s_-]+/);
  const letters = parts.filter(Boolean).map((p) => p[0]);
  return (letters.slice(0, 2).join('') || String(name).slice(0, 2)).toUpperCase();
}

/**
 * Format a rank movement delta into a short, signed trend string.
 * @param {number} delta - Positions gained (+) or lost (-) since last week.
 * @returns {string} e.g. '+2', '−1', '–'.
 */
function trend(delta) {
  if (!delta) return '–';
  return delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`;
}

/**
 * Build one ranked row (`.lb-row`) for a competitor.
 * @param {{rank:number,name:string,points:number,delta:number,players?:number}} entry - Standing.
 * @param {'solo'|'team'} type - Current board type (controls the meta line).
 * @returns {HTMLLIElement} The list-item row.
 */
function rowFor(entry, type) {
  const rankClass = entry.rank <= 3 ? ` rank-${entry.rank}` : '';
  const sub = type === 'team' && entry.players
    ? el('span', { class: 'lb-team' }, `${entry.players} Spieler`)
    : null;

  return el('li', { class: `lb-row${rankClass}` },
    el('span', { class: 'lb-rank', 'aria-hidden': 'true' }, String(entry.rank)),
    el('span', { class: 'lb-player' },
      el('span', { class: 'lb-avatar', 'aria-hidden': 'true' }, initials(entry.name)),
      el('span', { class: 'lb-name', title: entry.name }, entry.name),
      sub,
    ),
    el('span', { class: 'lb-wins' },
      el('span', { class: 'visually-hidden' }, 'Trend: '),
      trend(entry.delta),
    ),
    el('span', { class: 'lb-points' },
      String(entry.points),
      el('span', { class: 'visually-hidden' }, ' Punkte'),
    ),
  );
}

/**
 * Render the full leaderboard table (header + ranked list) into the root.
 * @param {HTMLElement} root - The `#leaderboardRoot` container.
 * @param {Array} entries - Standings for the active game/type.
 * @param {'solo'|'team'} type - Current board type.
 * @returns {void}
 */
function render(root, entries, type) {
  root.replaceChildren();

  if (!Array.isArray(entries) || entries.length === 0) {
    root.appendChild(el('p', { class: 'empty-state' },
      'Für diese Auswahl liegen noch keine Ranglisten vor.'));
    return;
  }

  const head = el('div', { class: 'lb-head' },
    el('span', {}, 'Rang'),
    el('span', {}, type === 'team' ? 'Team' : 'Spieler'),
    el('span', { class: 'lb-wins' }, 'Trend'),
    el('span', { class: 'lb-points' }, 'Punkte'),
  );

  const list = el('ol', { class: 'ranked' }, ...entries.map((e) => rowFor(e, type)));

  root.appendChild(el('div', { class: 'leaderboard' }, head, list));
}

/**
 * Initialise the leaderboards page: load the active board, render it, and wire
 * the game tabs (arrow-key navigation) and Solo/Team segmented toggle.
 * @returns {void}
 */
export default function init() {
  const tablist = qs('#leaderboardTabs');
  const toggle = qs('#leaderboardToggle');
  const root = qs('#leaderboardRoot');
  if (!tablist || !toggle || !root) return;

  const tabs = qsa('[role="tab"]', tablist);
  const typeButtons = qsa('button[data-type]', toggle);

  const state = {
    game: tabs.find((t) => t.getAttribute('aria-selected') === 'true')?.dataset.game || 'valorant',
    type: 'solo',
  };

  /** Disable/enable the Team toggle button for solo-only games. */
  function syncToggleAvailability() {
    const soloOnly = SOLO_ONLY.has(state.game);
    for (const btn of typeButtons) {
      if (btn.dataset.type === 'team') {
        btn.disabled = soloOnly;
        btn.setAttribute('aria-disabled', String(soloOnly));
        if (soloOnly) btn.title = 'FIFA wird nur als Solo-Wertung ausgetragen.';
        else btn.removeAttribute('title');
      }
    }
    // Force Solo when the active game has no team board.
    if (soloOnly) state.type = 'solo';
    for (const btn of typeButtons) {
      btn.setAttribute('aria-pressed', String(btn.dataset.type === state.type));
    }
  }

  /** Load the active board from the API and render it. */
  async function load() {
    syncToggleAvailability();
    root.setAttribute('aria-busy', 'true');
    let entries = [];
    try {
      entries = await apiGet(`/api/leaderboard?game=${encodeURIComponent(state.game)}&type=${state.type}`);
    } catch {
      entries = [];
    }
    root.removeAttribute('aria-busy');
    render(root, entries, state.type);
  }

  /**
   * Activate a game tab by index (roving tabindex + selection + reload).
   * @param {number} index - Target tab index.
   * @param {boolean} [focus=true] - Whether to move keyboard focus to it.
   */
  function activateTab(index, focus = true) {
    const next = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, i) => {
      const selected = i === next;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    const tab = tabs[next];
    state.game = tab.dataset.game;
    root.setAttribute('aria-labelledby', tab.id);
    if (focus) tab.focus();
    load();
  }

  // Tabs: click + arrow-key navigation.
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(i));
  });
  tablist.addEventListener('keydown', (event) => {
    const current = tabs.indexOf(document.activeElement);
    if (current === -1) return;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        activateTab(current + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        activateTab(current - 1);
        break;
      case 'Home':
        event.preventDefault();
        activateTab(0);
        break;
      case 'End':
        event.preventDefault();
        activateTab(tabs.length - 1);
        break;
      default:
    }
  });

  // Solo / Team toggle.
  for (const btn of typeButtons) {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      state.type = btn.dataset.type === 'team' ? 'team' : 'solo';
      for (const b of typeButtons) {
        b.setAttribute('aria-pressed', String(b.dataset.type === state.type));
      }
      load();
    });
  }

  load();
}
