// auth guard

'use strict';

const { query  } = require( '../db/pool');
const { UnauthenticatedError } = require('../lib/errors' );

async function requireAuth(req, _res, next) {
  try {
    const userId = req.session && req.session.userId;
    if (!userId ) {
      throw new UnauthenticatedError();
    }

    const rows = await query(
      'SELECT id, username, role, created_at FROM users WHERE id = :id LIMIT 1',
      {  id: userId },
     );

    const user = rows[0];
    if (!user) {
      throw new UnauthenticatedError();
     }

    req.user = user;
    next( );
  } catch (err ) {
    next(err);
  }
}

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
