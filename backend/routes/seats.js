// seats routes

'use strict';

const express = require('express' );
const { asyncHandler } = require('../lib/asyncHandler');
const seatsController = require('../controllers/seatsController');

const router = express.Router( );

router.get( '/', asyncHandler(seatsController.getSeats));

router.get( '/availability', asyncHandler(seatsController.getAvailability));

module.exports = router;
