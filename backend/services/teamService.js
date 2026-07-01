// team service

'use strict';

const { query, getConnection } = require('../db/pool');
const { NotFoundError,  ConflictError, ForbiddenError } = require('../lib/errors');

const TEAM_COLUMNS = 'id, name, tag, game, captain_id, created_at';

// create team
async function createTeam(input, captainId) {
  const { name, tag = null, game } = input;
  const conn = await getConnection( );
  try {
    await conn.beginTransaction();

    let teamId;
    try {
      const [result] = await conn.execute(
        'INSERT INTO teams (name, tag, game, captain_id) VALUES (?, ?, ?, ?)',
        [ name, tag, game, captainId],
      );
      teamId = result.insertId;
    } catch ( err ) {
      if (err && err.code === 'ER_DUP_ENTRY' ) {
        throw new ConflictError('Dieser Team-Name ist bereits vergeben.');
      }
      throw err;
    }

    await conn.execute(
      "INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'captain')",
      [teamId, captainId ],
    );

    await conn.commit( );

    const [rows ] = await conn.execute(
      `SELECT ${TEAM_COLUMNS} FROM teams WHERE id = ?`,
      [teamId],
    );
    return rows[0];
   } catch (err) {
    await conn.rollback( );
    throw err;
  } finally {
    conn.release( );
  }
}

// get team
async function getTeam(teamId) {
  const teams = await query(`SELECT ${TEAM_COLUMNS} FROM teams WHERE id = ? LIMIT 1`, [teamId]);
  if ( teams.length === 0 ) {
    throw new NotFoundError('Team nicht gefunden.');
  }
  const members = await query(
    `SELECT tm.user_id, u.username, tm.role, tm.joined_at
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = ?
      ORDER BY (tm.role = 'captain') DESC, tm.joined_at ASC, tm.id ASC`,
    [teamId],
  );
  return { ...teams[0],  members  };
}

// add member
async function addMember( teamId, username, actingUserId ) {
  const teams = await query('SELECT id, captain_id FROM teams WHERE id = ? LIMIT 1', [teamId]);
  if ( teams.length === 0) {
    throw new NotFoundError('Team nicht gefunden.');
  }
  if (teams[0].captain_id !== actingUserId) {
    throw new ForbiddenError('Nur der Team-Captain kann Mitglieder hinzufügen.');
  }

  const users = await query('SELECT id, username FROM users WHERE username = ? LIMIT 1',  [
    username,
  ]);
  if ( users.length === 0) {
    throw new NotFoundError('Benutzer nicht gefunden.');
   }
  const user = users[0 ];

  try {
    const result = await query(
      "INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'member')",
      [teamId, user.id ],
    );
    const rows = await query(
      'SELECT user_id, role, joined_at FROM team_members WHERE id = ?',
      [result.insertId],
    );
    return {
      user_id: user.id,
      username: user.username,
      role: rows[0].role,
      joined_at: rows[ 0 ].joined_at,
    };
  } catch (err ) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      throw new ConflictError('Dieser Benutzer ist bereits Mitglied des Teams.');
    }
    throw err;
  }
}

// list my teams
async function listMyTeams(userId) {
  return query(
    `SELECT t.id, t.name, t.tag, t.game, tm.role
       FROM team_members tm
       JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = ?
      ORDER BY t.created_at DESC, t.id DESC`,
    [userId ],
  );
}

module.exports = {  createTeam, getTeam,  addMember,  listMyTeams };
