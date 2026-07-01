// tournaments routes

'use strict';

const express = require('express');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireAuth } = require('../middleware/requireAuth');
const {  requireStaff } = require('../middleware/requireStaff' );
const tournamentsController = require('../controllers/tournamentsController');

const router = express.Router();

router.post('/', requireStaff, asyncHandler(tournamentsController.createTournament));

router.post('/:id/register', requireAuth,  asyncHandler(tournamentsController.register ));

module.exports = router;
