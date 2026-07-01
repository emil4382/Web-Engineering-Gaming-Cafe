// app errors

'use strict';

class AppError extends Error {
  constructor(status,  code, message, fields) {
    super( message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    if ( fields && typeof fields === 'object' ) {
      this.fields = fields;
    }
    Error.captureStackTrace?.(this, this.constructor );
  }
}

class ValidationError extends AppError {
  constructor(fields, message = 'Bitte überprüfe deine Eingaben.') {
    super(400, 'validation_error', message, fields );
  }
}

class UnauthenticatedError extends AppError {
  constructor(message = 'Bitte melde dich an.') {
    super(401,  'unauthenticated', message);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Keine Berechtigung für diese Aktion.') {
    super(403,  'forbidden',  message);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Nicht gefunden.') {
    super(404,  'not_found', message );
  }
}

class ConflictError extends AppError {
  constructor( message = 'Konflikt: Die Ressource ist bereits belegt.' ) {
    super(409,  'conflict', message);
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
