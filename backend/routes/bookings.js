/**
 * @file `/api/bookings` routes (create + staff list/cancel).
 *
 * Thin wiring only: each handler is wrapped in `asyncHandler`; staff-only routes
 * are guarded by `requireStaff`. Business logic lives in the controller/service.
 *
 * @module routes/bookings
 */

'use strict';

const express = require('express');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireStaff } = require('../middleware/requireStaff');
const bookingsController = require('../controllers/bookingsController');

const router = express.Router();

// POST /api/bookings — public booking creation (validated → 201/400/409).
router.post('/', asyncHandler(bookingsController.createBooking));

// GET /api/bookings — staff list with optional ?date= / ?status= filters.
router.get('/', requireStaff, asyncHandler(bookingsController.listBookings));

// PATCH /api/bookings/:id — staff status change (cancel).
router.patch('/:id', requireStaff, asyncHandler(bookingsController.patchBooking));

module.exports = router;
