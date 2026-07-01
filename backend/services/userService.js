// user service

'use strict';

const { query  } = require('../db/pool');
const password = require('../lib/password');
const { ConflictError } = require('../lib/errors');

const PUBLIC_COLUMNS = 'id, username, role, created_at';

// username check
async function isUsernameTaken(username ) {
  const rows = await query('SELECT 1 FROM users WHERE username = ? LIMIT 1', [username]);
  return rows.length > 0;
}

// create user
async function createUser(username, plainPassword) {
  if (await isUsernameTaken(username )) {
    throw new ConflictError('Benutzername ist bereits vergeben.' );
  }

  const passwordHash = await password.hash(plainPassword );

  let result;
  try {
    result = await query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash],
    );
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      throw new ConflictError('Benutzername ist bereits vergeben.' );
     }
    throw err;
  }

  return findById(result.insertId);
}

// authenticate
async function authenticate(username, plainPassword) {
  const rows = await query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE username = ? LIMIT 1`,
    [username],
   );
  const row = rows[ 0 ];
  const ok = await password.verify(plainPassword, row ? row.password_hash : '');
  if ( !row || !ok ) {
    return null;
  }
  const { password_hash, ...publicUser } = row;
  return publicUser;
}

// lookup
async function findById(id) {
  const rows = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ? LIMIT 1`,  [id]);
  return rows[0] || null;
}

module.exports = {
  isUsernameTaken,
  createUser,
  authenticate,
  findById,
};
