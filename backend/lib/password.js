/**
 * @file Password hashing helpers (bcryptjs).
 *
 * A thin, dependency-isolating wrapper around `bcryptjs` so the rest of the app
 * never imports the crypto library directly. Hashing is intentionally async
 * (uses the salted, work-factored bcrypt algorithm) and verification is
 * constant-time via `bcrypt.compare`.
 *
 * @module lib/password
 */

'use strict';

const bcrypt = require('bcryptjs');

/**
 * The bcrypt cost factor. 10 rounds is the library default — a sensible
 * security/latency trade-off for an interactive login flow.
 * @type {number}
 */
const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password for storage in `users.password_hash`.
 *
 * @param {string} plain - The user's plaintext password.
 * @returns {Promise<string>} The bcrypt hash (safe to persist; never log it).
 */
function hash(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 *
 * @param {string} plain - The candidate plaintext password.
 * @param {string} hashed - The stored bcrypt hash.
 * @returns {Promise<boolean>} `true` when the password matches.
 */
function verify(plain, hashed) {
  if (typeof plain !== 'string' || typeof hashed !== 'string' || hashed === '') {
    return Promise.resolve(false);
  }
  return bcrypt.compare(plain, hashed);
}

module.exports = { hash, verify, SALT_ROUNDS };
