// teams routes

'use strict';

const express = require( 'express');
const { asyncHandler } = require('../lib/asyncHandler' );
const { requireAuth } = require('../middleware/requireAuth');
const teamsController = require('../controllers/teamsController');

const router = express.Router();

router.post('/', requireAuth, asyncHandler(teamsController.createTeam ) );

router.get( '/:id',  requireAuth, asyncHandler( teamsController.getTeam));

router.post( '/:id/members', requireAuth,  asyncHandler( teamsController.addMember ));

module.exports = router;
