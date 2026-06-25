/**
 * @file Tournament write service — register, create, record results.
 *
 * - `register` signs a user (solo) or a team (team mode) up for a tournament,
 *   enforcing the mode, captain ownership, capacity and uniqueness. A full
 *   bracket or a duplicate sign-up surfaces as `409`.
 * - `createTournament` (staff) inserts a tournament row.
 * - `recordResults` (staff) inserts `results` rows with server-computed points
 *   (`lib/points.computeResults`), inside a transaction.
 *
 * @module services/tournamentService
 */

'use strict';

const { query, getConnection } = require('../db/pool');
const { computeResults } = require('../lib/points');
const {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} = require('../lib/errors');

/** Columns returned for a tournament (DB-native; controller renames slots). */
const TOURNAMENT_COLUMNS =
  'id, game, mode, title, date, format, prize, max_participants, status, created_at';

/**
 * Load a tournament row or throw `404`.
 * @param {number} tournamentId - Tournament id.
 * @returns {Promise<Object>} The tournament row.
 * @throws {NotFoundError} If unknown.
 */
async function loadTournament(tournamentId) {
  const rows = await query(
    `SELECT ${TOURNAMENT_COLUMNS} FROM tournaments WHERE id = ? LIMIT 1`,
    [tournamentId],
  );
  if (rows.length === 0) {
    throw new NotFoundError('Turnier nicht gefunden.');
  }
  return rows[0];
}

/**
 * Count current registrations for a tournament.
 * @param {number} tournamentId - Tournament id.
 * @returns {Promise<number>} The registration count.
 */
async function countRegistrations(tournamentId) {
  const rows = await query(
    'SELECT COUNT(*) AS n FROM registrations WHERE tournament_id = ?',
    [tournamentId],
  );
  return Number(rows[0].n);
}

/**
 * Register a participant for a tournament. In `team` mode a `team_id` is
 * required and the acting user must be that team's captain; in `solo` mode the
 * session user registers themselves and `team_id` must be absent.
 *
 * @param {number} tournamentId - Tournament id.
 * @param {Object} actor - Who/what is registering.
 * @param {number} actor.userId - The session user's id (always present).
 * @param {number} [actor.teamId] - The team id (team mode only).
 * @returns {Promise<{id:number,tournament_id:number,user_id:?number,team_id:?number,registered_at:string}>}
 * @throws {ValidationError} If the payload does not match the tournament mode.
 * @throws {ForbiddenError} If registering a team the user does not captain.
 * @throws {NotFoundError} If the tournament or team is unknown.
 * @throws {ConflictError} If the tournament is full or the entry is a duplicate.
 */
