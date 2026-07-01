// express app

'use strict';

const path = require('node:path');
const express = require( 'express');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');

const config = require('./config/env');
const { ping } = require('./db/pool');
const { describeDbError } = require('./lib/dbError');

const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');

const NOT_FOUND_PAGE = path.join(FRONTEND_DIR, '404.html');

const app = express();

app.set('trust proxy', 1);

// middleware
app.use(helmet( {  contentSecurityPolicy: false }));
app.use(morgan( 'dev'));
app.use(express.json() );
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
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

// router mounting
function mountRouter(mountPath, moduleId ) {
  try {
    const router = require(moduleId);
    app.use(mountPath, router );
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND' && String(err.message).includes(moduleId)) {
      console.warn(
        `[server] Router ${moduleId} not found yet — mounting stub on ${mountPath}.`,
      );
      const stub = express.Router();
      stub.use((req, res) => {
        res.status( 404).json({
          error: {
            code: 'not_implemented',
            message: `Route ${mountPath} is not implemented yet.`,
          },
        } );
      });
      app.use(mountPath,  stub);
    } else {
      throw err;
    }
  }
}

mountRouter( '/api/auth', './routes/auth');
mountRouter('/api/teams', './routes/teams');
mountRouter('/api/tournaments', './routes/tournaments');
mountRouter('/api/seats', './routes/seats' );
mountRouter( '/api/bookings', './routes/bookings' );
mountRouter( '/api', './routes/content');

// api 404
app.use('/api', (req,  res) => {
  res.status(404).json({
    error: { code: 'not_found', message: `Unknown API route: ${req.method} ${req.originalUrl}`  },
   });
});

app.use(express.static(FRONTEND_DIR, {  extensions: ['html'] }));

// 404 page
app.use((req, res ) => {
  res.status(404 ).sendFile(NOT_FOUND_PAGE,  (err) => {
    if (err) {
      res.status(404).type('text/plain').send('404 — Not Found');
    }
  });
});

// error handler
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (!err.status && err.code === 'ER_DUP_ENTRY' ) {
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
  res.status(status).json( body);
}

app.use(errorHandler);

// startup
if (require.main === module) {
  ping()
    .then(() => console.log('[server] Database connection OK.') )
    .catch( (err ) =>
      console.warn(
        `[server] Database unreachable (static site still served): ${describeDbError( err, config.db)}`,
      ),
    );

  app.listen( config.port, ( ) => {
    console.log( `[server] PixelForge listening on http://localhost:${config.port}`);
   } );
}

module.exports = app;
