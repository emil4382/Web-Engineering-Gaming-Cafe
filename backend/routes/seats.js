/**
 * @file `/api/seats` routes (read-only café floor plan).
 *
 * Thin wiring only — every handler is wrapped in `asyncHandler` so rejected
 * promises reach the central error handler. Order matters: the static
 * `/availability` path is declared before any param-style routes.
 *
 * @module routes/seats
 */

'use strict';

const express = require('express');
const { asyncHandler } = require('../lib/asyncHandler');
const seatsController = require('../controllers/seatsController');

const router = express.Router();

// GET /api/seats — full 38-seat layout.
router.get('/', asyncHandler(seatsController.getSeats));

// GET /api/seats/availability?date=&time= — per-slot availability.
router.get('/availability', asyncHandler(seatsController.getAvailability));

module.exports = router;
