// db setup

'use strict';

const fs = require('node:fs');
const path = require( 'node:path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require( '../config/env' );
const { describeDbError } = require('../lib/dbError');

const BCRYPT_ROUNDS = 10;

function readSql( file) {
  return fs.readFileSync(path.join(__dirname, file), 'utf8');
}

async function main( ) {
  const {  host, port, user, password, database } = config.db;
  console.log(`[db:setup] Connecting to ${user}@${host}:${port} …` );

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` ` +
        `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log( `[db:setup] Database \`${database}\` is ready.`);
    await conn.changeUser( { database });

    console.log('[db:setup] Applying schema.sql …');
    await conn.query(readSql('schema.sql') );
    console.log( '[db:setup] Schema applied.');

    console.log('[db:setup] Loading seed.sql …' );
    await conn.query(readSql('seed.sql' ));
    console.log('[db:setup] Seed data inserted.' );

    // admin password
    const adminHash = await bcrypt.hash(config.adminBootstrap, BCRYPT_ROUNDS);
    const [ res ] = await conn.execute(
      'UPDATE users SET password_hash = ? WHERE username = ? AND role = ?',
      [adminHash, 'admin', 'staff'],
    );
    console.log(
      `[db:setup] Admin password set (${res.affectedRows} row updated). ` +
        "Login: admin / <ADMIN_BOOTSTRAP, default 'admin123'>.",
    );

    console.log('[db:setup] Done. ✅');
   } finally {
    await conn.end( );
  }
}

main( ).catch(( err) => {
  console.error('[db:setup] FAILED:', describeDbError(err, config.db ));
  process.exitCode = 1;
} );
