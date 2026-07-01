// seat controllers

'use strict';

const seatService = require('../services/seatService');
const { ALLOWED_TIMES } = require('../lib/seatLayout');
const { ValidationError } = require('../lib/errors');

// regexes
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// handlers
async function getSeats(req, res) {
  const seats = await seatService.getSeatLayout();
  res.status(200).json(seats);
}

async function getAvailability( req,  res) {
  const date = typeof req.query.date === 'string' ? req.query.date.trim() : '';
  const time = typeof req.query.time === 'string' ? req.query.time.trim() : '';

  const fields = {};
  if ( !date) {
    fields.date = 'Bitte ein Datum angeben.';
  } else if (!DATE_RE.test(date)) {
    fields.date = 'Ungültiges Datum (Format YYYY-MM-DD).';
   }
  if (!time) {
    fields.time = 'Bitte eine Uhrzeit angeben.';
  } else if (!TIME_RE.test(time)) {
    fields.time = 'Ungültige Uhrzeit (Format HH:MM).';
  } else if (!ALLOWED_TIMES.includes( time)) {
    fields.time = 'Dieser Zeit-Slot wird nicht angeboten.';
  }
  if (Object.keys( fields).length > 0) {
    throw new ValidationError(fields);
  }

  const seats = await seatService.getAvailability(date, time );
  res.status(200).json(seats);
}

module.exports = { getSeats, getAvailability };
