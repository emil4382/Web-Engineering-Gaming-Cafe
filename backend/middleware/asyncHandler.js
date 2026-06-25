/**
 * @file `asyncHandler` — adapt async controllers to Express error flow.
 *
 * Express 4 does not await the handlers it calls, so a rejected promise inside
 * an `async (req, res)` controller would become an unhandled rejection instead
 * of reaching the central error middleware. Wrapping a handler in
 * {@link asyncHandler} forwards any thrown/rejected error to `next(err)`, where
 * the central `errorHandler` turns it into the `{ error: { … } }` envelope.
 *
 * @module middleware/asyncHandler
 */

'use strict';

/**
 * Wrap an async (or sync) Express handler so rejected promises and thrown
 * errors are forwarded to `next(err)` instead of crashing the process.
 *
 * Usage:
 * ```js
 * router.post('/', asyncHandler(controller.create));
 * ```
 *
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => (void|Promise<void>)} fn
 *   The route handler to wrap.
 * @returns {import('express').RequestHandler} A handler that never leaks a
 *   rejected promise — every error reaches the error middleware.
 */
function asyncHandler(fn) {
  return function wrappedHandler(req, res, next) {
    // `Promise.resolve` normalises sync throws and non-promise returns, so a
    // handler that throws synchronously is funnelled through `.catch` too.
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
module.exports.asyncHandler = asyncHandler;
