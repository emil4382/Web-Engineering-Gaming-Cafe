/**
 * @file Unit tests for the pure request validators.
 *
 * Covers `validators/bookingValidator.js` (throws a `ValidationError` with a
 * `fields` map) and `validators/authValidator.js` (returns `{ ok, fields }`).
 * Both are pure input validation and MUST NOT touch the DB at import — these
 * tests `require` them directly, which would fail if importing had side effects.
 *
 * @module test/validator
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateCreateBooking,
  validateUpdateBooking,
  isRealDate,
  PATCHABLE_STATUSES,
} = require('../validators/bookingValidator');
const authValidator = require('../validators/authValidator');
const { ValidationError } = require('../lib/errors');

/** A complete, valid booking body reused across cases. */
const VALID_BOOKING = Object.freeze({
  code: 'B5',
  date: '2026-06-26',
  time: '18:00',
  tarif: 'starter',
  name: 'Max Mustermann',
  email: 'max@example.com',
});

/* -------------------------- booking: happy paths -------------------------- */

test('validateCreateBooking: accepts and normalises a valid body', () => {
  const out = validateCreateBooking({ ...VALID_BOOKING, code: 'b5' });
  assert.deepEqual(out, {
    code: 'B5', // upper-cased
    date: '2026-06-26',
    time: '18:00',
    tarif: 'starter',
    name: 'Max Mustermann',
    email: 'max@example.com',
  });
});

test('validateCreateBooking: email is optional and becomes null when absent', () => {
  const { email: _omit, ...noEmail } = VALID_BOOKING;
  assert.equal(validateCreateBooking(noEmail).email, null);
  assert.equal(validateCreateBooking({ ...noEmail, email: '' }).email, null);
  assert.equal(validateCreateBooking({ ...noEmail, email: '  ' }).email, null);
});

test('validateCreateBooking: trims surrounding whitespace on the name', () => {
  const out = validateCreateBooking({ ...VALID_BOOKING, name: '  Max  ' });
  assert.equal(out.name, 'Max');
});

/* -------------------------- booking: error paths -------------------------- */

/**
 * Run the validator and return the thrown `ValidationError` for inspection.
 * @param {Object} body - The booking body.
 * @returns {ValidationError} The error thrown.
 */
function bookingError(body) {
  try {
    validateCreateBooking(body);
  } catch (err) {
    return err;
  }
  throw new assert.AssertionError({ message: 'expected validateCreateBooking to throw' });
}

test('validateCreateBooking: empty body reports every required field', () => {
  const err = bookingError({});
  assert.ok(err instanceof ValidationError);
  assert.equal(err.status, 400);
  assert.equal(err.code, 'validation_error');
  assert.deepEqual(Object.keys(err.fields).sort(), ['code', 'date', 'name', 'tarif', 'time']);
});

test('validateCreateBooking: rejects a malformed seat code', () => {
  const err = bookingError({ ...VALID_BOOKING, code: '!!' });
  assert.ok(err.fields.code);
});

test('validateCreateBooking: rejects an impossible calendar date', () => {
  const err = bookingError({ ...VALID_BOOKING, date: '2026-02-30' });
  assert.ok(err.fields.date);
});

test('validateCreateBooking: rejects a time that is not an offered slot', () => {
  const err = bookingError({ ...VALID_BOOKING, time: '17:30' });
  assert.ok(err.fields.time);
});

test('validateCreateBooking: rejects an unknown tariff', () => {
  const err = bookingError({ ...VALID_BOOKING, tarif: 'platinum' });
  assert.ok(err.fields.tarif);
});

test('validateCreateBooking: rejects an invalid email when one is supplied', () => {
  const err = bookingError({ ...VALID_BOOKING, email: 'not-an-email' });
  assert.ok(err.fields.email);
});

test('validateCreateBooking: rejects a name longer than 80 chars', () => {
  const err = bookingError({ ...VALID_BOOKING, name: 'x'.repeat(81) });
  assert.ok(err.fields.name);
});

