/**
 * @file Pure seat-availability helpers.
 *
 * Turns DB seat rows (+ the set of booked seat ids for a slot) into the
 * contract's seat objects, attaching the static `zoneId`/`tier` from the floor
 * plan and the computed `status`. Pure so it can be unit-tested without a DB.
 *
 * Seat shape (mirrors `frontend/js/api/mock.js`):
 * `{ id, code, label, zoneId, zone, tier, status }` where `id` is the **code**
 * string (e.g. `"B5"`), matching the mock so the static renderer is unchanged.
 *
 * @module lib/availability
 */

'use strict';

const { zoneMeta } = require('./seatLayout');

/**
 * @typedef {Object} SeatRow
 * @property {number} id - DB primary key.
 * @property {string} code - Seat code (e.g. `"B5"`).
 * @property {string} zone - DB zone name (e.g. `"Insel B"`).
 * @property {string} label - Display label (= code).
 */

/**
 * Project a single DB seat row into the contract's seat object.
 *
 * @param {SeatRow} row - A row from the `seats` table.
 * @param {'available'|'occupied'} [status='available'] - Computed availability.
 * @returns {{id:string,code:string,label:string,zoneId:string,zone:string,tier:string,status:string}}
 */
function toSeat(row, status = 'available') {
  const { zoneId, tier } = zoneMeta(row.zone);
  return {
    id: row.code,
    code: row.code,
    label: row.label || row.code,
    zoneId,
    zone: row.zone,
    tier,
    status,
  };
}

/**
 * Project all seat rows into the seat layout with a uniform status (used by
 * `GET /api/seats` when no date/time is supplied).
 *
 * @param {SeatRow[]} rows - All `seats` rows.
 * @param {'available'|'occupied'} [status='available'] - Status for every seat.
 * @returns {Array<Object>} The 38-seat layout array.
 */
function buildLayout(rows, status = 'available') {
  return rows.map((row) => toSeat(row, status));
}

/**
 * Compute availability for a slot: each seat is `occupied` if its DB id is in
 * `bookedSeatIds`, else `available`.
 *
 * @param {SeatRow[]} rows - All `seats` rows.
 * @param {Set<number>|Iterable<number>} bookedSeatIds - DB ids with an active booking.
 * @returns {Array<Object>} The 38-seat array with computed `status`.
 */
function buildAvailability(rows, bookedSeatIds) {
  const booked = bookedSeatIds instanceof Set ? bookedSeatIds : new Set(bookedSeatIds);
  return rows.map((row) => toSeat(row, booked.has(row.id) ? 'occupied' : 'available'));
}

module.exports = { toSeat, buildLayout, buildAvailability };
