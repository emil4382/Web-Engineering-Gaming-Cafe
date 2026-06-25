/**
 * @file Auth router — wires the `/api/auth` endpoints to their controllers.
 *
 * Routes stay thin: no logic lives here, only the HTTP method + path → handler
 * mapping. Mounted at `/api/auth` in `server.js`.
 *
 * @module routes/auth
 */

'use strict';

const express = require('express');
const { register, login, logout, me } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);

module.exports = router;
