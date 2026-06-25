/**
 * @file `notFound` — JSON 404 for unmatched `/api` routes.
 *
 * Mounted after every `/api` router so any path no router handled returns the
 * project error envelope with `code: 'not_found'` (and a `404` status) instead
 * of falling through to the static file server or the HTML "GAME OVER" page.
 * Reserve this for the API surface; non-API paths get the styled 404 page.
 *
 * @module middleware/notFound
 */

'use strict';

/**
 * Terminal handler that responds with a `404` JSON envelope describing the
 * unmatched route. Always ends the request (never calls `next`).
 *
 * @param {import('express').Request} req - The incoming request (for method/URL).
 * @param {import('express').Response} res - The response to write the 404 to.
 * @returns {void}
 */
function notFound(req, res) {
  res.status(404).json({
    error: {
      code: 'not_found',
      message: `Unbekannte API-Route: ${req.method} ${req.originalUrl}`,
    },
  });
}

module.exports = notFound;
module.exports.notFound = notFound;
