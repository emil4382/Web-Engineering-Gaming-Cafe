// bookings routes

'use strict';

const express = require('express');
const { asyncHandler  } = require('../lib/asyncHandler');
const { requireStaff } = require('../middleware/requireStaff');
const bookingsController = require('../controllers/bookingsController');

const router = express.Router();

router.post('/', asyncHandler(bookingsController.createBooking));

router.get( '/', requireStaff, asyncHandler(bookingsController.listBookings ) );

router.patch('/:id', requireStaff, asyncHandler(bookingsController.patchBooking ));

module.exports = router;
