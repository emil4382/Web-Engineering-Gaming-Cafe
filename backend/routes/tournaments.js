/**
 * @file `/api/tournaments` WRITE routes (register, staff create, staff results).
 *
 * Thin wiring only: handlers are wrapped in `asyncHandler`; auth/role guards are
 * applied per route. This router owns the WRITE side; the GET list/detail
 * endpoints are served by the content router (mounted at `/api`). Because this
 * router is mounted first, any path it does NOT define (e.g. `GET /`) simply
 * falls through to the content router.
 *
 * @module routes/tournaments
 */

'use strict';

const express = require('express');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireAuth } = require('../middleware/requireAuth');
const { requireStaff } = require('../middleware/requireStaff');
const tournamentsController = require('../controllers/tournamentsController');

const router = express.Router();

// POST /api/tournaments — create a tournament (staff only).
router.post('/', requireStaff, asyncHandler(tournamentsController.createTournament));

// POST /api/tournaments/:id/register — sign up (auth; team mode needs captain).
router.post('/:id/register', requireAuth, asyncHandler(tournamentsController.register));

// POST /api/tournaments/:id/results — record placements + points (staff only).
router.post('/:id/results', requireStaff, asyncHandler(tournamentsController.recordResults));

module.exports = router;
