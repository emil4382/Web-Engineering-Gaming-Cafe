/**
 * @file Express application entry point.
 *
 * Wires up the full middleware stack and mounts every `/api` router, serves the
 * static frontend, and provides the page + JSON 404 catch-alls and the central
 * error-handling middleware. The app is exported so tests can import it without
 * opening a port; it only calls `listen()` when run directly.
 *
 * Boot order matters:
 *   helmet → morgan → json → session
 *   → /api routers → JSON 404 for unknown /api
 *   → express.static(frontend) → HTML 404 catch-all for pages
 *   → central error handler
 *
 * @module server
 */

'use strict';

const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');

const config = require('./config/env');
const { ping } = require('./db/pool');

/** Absolute path to the static frontend directory. */
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');

/** Absolute path to the "GAME OVER" 404 page. */
const NOT_FOUND_PAGE = path.join(FRONTEND_DIR, '404.html');

const app = express();

// Trust the first proxy hop so secure cookies work behind a reverse proxy.
app.set('trust proxy', 1);

/* ----------------------------- core middleware ---------------------------- */

// `helmet` with CSP disabled: the frontend uses inline styles/scripts and a
// strict default CSP would break the static pages. Other protections stay on.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());
app.use(
  session({
    name: 'pixelforge.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProduction,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  }),
);

/* ------------------------------- API routers ------------------------------ */

/**
 * Mount a router that other layer-agents provide under `routes/`.
 *
 * The route files are authored by sibling agents and may not exist yet when
 * this scaffold first boots. We `require` each one so the app is complete once
 * they land; if a file is missing we mount a stub that returns a JSON 404 and
 * log a one-line warning, so the rest of the API (and the static site) still
 * works during incremental development.
 *
 * @param {string} mountPath - Base path, e.g. '/api/auth'.
 * @param {string} moduleId - Module to require, e.g. './routes/auth'.
 * @returns {void}
 */
function mountRouter(mountPath, moduleId) {
  try {
    const router = require(moduleId);
    app.use(mountPath, router);
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND' && String(err.message).includes(moduleId)) {
      console.warn(
        `[server] Router ${moduleId} not found yet — mounting stub on ${mountPath}.`,
      );
      const stub = express.Router();
      stub.use((req, res) => {
        res.status(404).json({
          error: {
            code: 'not_implemented',
            message: `Route ${mountPath} is not implemented yet.`,
          },
        });
      });
      app.use(mountPath, stub);
    } else {
      // A real error inside an existing router — surface it.
      throw err;
    }
  }
}

mountRouter('/api/auth', './routes/auth');
mountRouter('/api/teams', './routes/teams');
mountRouter('/api/tournaments', './routes/tournaments');
mountRouter('/api/seats', './routes/seats');
mountRouter('/api/bookings', './routes/bookings');
// "content" router serves the cross-cutting catalog endpoints (games, menu,
// and /api/me/teams). Mounted at /api so it can own those exact paths.
mountRouter('/api', './routes/content');

/* ------------------------- 404 for unknown /api --------------------------- */

// Any /api/* path that no router handled → JSON 404 (never the HTML page).
app.use('/api', (req, res) => {
  res.status(404).json({
    error: { code: 'not_found', message: `Unknown API route: ${req.method} ${req.originalUrl}` },
  });
});

/* ----------------------------- static frontend ---------------------------- */

app.use(express.static(FRONTEND_DIR, { extensions: ['html'] }));

/* --------------------- HTML 404 catch-all (pages) ------------------------- */

// Non-/api unknown routes → the styled "GAME OVER" 404 page.
app.use((req, res) => {
  res.status(404).sendFile(NOT_FOUND_PAGE, (err) => {
    if (err) {
      res.status(404).type('text/plain').send('404 — Not Found');
    }
  });
});

/* -------------------- central error-handling middleware ------------------- */

/**
 * Central error handler. Normalises every thrown/forwarded error into the
 * project's error envelope `{ error: { code, message, fields? } }` and maps it
 * to the correct HTTP status. Validation errors should carry `.status = 400`
 * and `.fields`; auth/role errors `.status = 401/403`; not-found `404`;
 * conflicts (incl. MySQL `ER_DUP_ENTRY`) `409`. Everything else is a 500.
 *
 * @param {Error & {status?:number, code?:string, fields?:Object}} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  // Map common MySQL duplicate-key violations to a 409 conflict.
  if (!err.status && err.code === 'ER_DUP_ENTRY') {
    err.status = 409;
    err.code = 'conflict';
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  const body = {
    error: {
      code: typeof err.code === 'string' ? err.code : 'internal_error',
      message:
        status === 500
          ? 'Interner Serverfehler.'
          : err.message || 'Anfrage fehlgeschlagen.',
    },
  };
  if (err.fields && typeof err.fields === 'object') {
    body.error.fields = err.fields;
  }

  if (status === 500) {
    console.error('[server] Unhandled error:', err);
  }
  res.status(status).json(body);
}

app.use(errorHandler);

/* --------------------------------- boot ----------------------------------- */

if (require.main === module) {
  // Warn (but don't crash) if the DB is unreachable, so the static site still
  // serves and GET endpoints can surface their own errors.
  ping()
    .then(() => console.log('[server] Database connection OK.'))
    .catch((err) =>
      console.warn(`[server] Database unreachable (static site still served): ${err.message}`),
    );

  app.listen(config.port, () => {
    console.log(`[server] PixelForge listening on http://localhost:${config.port}`);
  });
}

module.exports = app;
