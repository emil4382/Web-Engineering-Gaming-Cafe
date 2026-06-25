/**
 * @file Seat layout & availability service.
 *
 * Reads the 38 PCs from the `seats` table and projects them into the contract's
 * seat objects via `lib/availability.js` (which attaches the static
 * `zoneId`/`tier` from the floor plan). Availability for a given slot is derived
 * by joining seats against active (non-cancelled) bookings for that
 * `date + start_time`.
 *
 * @module services/seatService
 */

'use strict';

const { query } = require('../db/pool');
const { buildLayout, buildAvailability } = require('../lib/availability');

/** Column list + stable ordering shared by both queries. */
const SEAT_SELECT = 'SELECT id, code, zone, label FROM seats ORDER BY id';

/**
 * Get the full 38-seat floor plan. Without a date/time every seat is reported
 * as `available` (the live counterpart to the mock's static layout).
 *
 * @returns {Promise<Array<{id:string,code:string,label:string,zoneId:string,zone:string,tier:string,status:string}>>}
 */
async function getSeatLayout() {
  const rows = await query(SEAT_SELECT);
  return buildLayout(rows, 'available');
}

/**
 * Get seat availability for a specific slot. A seat is `occupied` when an active
 * booking (`status != 'storniert'`) exists for that exact `seat_id + date +
 * start_time`, otherwise `available`.
 *
 * @param {string} date - Booking date, `YYYY-MM-DD`.
 * @param {string} time - Start time, `HH:MM` or `HH:MM:SS`.
 * @returns {Promise<Array<Object>>} The 38-seat array with computed `status`.
 */
async function getAvailability(date, time) {
  const [seats, booked] = await Promise.all([
    query(SEAT_SELECT),
    query(
      `SELECT seat_id
         FROM bookings
        WHERE date = ? AND start_time = ? AND status <> 'storniert'`,
      [date, time],
    ),
  ]);
  const bookedSeatIds = new Set(booked.map((b) => b.seat_id));
  return buildAvailability(seats, bookedSeatIds);
}

module.exports = { getSeatLayout, getAvailability };
