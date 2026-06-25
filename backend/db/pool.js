/**
 * @file MySQL connection pool and parameterized query helpers.
 *
 * Exposes a shared `mysql2/promise` pool built from the validated config, a
 * `query(sql, params)` helper that ALWAYS uses prepared/parameterized
 * statements (never string interpolation), and a `ping()` health check used at
 * boot to warn — but not crash — when the database is unreachable.
 *
 * @module db/pool
 */

'use strict';

const mysql = require('mysql2/promise');
const config = require('../config/env');

/**
 * The shared connection pool. `multipleStatements` is left OFF here on purpose
 * (the setup script opens its own connection with it enabled) to keep the
 * runtime surface minimal and reduce SQL-injection blast radius.
 * @type {import('mysql2/promise').Pool}
 */
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
  charset: 'utf8mb4',
  dateStrings: true,
});

/**
 * Run a parameterized SQL statement and return the rows (or result metadata).
 *
 * @template T
 * @param {string} sql - SQL with `?` (or `:name`) placeholders. Never inline values.
 * @param {Array<*>|Object<string,*>} [params=[]] - Values bound to the placeholders.
 * @returns {Promise<T>} The rows for SELECTs, or the OkPacket for writes.
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Acquire a dedicated connection (for transactions). Caller MUST `release()`.
 * @returns {Promise<import('mysql2/promise').PoolConnection>}
 */
function getConnection() {
  return pool.getConnection();
}

/**
 * Verify the database is reachable.
 * @returns {Promise<boolean>} `true` if a `SELECT 1` round-trip succeeds.
 */
async function ping() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
    return true;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, getConnection, ping };
