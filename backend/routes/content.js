/**
 * @file Content router — public catalog GET endpoints.
 *
 * Mounted at `/api` in `server.js`, so the paths below resolve to
 * `/api/games`, `/api/menu`, `/api/tournaments`, `/api/leaderboard` and
 * `/api/tarife`. Routes are thin: each maps a GET to its content controller.
 *
 * @module routes/content
 */

'use strict';

const express = require('express');
const {
  getGames,
  getMenu,
  getTournaments,
  getLeaderboard,
  getTarife,
} = require('../controllers/contentController');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireAuth } = require('../middleware/requireAuth');
const teamsController = require('../controllers/teamsController');

const router = express.Router();

router.get('/games', getGames);
router.get('/menu', getMenu);
router.get('/tournaments', getTournaments);
router.get('/leaderboard', getLeaderboard);
router.get('/tarife', getTarife);

// Cross-cutting: the session user's teams. Lives here (mounted at `/api`)
// because `routes/teams` is mounted under `/api/teams` and cannot own `/me/…`.
router.get('/me/teams', requireAuth, asyncHandler(teamsController.listMyTeams));

module.exports = router;
