/**
 * @file User accounts service — the only module that touches the `users` table.
 *
 * Owns account creation (with bcrypt hashing), credential verification and
 * lookups. All SQL is parameterized through the shared pool. The returned user
 * objects NEVER include `password_hash`; callers expose them directly.
 *
 * @module services/userService
 */

'use strict';

const { query } = require('../db/pool');
const password = require('../lib/password');
const { ConflictError } = require('../lib/errors');

/**
 * @typedef {Object} PublicUser
 * @property {number} id - Primary key.
 * @property {string} username - Unique handle.
 * @property {'user'|'staff'} role - Authorization role.
 * @property {string} created_at - `YYYY-MM-DD HH:MM:SS` (dateStrings pool).
 */

/** Columns that make up a {@link PublicUser} — never selects `password_hash`. */
const PUBLIC_COLUMNS = 'id, username, role, created_at';

/**
 * Whether a username is already taken (case-sensitively, per the UNIQUE index).
 *
 * @param {string} username - The candidate username.
 * @returns {Promise<boolean>} `true` if a row with this username exists.
 */
async function isUsernameTaken(username) {
  const rows = await query('SELECT 1 FROM users WHERE username = ? LIMIT 1', [username]);
  return rows.length > 0;
}

/**
 * Create a new account: hashes the password and inserts the row.
 *
 * Pre-checks the username for a friendly `409`, and ALSO relies on the UNIQUE
 * index (`ER_DUP_ENTRY`) to close the check-then-insert race — both paths throw
 * a {@link ConflictError}.
 *
 * @param {string} username - Already-validated username.
 * @param {string} plainPassword - Already-validated plaintext password.
 * @returns {Promise<PublicUser>} The created user, without `password_hash`.
 * @throws {ConflictError} If the username is taken (409).
 */
async function createUser(username, plainPassword) {
  if (await isUsernameTaken(username)) {
    throw new ConflictError('Benutzername ist bereits vergeben.');
  }

  const passwordHash = await password.hash(plainPassword);

  let result;
  try {
    result = await query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash],
    );
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      throw new ConflictError('Benutzername ist bereits vergeben.');
    }
    throw err;
  }

  return findById(result.insertId);
}

/**
 * Verify credentials and return the user on success.
 *
 * Always runs the bcrypt comparison shape (the helper short-circuits safely when
 * no user is found) to avoid leaking, via timing, whether the username exists.
 *
 * @param {string} username - The submitted username.
 * @param {string} plainPassword - The submitted plaintext password.
 * @returns {Promise<PublicUser|null>} The user without `password_hash`, or `null`
 *   when the username is unknown or the password does not match.
 */
async function authenticate(username, plainPassword) {
  const rows = await query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE username = ? LIMIT 1`,
    [username],
  );
  const row = rows[0];
  const ok = await password.verify(plainPassword, row ? row.password_hash : '');
  if (!row || !ok) {
    return null;
  }
  // Strip the hash before returning.
  const { password_hash, ...publicUser } = row;
  return publicUser;
}

/**
 * Look up a user by id.
 *
 * @param {number} id - The user id.
 * @returns {Promise<PublicUser|null>} The user without `password_hash`, or `null`.
 */
async function findById(id) {
  const rows = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

module.exports = {
  isUsernameTaken,
  createUser,
  authenticate,
  findById,
};
