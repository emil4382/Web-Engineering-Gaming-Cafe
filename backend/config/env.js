/**
 * @file Loads, validates and exports the typed runtime configuration.
 *
 * Reads environment variables (via `dotenv`), fails fast with a clear error if
 * a required variable is missing, and exposes a single frozen `config` object
 * so the rest of the app never touches `process.env` directly.
 *
 * @module config/env
 */

'use strict';

require('dotenv').config();

/**
 * Variables that MUST be present for the server to operate correctly.
 * `DB_PASSWORD` is intentionally NOT required (local MySQL/MariaDB installs
 * often run with an empty root password).
 * @type {string[]}
 */
const REQUIRED = ['DB_HOST', 'DB_USER', 'DB_NAME', 'SESSION_SECRET'];

/**
 * Assert that every required variable is set and non-empty.
 * @throws {Error} Listing all missing variables at once.
 */
function assertRequired() {
  const missing = REQUIRED.filter((key) => {
    const v = process.env[key];
    return v === undefined || v === null || String(v).trim() === '';
  });
  if (missing.length > 0) {
    throw new Error(
      `[config] Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy backend/.env.example to backend/.env and fill in the values.',
    );
  }
}

/**
 * Parse an integer env var, falling back to a default on absent/invalid input.
 * @param {string} key - Environment variable name.
 * @param {number} fallback - Value used when unset or not a finite integer.
 * @returns {number} The parsed integer or the fallback.
 */
function intEnv(key, fallback) {
  const raw = process.env[key];
  if (raw === undefined || raw === null || String(raw).trim() === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

assertRequired();

/**
 * The typed, immutable application configuration.
 * @type {{
 *   db: { host: string, port: number, user: string, password: string, database: string },
 *   port: number,
 *   sessionSecret: string,
 *   adminBootstrap: string,
 *   isProduction: boolean
 * }}
 */
const config = Object.freeze({
  db: Object.freeze({
    host: process.env.DB_HOST,
    port: intEnv('DB_PORT', 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  }),
  port: intEnv('PORT', 3000),
  sessionSecret: process.env.SESSION_SECRET,
  adminBootstrap: process.env.ADMIN_BOOTSTRAP || 'admin123',
  isProduction: process.env.NODE_ENV === 'production',
});

module.exports = config;
