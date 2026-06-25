/**
 * @file Controllers for the booking endpoints.
 *
 * Thin glue between routes and `bookingService`. The create handler validates
 * the body (`bookingValidator` → `400` on failure), then the service inserts in
 * a transaction (`409` on a booked slot). List/patch are staff-only (the guard
 * is applied in the route file). Async errors reach the central handler via the
 * `asyncHandler` wrapper.
 *
 * @module controllers/bookingsController
 */

'use strict';

const bookingService = require('../services/bookingService');
const {
  validateCreateBooking,
  validateUpdateBooking,
} = require('../validators/bookingValidator');
const { ValidationError } = require('../lib/errors');

/**
 * `POST /api/bookings` — create a booking. Validates → `400`; on success returns
 * `201 { booking }`. A booked slot surfaces as `409` from the service.
 * @type {import('express').RequestHandler}
 */
async function createBooking(req, res) {
  const input = validateCreateBooking(req.body);
  const booking = await bookingService.createBooking(input);
  res.status(201).json({ booking });
}

/**
 * `GET /api/bookings` *(staff)* — list bookings with optional `date`/`status`
 * filters.
 * @type {import('express').RequestHandler}
 */
async function listBookings(req, res) {
  const filters = {};
  if (typeof req.query.date === 'string' && req.query.date.trim()) {
    filters.date = req.query.date.trim();
  }
  if (typeof req.query.status === 'string' && req.query.status.trim()) {
    filters.status = req.query.status.trim();
  }
  const bookings = await bookingService.listBookings(filters);
  res.status(200).json(bookings);
}

/**
 * `PATCH /api/bookings/:id` *(staff)* — change a booking's status (cancel).
 * `400` invalid status; `404` unknown id; `200 { booking }` on success.
 * @type {import('express').RequestHandler}
 */
async function patchBooking(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) {
    throw new ValidationError({ id: 'Ungültige Buchungs-ID.' });
  }
  const { status } = validateUpdateBooking(req.body);
  const booking = await bookingService.cancelBooking(id, status);
  res.status(200).json({ booking });
}

module.exports = { createBooking, listBookings, patchBooking };
