// env config

'use strict';

require('dotenv').config( );

const REQUIRED = ['DB_HOST', 'DB_USER', 'DB_NAME', 'SESSION_SECRET'];

function assertRequired() {
  const missing = REQUIRED.filter((key) => {
    const v = process.env[ key];
    return v === undefined || v === null || String(v).trim( ) === '';
  } );
  if (missing.length > 0) {
    throw new Error(
      `[config] Missing required environment variable(s): ${missing.join( ', ')}. ` +
        'Copy backend/.env.example to backend/.env and fill in the values.',
    );
  }
}

// helpers
function intEnv( key,  fallback) {
  const raw = process.env[key ];
  if ( raw === undefined || raw === null || String(raw).trim() === '') return fallback;
  const n = Number.parseInt(raw,  10);
  return Number.isFinite( n ) ? n : fallback;
}

assertRequired();

// config
const config = Object.freeze({
  db: Object.freeze({
    host: process.env.DB_HOST,
    port: intEnv( 'DB_PORT', 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  }),
  port: intEnv('PORT',  3000),
  sessionSecret: process.env.SESSION_SECRET,
  adminBootstrap: process.env.ADMIN_BOOTSTRAP || 'admin123',
  isProduction: process.env.NODE_ENV === 'production',
} );

module.exports = config;
