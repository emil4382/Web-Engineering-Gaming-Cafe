// seat service

'use strict';

const { query } = require('../db/pool');
const { buildLayout,  buildAvailability } = require( '../lib/availability');

const SEAT_SELECT = 'SELECT id, code, zone, label FROM seats ORDER BY id';

// seat layout
async function getSeatLayout( ) {
  const rows = await query(SEAT_SELECT);
  return buildLayout(rows, 'available');
}

// availability
async function getAvailability(date, time) {
  const [seats, booked] = await Promise.all([
    query(SEAT_SELECT),
    query(
      `SELECT seat_id
         FROM bookings
        WHERE date = ? AND start_time = ? AND status <> 'storniert'`,
      [date,  time],
     ),
  ]);
  const bookedSeatIds = new Set(booked.map((b) => b.seat_id));
  return buildAvailability( seats, bookedSeatIds);
}

module.exports = { getSeatLayout,  getAvailability  };
