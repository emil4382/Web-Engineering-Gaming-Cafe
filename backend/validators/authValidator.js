/**
 * @file Validation rules for the auth endpoints (register & login).
 *
 * Pure, synchronous validators that return a uniform `{ ok, fields }` result
 * (German per-field messages) so controllers can turn a failure straight into a
 * `400` validation error. No DB access here — uniqueness of the username is a
 * service-layer concern (it produces a `409`, not a `400`).
 *
 * @module validators/authValidator
 */

'use strict';

/** Minimum username length (inclusive). */
const USERNAME_MIN = 3;
/** Maximum username length (inclusive); matches `users.username VARCHAR(40)`. */
const USERNAME_MAX = 40;
/** Minimum password length (inclusive). */
const PASSWORD_MIN = 6;

/**
 * Allowed username characters: letters, digits, underscore, dot and hyphen.
 * Mirrors the playful gamer handles in the seed data (e.g. `xX_ShadowBlade_Xx`).
 * @type {RegExp}
 */
const USERNAME_PATTERN = /^[A-Za-z0-9_.-]+$/;

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} ok - `true` when every field passed.
 * @property {Array<{field:string,message:string}>} fields - One entry per failing field.
 */

/**
 * Validate a username against length and character rules.
 *
 * @param {unknown} username - The raw value from the request body.
 * @returns {string|null} A German error message, or `null` when valid.
 */
function usernameError(username) {
  if (typeof username !== 'string' || username.trim() === '') {
    return 'Benutzername ist erforderlich.';
  }
  const value = username.trim();
  if (value.length < USERNAME_MIN) {
    return `Benutzername muss mindestens ${USERNAME_MIN} Zeichen lang sein.`;
  }
  if (value.length > USERNAME_MAX) {
    return `Benutzername darf höchstens ${USERNAME_MAX} Zeichen lang sein.`;
  }
  if (!USERNAME_PATTERN.test(value)) {
    return 'Benutzername darf nur Buchstaben, Zahlen, _, . und - enthalten.';
  }
  return null;
}

/**
 * Validate a password against the minimum-length rule.
 *
 * @param {unknown} password - The raw value from the request body.
 * @returns {string|null} A German error message, or `null` when valid.
 */
function passwordError(password) {
  if (typeof password !== 'string' || password === '') {
    return 'Passwort ist erforderlich.';
  }
  if (password.length < PASSWORD_MIN) {
    return `Passwort muss mindestens ${PASSWORD_MIN} Zeichen lang sein.`;
  }
  return null;
}

/**
 * Validate a registration payload (username + password, both checked).
 *
 * @param {{username?:unknown, password?:unknown}} body - The request body.
 * @returns {ValidationResult} `{ ok, fields }` with German messages.
 */
function validateRegister(body = {}) {
  const fields = [];
  const u = usernameError(body.username);
  if (u) fields.push({ field: 'username', message: u });
  const p = passwordError(body.password);
  if (p) fields.push({ field: 'password', message: p });
  return { ok: fields.length === 0, fields };
}

/**
 * Validate a login payload. Login only checks presence (the credentials are
 * verified against the store; a too-short stored password must still be allowed
 * to log in), so wrong values yield `401`, not `400`.
 *
 * @param {{username?:unknown, password?:unknown}} body - The request body.
 * @returns {ValidationResult} `{ ok, fields }` with German messages.
 */
function validateLogin(body = {}) {
  const fields = [];
  if (typeof body.username !== 'string' || body.username.trim() === '') {
    fields.push({ field: 'username', message: 'Benutzername ist erforderlich.' });
  }
  if (typeof body.password !== 'string' || body.password === '') {
    fields.push({ field: 'password', message: 'Passwort ist erforderlich.' });
  }
  return { ok: fields.length === 0, fields };
}

module.exports = {
  USERNAME_MIN,
  USERNAME_MAX,
  PASSWORD_MIN,
  USERNAME_PATTERN,
  usernameError,
  passwordError,
  validateRegister,
  validateLogin,
};