/* ----------------------------- booking: PATCH ----------------------------- */

test('validateUpdateBooking: accepts each patchable status', () => {
  for (const status of PATCHABLE_STATUSES) {
    assert.deepEqual(validateUpdateBooking({ status }), { status });
  }
});

test('validateUpdateBooking: rejects an unknown status', () => {
  assert.throws(() => validateUpdateBooking({ status: 'pending' }), ValidationError);
  assert.throws(() => validateUpdateBooking({}), ValidationError);
});

/* ----------------------------- isRealDate --------------------------------- */

test('isRealDate: distinguishes real from impossible dates', () => {
  assert.equal(isRealDate('2026-06-26'), true);
  assert.equal(isRealDate('2024-02-29'), true, 'leap day');
  assert.equal(isRealDate('2026-02-29'), false, 'not a leap year');
  assert.equal(isRealDate('2026-13-01'), false);
  assert.equal(isRealDate('2026-00-10'), false);
});

/* ------------------------------ auth: register ---------------------------- */

test('validateRegister: accepts valid credentials', () => {
  const res = authValidator.validateRegister({ username: 'NeonFury99', password: 'secret123' });
  assert.equal(res.ok, true);
  assert.deepEqual(res.fields, []);
});

test('validateRegister: allows the playful seed-style handle', () => {
  const res = authValidator.validateRegister({
    username: 'xX_ShadowBlade_Xx',
    password: 'hunter2!',
  });
  assert.equal(res.ok, true);
});

test('validateRegister: flags a missing username and password', () => {
  const res = authValidator.validateRegister({});
  assert.equal(res.ok, false);
  const flagged = res.fields.map((f) => f.field).sort();
  assert.deepEqual(flagged, ['password', 'username']);
});

test('validateRegister: rejects too-short username and password', () => {
  const res = authValidator.validateRegister({ username: 'ab', password: '123' });
  assert.equal(res.ok, false);
  assert.ok(res.fields.some((f) => f.field === 'username'));
  assert.ok(res.fields.some((f) => f.field === 'password'));
});

test('validateRegister: rejects forbidden characters in the username', () => {
  const res = authValidator.validateRegister({ username: 'bad name!', password: 'secret123' });
  assert.equal(res.ok, false);
  assert.ok(res.fields.some((f) => f.field === 'username'));
});

test('validateRegister: rejects a username over the 40-char column limit', () => {
  const res = authValidator.validateRegister({ username: 'a'.repeat(41), password: 'secret123' });
  assert.equal(res.ok, false);
  assert.ok(res.fields.some((f) => f.field === 'username'));
});

/* ------------------------------- auth: login ------------------------------ */

test('validateLogin: only checks presence (short stored passwords may log in)', () => {
  const ok = authValidator.validateLogin({ username: 'neo', password: 'x' });
  assert.equal(ok.ok, true, 'login does not enforce min length');
});

test('validateLogin: flags missing username/password', () => {
  const res = authValidator.validateLogin({ username: '', password: '' });
  assert.equal(res.ok, false);
  assert.deepEqual(res.fields.map((f) => f.field).sort(), ['password', 'username']);
});

/* -------------------------- auth: field-level helpers --------------------- */

test('usernameError / passwordError: return null when valid, a message when not', () => {
  assert.equal(authValidator.usernameError('valid_name'), null);
  assert.equal(authValidator.passwordError('longenough'), null);
  assert.equal(typeof authValidator.usernameError('a'), 'string');
  assert.equal(typeof authValidator.passwordError('123'), 'string');
});

test('auth validators import with no DB side effects (pure require)', () => {
  // Re-requiring must be safe and synchronous; if importing touched the DB this
  // module would have thrown at the top-level require above.
  const fresh = require('../validators/authValidator');
  assert.equal(typeof fresh.validateRegister, 'function');
  assert.equal(typeof fresh.validateLogin, 'function');
});
