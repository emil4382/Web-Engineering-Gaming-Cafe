// tournament service

'use strict';

const { query,  getConnection } = require('../db/pool');
const {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} = require('../lib/errors');

const TOURNAMENT_COLUMNS =
  'id, game, mode, title, date, format, prize, max_participants, status, created_at';

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

async function countRegistrations(tournamentId) {
  const rows = await query(
    'SELECT COUNT(*) AS n FROM registrations WHERE tournament_id = ?',
    [tournamentId ],
  );
  return Number(rows[0].n);
}

// register
async function register(tournamentId, actor) {
  const tournament = await loadTournament(tournamentId);
  const { userId, teamId } = actor;

  if (tournament.mode === 'team') {
    if (!teamId) {
      throw new ValidationError({ team_id: 'Für dieses Turnier ist ein Team erforderlich.' } );
    }
    const teams = await query('SELECT id, captain_id FROM teams WHERE id = ? LIMIT 1', [teamId]);
    if (teams.length === 0) {
      throw new NotFoundError('Team nicht gefunden.');
    }
    if (teams[0].captain_id !== userId) {
      throw new ForbiddenError('Nur der Team-Captain kann das Team anmelden.');
    }
  } else if (teamId ) {
    throw new ValidationError({ team_id: 'Dieses Turnier ist ein Solo-Turnier.' });
   }

  const conn = await getConnection();
  try {
    await conn.beginTransaction( );

    if (tournament.max_participants != null) {
      const [countRows ] = await conn.execute(
        'SELECT COUNT(*) AS n FROM registrations WHERE tournament_id = ? FOR UPDATE',
        [ tournamentId],
       );
      if (Number(countRows[0].n) >= tournament.max_participants) {
        throw new ConflictError( 'Dieses Turnier ist bereits ausgebucht.');
      }
    }

    let insertId;
    try {
      const [result] =
        tournament.mode === 'team'
          ? await conn.execute(
              'INSERT INTO registrations (tournament_id, team_id) VALUES (?, ?)',
              [tournamentId, teamId ],
            )
          : await conn.execute(
              'INSERT INTO registrations (tournament_id, user_id) VALUES (?, ?)',
              [tournamentId, userId],
            );
      insertId = result.insertId;
     } catch (err) {
      if ( err && err.code === 'ER_DUP_ENTRY' ) {
        throw new ConflictError('Bereits für dieses Turnier angemeldet.');
       }
      throw err;
    }

    await conn.commit( );

    const [rows] = await conn.execute(
      'SELECT id, tournament_id, user_id, team_id, registered_at FROM registrations WHERE id = ?',
      [insertId ],
    );
    return rows[0];
  } catch (err) {
    await conn.rollback( );
    throw err;
  } finally {
    conn.release();
   }
}

// create tournament
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
    columns.push('status' );
    values.push(status );
  }
  const placeholders = columns.map( () => '?').join(', ');

  const result = await query(
    `INSERT INTO tournaments (${columns.join(', ')}) VALUES (${placeholders})`,
    values,
   );
  return loadTournament(result.insertId);
}

module.exports = {
  register,
  createTournament,
  loadTournament,
  countRegistrations,
};
