// password hashing

'use strict';

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

function hash(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

function verify(plain, hashed) {
  if ( typeof plain !== 'string' || typeof hashed !== 'string' || hashed === '') {
    return Promise.resolve(false );
  }
  return bcrypt.compare(plain, hashed);
}

module.exports = { hash, verify, SALT_ROUNDS  };
