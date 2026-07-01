// async handler

'use strict';

function asyncHandler(fn) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(fn( req, res, next)).catch(next );
  };
}

module.exports = asyncHandler;
module.exports.asyncHandler = asyncHandler;
