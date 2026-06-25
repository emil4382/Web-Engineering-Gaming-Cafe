/**
 * @file Content/catalog service — read-only data behind the public GET endpoints.
 *
 * Holds the SQL + shaping for games, the gastro menu, tournament cards,
 * derived leaderboards and the static tariff list. Every query is parameterized
 * via the shared pool. The returned JSON shapes mirror `frontend/js/api/mock.js`
 * exactly (e.g. `image_url`→`image`, `description`→`desc`) so the live API and
 * the static mock are interchangeable.
 *
 * @module services/contentService
 */

'use strict';

const { query } = require('../db/pool');
const { TARIFE } = require('../lib/seatLayout');

/** Tournament games that run as team (5v5) competitions. @type {Set<string>} */
const TEAM_GAMES = new Set(['valorant', 'lol', 'cs']);

/** All valid tournament game slugs. @type {Set<string>} */
const GAME_SLUGS = new Set(['valorant', 'fifa', 'lol', 'cs']);

/** Valid tournament lifecycle statuses. @type {Set<string>} */
const TOURNAMENT_STATUSES = new Set([
  'angekuendigt',
  'anmeldung_offen',
  'laufend',
  'abgeschlossen',
]);

/** How many ranks a leaderboard returns. */
const LEADERBOARD_LIMIT = 10;

/**
 * List featured games, optionally filtered by a case-insensitive name search.
 * The DB `image_url` column is exposed as `image` to match the frontend.
 *
 * @param {string} [q] - Optional search term; matches anywhere in the name.
 * @returns {Promise<Array<{name:string,emoji:string,genre:string,image:string|null}>>}
 *   Games ordered by name.
 */
async function getGames(q) {
  const term = typeof q === 'string' ? q.trim() : '';
  const where = term ? 'WHERE name LIKE ?' : '';
  const params = term ? [`%${term}%`] : [];
  const rows = await query(
    `SELECT name, emoji, genre, image_url FROM games ${where} ORDER BY name ASC`,
    params,
  );
  return rows.map((g) => ({
    name: g.name,
    emoji: g.emoji,
    genre: g.genre,
    image: g.image_url ?? null,
  }));
}

/**
 * List all gastro menu items. The DB `description` column is exposed as `desc`.
 *
 * @returns {Promise<Array<{name:string,emoji:string,desc:string,price:number,category:string}>>}
 *   Menu items grouped by category, then name.
 */
async function getMenu() {
  const rows = await query(
    `SELECT category, emoji, name, description, price
       FROM menu_items
      ORDER BY FIELD(category, 'snacks', 'energy', 'kaffee', 'soft'), name ASC`,
  );
  return rows.map((m) => ({
    name: m.name,
    emoji: m.emoji,
    desc: m.description,
    price: Number(m.price),
    category: m.category,
  }));
}

/**
 * List tournament cards, with derived `registered` counts. `max_participants`
 * is exposed as `slots`. Supports optional `game` and `status` filters.
 *
 * @param {{game?:string, status?:string}} [filter] - Optional filters.
 * @returns {Promise<Array<{id:number,game:string,title:string,mode:string,date:string|null,format:string|null,prize:string|null,status:string,slots:number|null,registered:number}>>}
 *   Tournaments ordered by date.
 */
