/**
 * @file `/api/teams` routes (create, read, add members).
 *
 * Thin wiring only: handlers are wrapped in `asyncHandler`; all routes require
 * an authenticated session (`requireAuth`). Captain-only enforcement for adding
 * members happens in the service against the team's `captain_id`.
 *
 * NOTE: `GET /api/me/teams` is NOT here — it lives in the content router
 * (mounted at `/api`) because this router is mounted under `/api/teams`.
 *
 * @module routes/teams
 */

'use strict';

const express = require('express');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireAuth } = require('../middleware/requireAuth');
const teamsController = require('../controllers/teamsController');

const router = express.Router();

// POST /api/teams — create a team (creator becomes captain).
router.post('/', requireAuth, asyncHandler(teamsController.createTeam));

// GET /api/teams/:id — a team with its members.
router.get('/:id', requireAuth, asyncHandler(teamsController.getTeam));

// POST /api/teams/:id/members — add a member by username (captain only).
router.post('/:id/members', requireAuth, asyncHandler(teamsController.addMember));

module.exports = router;