async function register(tournamentId, actor) {
  const tournament = await loadTournament(tournamentId);
  const { userId, teamId } = actor;

  // --- mode check ---
  if (tournament.mode === 'team') {
    if (!teamId) {
      throw new ValidationError({ team_id: 'Für dieses Turnier ist ein Team erforderlich.' });
    }
    const teams = await query('SELECT id, captain_id FROM teams WHERE id = ? LIMIT 1', [teamId]);
    if (teams.length === 0) {
      throw new NotFoundError('Team nicht gefunden.');
    }
    if (teams[0].captain_id !== userId) {
      throw new ForbiddenError('Nur der Team-Captain kann das Team anmelden.');
    }
  } else if (teamId) {
    // solo mode must not carry a team_id
    throw new ValidationError({ team_id: 'Dieses Turnier ist ein Solo-Turnier.' });
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Capacity check (only when a limit is set). Lock the existing rows so two
    // concurrent registrations cannot both pass the check.
    if (tournament.max_participants != null) {
      const [countRows] = await conn.execute(
        'SELECT COUNT(*) AS n FROM registrations WHERE tournament_id = ? FOR UPDATE',
        [tournamentId],
      );
      if (Number(countRows[0].n) >= tournament.max_participants) {
        throw new ConflictError('Dieses Turnier ist bereits ausgebucht.');
      }
    }

    let insertId;
    try {
      const [result] =
        tournament.mode === 'team'
          ? await conn.execute(
              'INSERT INTO registrations (tournament_id, team_id) VALUES (?, ?)',
              [tournamentId, teamId],
            )
          : await conn.execute(
              'INSERT INTO registrations (tournament_id, user_id) VALUES (?, ?)',
              [tournamentId, userId],
            );
      insertId = result.insertId;
    } catch (err) {
      // UNIQUE(tournament_id,user_id|team_id) → duplicate sign-up.
      if (err && err.code === 'ER_DUP_ENTRY') {
        throw new ConflictError('Bereits für dieses Turnier angemeldet.');
      }
      throw err;
    }

    await conn.commit();

    const [rows] = await conn.execute(
      'SELECT id, tournament_id, user_id, team_id, registered_at FROM registrations WHERE id = ?',
      [insertId],
    );
    return rows[0];
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Create a tournament (staff).
 *
 * @param {Object} input - Validated tournament input.
 * @param {string} input.game - `valorant` | `fifa` | `lol` | `cs`.
 * @param {string} input.mode - `solo` | `team`.
 * @param {string} input.title - Tournament title.
 * @param {?string} [input.date] - `YYYY-MM-DD` or null.
 * @param {?string} [input.format] - Free-text format (e.g. `'5v5 · Team'`).
 * @param {?string} [input.prize] - Free-text prize (e.g. `'500 €'`).
 * @param {?number} [input.max_participants] - Capacity, or null.
 * @param {string} [input.status] - Lifecycle status; defaults at the DB level.
 * @returns {Promise<Object>} The created tournament row.
 */
async function createTournament(input) {
  const {
    game,
    mode,
    title,
    date = null,
    format = null,
    prize = null,
    max_participants = null,
    status,
  } = input;

  const columns = ['game', 'mode', 'title', 'date', 'format', 'prize', 'max_participants'];
  const values = [game, mode, title, date, format, prize, max_participants];
  if (status) {
    columns.push('status');
    values.push(status);
  }
  const placeholders = columns.map(() => '?').join(', ');

  const result = await query(
    `INSERT INTO tournaments (${columns.join(', ')}) VALUES (${placeholders})`,
    values,
  );
  return loadTournament(result.insertId);
}

/**
 * Record final results for a tournament (staff). Points are computed from each
 * placement server-side; any client-supplied `points` is ignored. All rows are
 * inserted in a single transaction so a partial failure rolls back.
 *
 * @param {number} tournamentId - Tournament id.
 * @param {Array<{placement:number, user_id?:number, team_id?:number}>} entries - Placements.
 * @returns {Promise<Array<{id:number,tournament_id:number,user_id:?number,team_id:?number,placement:number,points:number}>>}
 * @throws {NotFoundError} If the tournament is unknown.
 * @throws {ValidationError} If an entry lacks exactly one of user_id/team_id.
 */
async function recordResults(tournamentId, entries) {
  const tournament = await loadTournament(tournamentId);

  // Compute points from placements (throws on a bad placement). Each entry must
  // carry exactly one of user_id / team_id, matching the tournament's mode.
  const withPoints = computeResults(entries);
  for (const entry of withPoints) {
    const hasUser = entry.user_id != null;
    const hasTeam = entry.team_id != null;
    if (hasUser === hasTeam) {
      throw new ValidationError({
        results: 'Jedes Ergebnis braucht genau eines von user_id oder team_id.',
      });
    }
    if (tournament.mode === 'team' && hasUser) {
      throw new ValidationError({ results: 'Team-Turnier: bitte team_id angeben.' });
    }
    if (tournament.mode === 'solo' && hasTeam) {
      throw new ValidationError({ results: 'Solo-Turnier: bitte user_id angeben.' });
    }
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const ids = [];
    for (const entry of withPoints) {
      const [result] = await conn.execute(
        `INSERT INTO results (tournament_id, user_id, team_id, placement, points)
         VALUES (?, ?, ?, ?, ?)`,
        [
          tournamentId,
          entry.user_id ?? null,
          entry.team_id ?? null,
          entry.placement,
          entry.points,
        ],
      );
      ids.push(result.insertId);
    }
    await conn.commit();

    const [rows] = await conn.query(
      `SELECT id, tournament_id, user_id, team_id, placement, points
         FROM results WHERE id IN (${ids.map(() => '?').join(', ')})
        ORDER BY placement ASC, id ASC`,
      ids,
    );
    return rows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  register,
  createTournament,
  recordResults,
  loadTournament,
  countRegistrations,
};
