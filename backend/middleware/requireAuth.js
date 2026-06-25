/**
 * @file `requireAuth` — gate routes behind an authenticated session.
 *
 * Reads the user id stored on the session (`req.session.userId`), loads the
 * matching account, and attaches the public user object to `req.user` so
 * downstream controllers/services can use `req.user.{id,username,role}` without
 * touching the session or the DB again. Rejects with `401 unauthenticated`
 * (via `lib/errors`) when there is no session user, or when the session points
 * at an account that no longer exists (stale session after deletion).
 *
 * Async errors are forwarded to `next` so the central `errorHandler` produces
 * the standard envelope.
 *
 * @module middleware/requireAuth
 */

'use strict';

const { query } = require('../db/pool');
const { UnauthenticatedError } = require('../lib/errors');

/**
 * The public-safe user shape attached to `req.user` (never includes
 * `password_hash`).
 * @typedef {{ id:number, username:string, role:('user'|'staff'), created_at:string }} PublicUser
 */

/**
 * Express middleware that requires an authenticated session.
 *
 * On success it sets `req.user` to the loaded {@link PublicUser} and calls
 * `next()`. On failure it calls `next(UnauthenticatedError)`.
 *
 * @param {import('express').Request & { session?: { userId?: number }, user?: PublicUser }} req
 * @param {import('express').Response} _res - Unused.
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
async function requireAuth(req, _res, next) {
  try {
    const userId = req.session && req.session.userId;
    if (!userId) {
      throw new UnauthenticatedError();
    }

    const rows = await query(
      'SELECT id, username, role, created_at FROM users WHERE id = :id LIMIT 1',
      { id: userId },
    );

    const user = rows[0];
    if (!user) {
      // Session references a deleted account — treat as logged out.
      throw new UnauthenticatedError();
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
