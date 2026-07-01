// db pool

'use strict';

const mysql = require('mysql2/promise');
const config = require('../config/env');

// pool
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

// query helpers
async function query(sql, params = [ ]) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

function getConnection() {
  return pool.getConnection();
}

// health check
async function ping( ) {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1' );
    return true;
  } finally {
    conn.release();
  }
}

module.exports = {  pool, query,  getConnection, ping };
