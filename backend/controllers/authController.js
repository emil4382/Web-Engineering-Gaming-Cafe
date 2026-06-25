/**
 * @file Auth controllers — register, login, logout and the session probe.
 *
 * Controllers are thin: they parse/validate the request, call the service, set
 * the session, and shape the response. Async errors are surfaced by wrapping the
 * handlers with {@link asyncHandler}, so they reach the central `errorHandler`.
 *
 * The session stores both `req.session.userId` (the canonical id used by the
 * auth middleware) and a cached `req.session.user` object, so `GET /me` can
 * answer without a DB round-trip and the role guards keep working.
 *
 * @module controllers/authController
 */

'use strict';

const userService = require('../services/userService');
const { validateRegister, validateLogin } = require('../validators/authValidator');
const { asyncHandler } = require('../lib/asyncHandler');
const { ValidationError, UnauthenticatedError } = require('../lib/errors');

/**
 * Convert the validator's `[{field,message}]` array into the `{ field: message }`
 * map the error envelope expects.
 *
 * @param {Array<{field:string,message:string}>} list - Validator field errors.
 * @returns {Object<string,string>} Map keyed by field name.
 */
function toFieldMap(list) {
  const map = {};
  for (const { field, message } of list) {
    if (!(field in map)) map[field] = message;
  }
  return map;
}

/**
 * Persist the authenticated user onto the session.
 *
 * @param {import('express').Request} req - The request whose session is updated.
 * @param {import('../services/userService').PublicUser} user - The logged-in user.
 * @returns {void}
 */
function establishSession(req, user) {
  req.session.userId = user.id;
  req.session.user = user;
}

/**
 * `POST /api/auth/register` — create an account and log the user in.
 *
 * `201` → `{ user }` (without `password_hash`); `400` with `fields` on invalid
 * input; `409` when the username is taken (thrown by the service).
 *
 * @type {import('express').RequestHandler}
 */
const register = asyncHandler(async (req, res) => {
  const { ok, fields } = validateRegister(req.body || {});
  if (!ok) {
    throw new ValidationError(toFieldMap(fields));
  }

  const username = String(req.body.username).trim();
  const user = await userService.createUser(username, req.body.password);

  establishSession(req, user);
  res.status(201).json({ user });
});

/**
 * `POST /api/auth/login` — verify credentials and start a session.
 *
 * `200` → `{ user }`; `400` if username/password missing; `401` on bad creds.
 *
 * @type {import('express').RequestHandler}
 */
const login = asyncHandler(async (req, res) => {
  const { ok, fields } = validateLogin(req.body || {});
  if (!ok) {
    throw new ValidationError(toFieldMap(fields));
  }

  const username = String(req.body.username).trim();
  const user = await userService.authenticate(username, req.body.password);
  if (!user) {
    throw new UnauthenticatedError('Benutzername oder Passwort ist falsch.');
  }

  establishSession(req, user);
  res.status(200).json({ user });
});

/**
 * `POST /api/auth/logout` — destroy the session and clear the cookie.
 *
 * Always responds `204` (idempotent: logging out when already logged out is a
 * no-op success).
 *
 * @type {import('express').RequestHandler}
 */
const logout = asyncHandler(async (req, res, next) => {
  if (!req.session) {
    res.status(204).end();
    return;
  }
  req.session.destroy((err) => {
    if (err) {
      next(err);
      return;
    }
    res.clearCookie('pixelforge.sid');
    res.status(204).end();
  });
});

/**
 * `GET /api/auth/me` — report the current session user.
 *
 * `200` → `{ user }` when logged in, else `{ user: null }`. Never errors with
 * `401` so the frontend can probe the session cheaply.
 *
 * @type {import('express').RequestHandler}
 */
const me = asyncHandler(async (req, res) => {
  const user = (req.session && req.session.user) || null;
  res.status(200).json({ user });
});

module.exports = { register, login, logout, me };