async function getTournaments(filter = {}) {
  const clauses = [];
  const params = [];
  if (filter.game) {
    clauses.push('t.game = ?');
    params.push(filter.game);
  }
  if (filter.status) {
    clauses.push('t.status = ?');
    params.push(filter.status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const rows = await query(
    `SELECT t.id, t.game, t.title, t.mode, t.date, t.format, t.prize,
            t.max_participants, t.status,
            (SELECT COUNT(*) FROM registrations r WHERE r.tournament_id = t.id) AS registered
       FROM tournaments t
       ${where}
      ORDER BY t.date IS NULL, t.date ASC, t.id ASC`,
    params,
  );

  return rows.map((t) => ({
    id: t.id,
    game: t.game,
    title: t.title,
    mode: t.mode,
    date: t.date ?? null,
    format: t.format ?? null,
    prize: t.prize ?? null,
    status: t.status,
    slots: t.max_participants ?? null,
    registered: Number(t.registered),
  }));
}

/**
 * Map raw leaderboard rows to the mock-compatible ranked array.
 *
 * @param {Array<{name:string,score:number,players?:number}>} rows - Ordered rows.
 * @param {boolean} isTeam - Whether to include a `players` count (team boards).
 * @returns {Array<{rank:number,name:string,points:number,delta:number,players?:number}>}
 *   Ranked entries; `delta` is `0` (no historical snapshot yet).
 */
function rankRows(rows, isTeam) {
  return rows.map((row, index) => {
    const entry = {
      rank: index + 1,
      name: row.name,
      points: Number(row.score),
      delta: 0,
    };
    if (isTeam) {
      entry.players = Number(row.players);
    }
    return entry;
  });
}

/**
 * Compute a derived leaderboard from the `results` table.
 *
 * - `type='solo'` + FIFA → `results JOIN users` (placement points per player).
 * - `type='solo'` + team game → `results JOIN team_members JOIN users` (every
 *   current member inherits the team's points).
 * - `type='team'` → `results JOIN teams` (team standings).
 *
 * Always filtered by `tournaments.game`, summed, ordered by points DESC,
 * limited to the top {@link LEADERBOARD_LIMIT}.
 *
 * @param {string} game - Game slug (`valorant`|`fifa`|`lol`|`cs`).
 * @param {'solo'|'team'} type - Board type.
 * @returns {Promise<Array<{rank:number,name:string,points:number,delta:number,players?:number}>>}
 *   The ranked leaderboard (empty array when no results exist).
 */
async function getLeaderboard(game, type) {
  if (type === 'team') {
    const rows = await query(
      `SELECT tm.name AS name,
              SUM(res.points) AS score,
              (SELECT COUNT(*) FROM team_members m WHERE m.team_id = tm.id) AS players
         FROM results res
         JOIN tournaments t ON t.id = res.tournament_id
         JOIN teams tm ON tm.id = res.team_id
        WHERE t.game = ? AND res.team_id IS NOT NULL
        GROUP BY tm.id, tm.name
        ORDER BY score DESC, tm.name ASC
        LIMIT ${LEADERBOARD_LIMIT}`,
      [game],
    );
    return rankRows(rows, true);
  }

  // type === 'solo'
  if (game === 'fifa') {
    const rows = await query(
      `SELECT u.username AS name, SUM(res.points) AS score
         FROM results res
         JOIN tournaments t ON t.id = res.tournament_id
         JOIN users u ON u.id = res.user_id
        WHERE t.game = ? AND res.user_id IS NOT NULL
        GROUP BY u.id, u.username
        ORDER BY score DESC, u.username ASC
        LIMIT ${LEADERBOARD_LIMIT}`,
      [game],
    );
    return rankRows(rows, false);
  }

  // Solo board for a team game: members inherit their team's placement points.
  const rows = await query(
    `SELECT u.username AS name, SUM(res.points) AS score
       FROM results res
       JOIN tournaments t ON t.id = res.tournament_id
       JOIN team_members tm ON tm.team_id = res.team_id
       JOIN users u ON u.id = tm.user_id
      WHERE t.game = ? AND res.team_id IS NOT NULL
      GROUP BY u.id, u.username
      ORDER BY score DESC, u.username ASC
      LIMIT ${LEADERBOARD_LIMIT}`,
    [game],
  );
  return rankRows(rows, false);
}

/**
 * Return the four static booking tariffs (defensive shallow copies).
 *
 * @returns {Array<{key:string,name:string,price:number,unit:string,unitLabel:string,featured?:boolean}>}
 *   The tariff catalogue (not DB-backed).
 */
function getTarife() {
  return TARIFE.map((t) => ({ ...t }));
}

module.exports = {
  TEAM_GAMES,
  GAME_SLUGS,
  TOURNAMENT_STATUSES,
  getGames,
  getMenu,
  getTournaments,
  getLeaderboard,
  getTarife,
};
