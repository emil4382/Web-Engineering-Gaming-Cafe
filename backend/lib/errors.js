/**
 * @file Typed application errors.
 *
 * Every error thrown by the service/controller/validator layers is one of these
 * classes. They carry the three properties the central `errorHandler` in
 * `server.js` reads — `status`, `code` and (optionally) `fields` — so a thrown
 * error becomes the project envelope `{ error: { code, message, fields? } }`
 * with the correct HTTP status, with zero per-route mapping.
 *
 * @module lib/errors
 */

'use strict';

/**
 * Base class for all expected (operational) HTTP errors. Anything that is NOT
 * an `AppError` is treated by the handler as an unexpected `500`.
 */
class AppError extends Error {
  /**
   * @param {number} status - HTTP status code (e.g. 400, 401, 404, 409).
   * @param {string} code - Stable machine string (e.g. `'not_found'`).
   * @param {string} message - Human-readable message (German for user flows).
   * @param {Object<string,string>} [fields] - Optional per-field messages (400 only).
   */
  constructor(status, code, message, fields) {
    super(message);
    this.name = this.constructor.name;
    /** @type {number} */
    this.status = status;
    /** @type {string} */
    this.code = code;
    if (fields && typeof fields === 'object') {
      /** @type {Object<string,string>} */
      this.fields = fields;
    }
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/** `400` — request failed validation; always carries `fields`. */
class ValidationError extends AppError {
  /**
   * @param {Object<string,string>} fields - `{ <field>: <German message> }`.
   * @param {string} [message] - Summary message.
   */
  constructor(fields, message = 'Bitte überprüfe deine Eingaben.') {
    super(400, 'validation_error', message, fields);
  }
}

/** `401` — no/invalid session. */
class UnauthenticatedError extends AppError {
  /** @param {string} [message] */
  constructor(message = 'Bitte melde dich an.') {
    super(401, 'unauthenticated', message);
  }
}

/** `403` — authenticated but lacking the required role/ownership. */
class ForbiddenError extends AppError {
  /** @param {string} [message] */
  constructor(message = 'Keine Berechtigung für diese Aktion.') {
    super(403, 'forbidden', message);
  }
}

/** `404` — resource not found. */
class NotFoundError extends AppError {
  /** @param {string} [message] */
  constructor(message = 'Nicht gefunden.') {
    super(404, 'not_found', message);
  }
}

/** `409` — conflict (duplicate, booked slot, full/duplicate registration). */
class ConflictError extends AppError {
  /** @param {string} [message] */
  constructor(message = 'Konflikt: Die Ressource ist bereits belegt.') {
    super(409, 'conflict', message);
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthenticatedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
