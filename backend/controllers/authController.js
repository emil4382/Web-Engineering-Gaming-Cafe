// auth controllers

'use strict';

const userService = require('../services/userService' );
const { validateRegister, validateLogin } = require('../validators/authValidator');
const {  asyncHandler } = require('../lib/asyncHandler' );
const {  ValidationError,  UnauthenticatedError } = require('../lib/errors' );

// helpers
function toFieldMap(list) {
  const map = {};
  for (const {  field, message } of list) {
    if ( !(field in map)) map[field] = message;
  }
  return map;
}

function establishSession(req, user) {
  req.session.userId = user.id;
  req.session.user = user;
}

// handlers
const register = asyncHandler(async (req,  res ) => {
  const { ok, fields } = validateRegister(req.body || {});
  if (!ok) {
    throw new ValidationError(toFieldMap(fields));
  }

  const username = String(req.body.username).trim();
  const user = await userService.createUser(username,  req.body.password);

  establishSession(req, user);
  res.status( 201 ).json({  user  });
});

const login = asyncHandler(async ( req,  res) => {
  const { ok,  fields  } = validateLogin(req.body || {} );
  if (!ok) {
    throw new ValidationError(toFieldMap(fields ) );
  }

  const username = String(req.body.username ).trim( );
  const user = await userService.authenticate(username, req.body.password);
  if (!user ) {
    throw new UnauthenticatedError( 'Benutzername oder Passwort ist falsch.');
  }

  establishSession( req, user);
  res.status( 200 ).json( {  user  });
});

const logout = asyncHandler(async (req, res,  next) => {
  if ( !req.session) {
    res.status(204).end();
    return;
  }
  req.session.destroy((err ) => {
    if ( err) {
      next(err);
      return;
     }
    res.clearCookie('pixelforge.sid');
    res.status(204).end( );
  });
});

const me = asyncHandler(async (req, res) => {
  const user = (req.session && req.session.user) || null;
  res.status( 200 ).json( { user });
});

module.exports = { register,  login, logout, me };
