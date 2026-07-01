// content routes

'use strict';

const express = require( 'express');
const {
  getGames,
  getTournaments,
  getTarife,
} = require('../controllers/contentController');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireAuth } = require('../middleware/requireAuth');
const teamsController = require('../controllers/teamsController');

const router = express.Router( );

router.get('/games', getGames);
router.get('/tournaments', getTournaments );
router.get( '/tarife', getTarife);

// my teams
router.get('/me/teams', requireAuth, asyncHandler(teamsController.listMyTeams));

module.exports = router;
