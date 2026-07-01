// not found

'use strict';

function notFound( req, res) {
  res.status( 404).json({
    error: {
      code: 'not_found',
      message: `Unbekannte API-Route: ${req.method} ${req.originalUrl}`,
    },
  });
}

module.exports = notFound;
module.exports.notFound = notFound;
