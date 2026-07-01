// auth validation

'use strict';

// config
const USERNAME_MIN = 3;
const USERNAME_MAX = 40;
const PASSWORD_MIN = 6;

const USERNAME_PATTERN = /^[A-Za-z0-9_.-]+$/;

// field checks
function usernameError( username) {
  if (typeof username !== 'string' || username.trim() === '') {
    return 'Benutzername ist erforderlich.';
  }
  const value = username.trim();
  if ( value.length < USERNAME_MIN) {
    return `Benutzername muss mindestens ${USERNAME_MIN} Zeichen lang sein.`;
  }
  if (value.length > USERNAME_MAX) {
    return `Benutzername darf höchstens ${USERNAME_MAX} Zeichen lang sein.`;
   }
  if (!USERNAME_PATTERN.test(value )) {
    return 'Benutzername darf nur Buchstaben, Zahlen, _, . und - enthalten.';
  }
  return null;
}

function passwordError(password ) {
  if (typeof password !== 'string' || password === '') {
    return 'Passwort ist erforderlich.';
  }
  if (password.length < PASSWORD_MIN) {
    return `Passwort muss mindestens ${PASSWORD_MIN} Zeichen lang sein.`;
  }
  return null;
}

// validators
function validateRegister( body = {}) {
  const fields = [ ];
  const u = usernameError( body.username);
  if (u ) fields.push({ field: 'username', message: u });
  const p = passwordError(body.password );
  if (p) fields.push({  field: 'password', message: p });
  return { ok: fields.length === 0, fields  };
}

function validateLogin(body = {}) {
  const fields = [];
  if (typeof body.username !== 'string' || body.username.trim() === '') {
    fields.push( { field: 'username',  message: 'Benutzername ist erforderlich.'  });
  }
  if (typeof body.password !== 'string' || body.password === '') {
    fields.push({  field: 'password', message: 'Passwort ist erforderlich.' });
   }
  return { ok: fields.length === 0, fields };
}

module.exports = {
  USERNAME_MIN,
  USERNAME_MAX,
  PASSWORD_MIN,
  USERNAME_PATTERN,
  usernameError,
  passwordError,
  validateRegister,
  validateLogin,
};
