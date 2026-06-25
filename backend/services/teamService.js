/**
 * @file Team service — create teams, manage rosters, list a user's teams.
 *
 * `createTeam` inserts the team and the creator as `captain` in `team_members`
 * inside a transaction (the two writes must succeed together). `addMember`
 * resolves a username to a user id and adds them as `member` (captain-only;
 * enforced via the loaded team's `captain_id`). `listMyTeams` returns the teams
 * the session user belongs to. Duplicate name / duplicate membership surface as
 * `409` (UNIQUE → `ER_DUP_ENTRY`); unknown ids/users as `404`.
 *
 * @module services/teamService
 */

'use strict';

const { query, getConnection } = require('../db/pool');
const { NotFoundError, ConflictError, ForbiddenError } = require('../lib/errors');

/** Columns returned for a team (mirrors the contract team object). */
const TEAM_COLUMNS = 'id, name, tag, game, captain_id, created_at';

/**
 * Create a team and enrol the creator as its captain.
 *
 * @param {Object} input - Validated team input.
 * @param {string} input.name - Team name (UNIQUE).
 * @param {?string} input.tag - Short tag (nullable).
 * @param {string} input.game - One of `valorant` | `lol` | `cs`.
 * @param {number} captainId - The creating user's id.
 * @returns {Promise<Object>} The created team `{ id, name, tag, game, captain_id, created_at }`.
 * @throws {ConflictError} If the team name is already taken.
 */
async function createTeam(input, captainId) {
  const { name, tag = null, game } = input;
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    let teamId;
    try {
      const [result] = await conn.execute(
        'INSERT INTO teams (name, tag, game, captain_id) VALUES (?, ?, ?, ?)',
        [name, tag, game, captainId],
      );
      teamId = result.insertId;
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        throw new ConflictError('Dieser Team-Name ist bereits vergeben.');
      }
      throw err;
    }

    await conn.execute(
      "INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'captain')",
      [teamId, captainId],
    );

    await conn.commit();

    const [rows] = await conn.execute(
      `SELECT ${TEAM_COLUMNS} FROM teams WHERE id = ?`,
      [teamId],
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
 * Load a team by id with its members, or throw `404`.
 *
 * @param {number} teamId - Team id.
 * @returns {Promise<Object>} `{ …team, members: [{ user_id, username, role, joined_at }] }`.
 * @throws {NotFoundError} If the team does not exist.
 */
async function getTeam(teamId) {
  const teams = await query(`SELECT ${TEAM_COLUMNS} FROM teams WHERE id = ? LIMIT 1`, [teamId]);
  if (teams.length === 0) {
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
  return { ...teams[0], members };
}

/**
 * Add a user (by username) to a team as `member`. Only the team captain may do
 * this.
 *
 * @param {number} teamId - Target team id.
 * @param {string} username - Username of the user to add.
 * @param {number} actingUserId - The session user performing the action.
 * @returns {Promise<{user_id:number,username:string,role:'member',joined_at:string}>}
 * @throws {NotFoundError} If the team or the named user does not exist.
 * @throws {ForbiddenError} If the acting user is not the team's captain.
 * @throws {ConflictError} If the user is already a member.
 */
async function addMember(teamId, username, actingUserId) {
  const teams = await query('SELECT id, captain_id FROM teams WHERE id = ? LIMIT 1', [teamId]);
  if (teams.length === 0) {
    throw new NotFoundError('Team nicht gefunden.');
  }
  if (teams[0].captain_id !== actingUserId) {
    throw new ForbiddenError('Nur der Team-Captain kann Mitglieder hinzufügen.');
  }

  const users = await query('SELECT id, username FROM users WHERE username = ? LIMIT 1', [
    username,
  ]);
  if (users.length === 0) {
    throw new NotFoundError('Benutzer nicht gefunden.');
  }
  const user = users[0];

  try {
    const result = await query(
      "INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'member')",
      [teamId, user.id],
    );
    const rows = await query(
      'SELECT user_id, role, joined_at FROM team_members WHERE id = ?',
      [result.insertId],
    );
    return {
      user_id: user.id,
      username: user.username,
      role: rows[0].role,
      joined_at: rows[0].joined_at,
    };
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      throw new ConflictError('Dieser Benutzer ist bereits Mitglied des Teams.');
    }
    throw err;
  }
}

/**
 * List the teams a user belongs to, with that user's role in each.
 *
 * @param {number} userId - The session user's id.
 * @returns {Promise<Array<{id:number,name:string,tag:?string,game:string,role:string}>>}
 */
async function listMyTeams(userId) {
  return query(
    `SELECT t.id, t.name, t.tag, t.game, tm.role
       FROM team_members tm
       JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = ?
      ORDER BY t.created_at DESC, t.id DESC`,
    [userId],
  );
}

module.exports = { createTeam, getTeam, addMember, listMyTeams };
