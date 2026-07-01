// error handler

'use strict';

const config = require('../config/env');

function errorHandler(err, _req, res, next ) {
  if (res.headersSent) {
    return next(err);
  }

  // duplicate key
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
      message: isServerError
        ? 'Interner Serverfehler.'
        : err.message || 'Anfrage fehlgeschlagen.',
    },
  };

  if (err.fields && typeof err.fields === 'object' && !Array.isArray( err.fields)) {
    body.error.fields = err.fields;
  }

  if ( isServerError ) {
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
