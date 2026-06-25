/**
 * @file `requireStaff` — gate routes behind the `staff` role.
 *
 * Runs {@link module:middleware/requireAuth} first (so `req.user` is loaded and
 * a missing session yields `401`), then enforces `req.user.role === 'staff'`,
 * rejecting non-staff accounts with `403 forbidden` (via `lib/errors`).
 *
 * Exposed as a single middleware so routes can simply
 * `router.post('/', requireStaff, controller…)` without chaining two guards.
 *
 * @module middleware/requireStaff
 */

'use strict';

const requireAuth = require('./requireAuth');
const { ForbiddenError } = require('../lib/errors');

/**
 * Express middleware that requires an authenticated **staff** user.
 *
 * Delegates to {@link requireAuth}; only if authentication succeeds does it
 * check the role. A non-staff user receives `403 forbidden`.
 *
 * @param {import('express').Request & { user?: { role?: string } }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
function requireStaff(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) {
      // Authentication failed (401) or DB lookup errored — propagate as-is.
      return next(err);
    }
    if (!req.user || req.user.role !== 'staff') {
      return next(new ForbiddenError('Diese Aktion ist dem Personal vorbehalten.'));
    }
    next();
  });
}

module.exports = requireStaff;
module.exports.requireStaff = requireStaff;
