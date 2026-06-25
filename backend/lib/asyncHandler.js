/**
 * @file Async controller wrapper.
 *
 * Express 4 does not catch rejected promises from `async` route handlers, so an
 * unawaited rejection would hang the request instead of reaching the central
 * `errorHandler`. Wrapping a handler in {@link asyncHandler} forwards any thrown
 * or rejected error to `next(err)`, keeping controllers free of `try/catch`.
 *
 * @module lib/asyncHandler
 */

'use strict';

/**
 * Wrap an async Express handler so rejections are forwarded to `next`.
 *
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<*>} handler
 * @returns {import('express').RequestHandler} A handler that never leaks a rejection.
 */
function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
