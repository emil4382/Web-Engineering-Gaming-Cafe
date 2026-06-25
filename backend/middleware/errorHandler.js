/**
 * @file Central Express error-handling middleware.
 *
 * Normalises every thrown or forwarded error into the project's single error
 * envelope and maps it to the correct HTTP status:
 *
 * ```json
 * { "error": { "code": "validation_error", "message": "…", "fields": { … } } }
 * ```
 *
 * Sources of truth for `status`/`code`:
 *   - `lib/errors` instances (`AppError` subclasses) carry `.status`, `.code`
 *     and optionally `.fields`.
 *   - MySQL duplicate-key violations (`ER_DUP_ENTRY`) are mapped to `409`.
 *   - Anything else is treated as an unexpected `500` with a generic message;
 *     the real error is logged server-side but never sent to the client.
 *
 * The stack is never included in the response body. In production it is also
 * kept out of the logs' response path entirely (only logged via `console.error`
 * for 500s), matching the "no stack in prod" requirement.
 *
 * @module middleware/errorHandler
 */

'use strict';

const config = require('../config/env');

/**
 * Express error middleware (must keep the 4-arg signature so Express recognises
 * it as an error handler). Converts `err` into the standard envelope.
 *
 * @param {Error & {status?:number, code?:string, fields?:Object<string,string>}} err
 *   The thrown/forwarded error. `lib/errors` instances are fully described;
 *   plain/unknown errors fall back to a generic 500.
 * @param {import('express').Request} _req - Unused (signature requirement).
 * @param {import('express').Response} res - The response to write the envelope to.
 * @param {import('express').NextFunction} next - Used to delegate if headers
 *   were already sent (cannot recover the response otherwise).
 * @returns {void}
 */
function errorHandler(err, _req, res, next) {
  // If a partial response was already streamed, defer to Express' default
  // handler — we can no longer set a status or rewrite the body.
  if (res.headersSent) {
    return next(err);
  }

  // Map MySQL duplicate-key violations to a clean 409 conflict, unless the
  // error already declares its own status (a typed AppError wins).
  if (!err.status && err.code === 'ER_DUP_ENTRY') {
    err.status = 409;
    err.code = 'conflict';
    err.message = 'Konflikt: Der Eintrag existiert bereits.';
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  const isServerError = status >= 500;

  const body = {
    error: {
      code: typeof err.code === 'string' && err.code ? err.code : 'internal_error',
      // 5xx errors never leak internal details to the client.
      message: isServerError
        ? 'Interner Serverfehler.'
        : err.message || 'Anfrage fehlgeschlagen.',
    },
  };

  // Only validation-style errors expose a per-field map.
  if (err.fields && typeof err.fields === 'object' && !Array.isArray(err.fields)) {
    body.error.fields = err.fields;
  }

  // Log unexpected server errors. Outside production we include the stack to aid
  // debugging; in production we log only the message so stacks never persist.
  if (isServerError) {
    if (config.isProduction) {
      console.error('[server] Unhandled error:', err.message);
    } else {
      console.error('[server] Unhandled error:', err);
    }
  }

  res.status(status).json(body);
}

module.exports = errorHandler;
module.exports.errorHandler = errorHandler;
