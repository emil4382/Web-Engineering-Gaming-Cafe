// staff guard

'use strict';

const requireAuth = require('./requireAuth' );
const { ForbiddenError } = require('../lib/errors');

function requireStaff(req, res, next) {
  requireAuth(req, res,  ( err) => {
    if (err) {
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
