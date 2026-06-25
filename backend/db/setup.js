/**
 * @file Database bootstrap script (`npm run db:setup`).
 *
 * Idempotent: connects WITHOUT selecting a database, runs `CREATE DATABASE IF
 * NOT EXISTS`, then replays `schema.sql` (which drops + recreates every table)
 * and `seed.sql`. Finally it bcrypt-hashes the `ADMIN_BOOTSTRAP` password and
 * UPDATEs the seeded `admin` user so the placeholder hash is never usable.
 *
 * Safe to run repeatedly — each run yields the same clean, seeded database.
 *
 * @module db/setup
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

/** Cost factor for bcrypt hashing of the admin password. */
const BCRYPT_ROUNDS = 10;

/**
 * Read a `.sql` file from this directory.
 * @param {string} file - File name, e.g. 'schema.sql'.
 * @returns {string} File contents.
 */
function readSql(file) {
  return fs.readFileSync(path.join(__dirname, file), 'utf8');
}

/**
 * Run the full setup sequence and exit with code 0 on success, 1 on failure.
 * @returns {Promise<void>}
 */
async function main() {
  const { host, port, user, password, database } = config.db;
  console.log(`[db:setup] Connecting to ${user}@${host}:${port} …`);

  // 1) Connect WITHOUT a database so we can create it.
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  try {
    // 2) Ensure the database exists, then select it.
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` ` +
        `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`[db:setup] Database \`${database}\` is ready.`);
    await conn.changeUser({ database });

    // 3) Schema (drops + recreates all tables — re-runnable).
    console.log('[db:setup] Applying schema.sql …');
    await conn.query(readSql('schema.sql'));
    console.log('[db:setup] Schema applied.');

    // 4) Seed data.
    console.log('[db:setup] Loading seed.sql …');
    await conn.query(readSql('seed.sql'));
    console.log('[db:setup] Seed data inserted.');

    // 5) Hash the admin password and replace the placeholder.
    const adminHash = await bcrypt.hash(config.adminBootstrap, BCRYPT_ROUNDS);
    const [res] = await conn.execute(
      'UPDATE users SET password_hash = ? WHERE username = ? AND role = ?',
      [adminHash, 'admin', 'staff'],
    );
    console.log(
      `[db:setup] Admin password set (${res.affectedRows} row updated). ` +
        "Login: admin / <ADMIN_BOOTSTRAP, default 'admin123'>.",
    );

    console.log('[db:setup] Done. ✅');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('[db:setup] FAILED:', err.message);
  process.exitCode = 1;
});
