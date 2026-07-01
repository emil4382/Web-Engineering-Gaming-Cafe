// booking controllers

'use strict';

const bookingService = require( '../services/bookingService' );
const {
  validateCreateBooking,
  validateUpdateBooking,
} = require( '../validators/bookingValidator');
const { ValidationError } = require('../lib/errors');

// handlers
async function createBooking(req, res ) {
  const input = validateCreateBooking(req.body);
  const booking = await bookingService.createBooking(input);
  res.status(201).json({ booking });
}

async function listBookings(req,  res ) {
  const filters = {};
  if (typeof req.query.date === 'string' && req.query.date.trim()) {
    filters.date = req.query.date.trim( );
   }
  if (typeof req.query.status === 'string' && req.query.status.trim()) {
    filters.status = req.query.status.trim(  );
   }
  const bookings = await bookingService.listBookings(filters);
  res.status(200).json(bookings);
}

async function patchBooking( req, res) {
  const id = Number.parseInt( req.params.id,  10);
  if (!Number.isInteger(id) || id < 1) {
    throw new ValidationError( { id: 'Ungültige Buchungs-ID.' } );
  }
  const { status } = validateUpdateBooking(req.body);
  const booking = await bookingService.cancelBooking(id, status );
  res.status(200).json({ booking  });
}

module.exports = { createBooking, listBookings, patchBooking };
