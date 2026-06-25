/**
 * @file Booking service — create/list/cancel seat reservations.
 *
 * `createBooking` resolves the seat by `code`, computes the `total` from the
 * tariff (`lib/pricing.js`), generates a unique human reference, and inserts the
 * row inside a TRANSACTION. The `uq_active_slot(seat_id, date, start_time)`
 * UNIQUE turns a double-booking race into a clean `409 Conflict` (caught via
 * MySQL `ER_DUP_ENTRY`). Staff helpers list and cancel bookings.
 *
 * @module services/bookingService
 */

'use strict';

const { query, getConnection } = require('../db/pool');
const { computeTotal } = require('../lib/pricing');
const { NotFoundError, ConflictError, ValidationError } = require('../lib/errors');

/** Allowed terminal status for the staff cancel/patch endpoint. */
const CANCELLED = 'storniert';

/** Booking statuses a PATCH may set. */
const PATCHABLE_STATUSES = new Set(['offen', 'bestaetigt', 'storniert']);

/**
 * Columns returned to the client for a booking (mirrors the contract shape).
 * `code` is joined from `seats` so the response carries the seat code, not just
 * the numeric `seat_id`.
 */
const BOOKING_SELECT = `
  SELECT b.id, b.seat_id, s.code AS code, b.date, b.start_time, b.tarif,
         b.total, b.name, b.email, b.status, b.reference, b.created_at
    FROM bookings b
    JOIN seats s ON s.id = b.seat_id`;

/**
 * Generate a short, human-friendly, unique-ish booking reference, e.g.
 * `PF-7G2K9Q`. The `uq_booking_reference` UNIQUE is the real guarantee; this
 * just makes collisions astronomically unlikely.
 * @returns {string} A reference like `PF-XXXXXX`.
 */
function generateReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let body = '';
  for (let i = 0; i < 6; i += 1) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `PF-${body}`;
}

/**
 * Normalise the JSON DECIMAL/date fields of a raw booking row. `mysql2` returns
 * DECIMAL as a string (and `dateStrings` keeps dates as strings); the contract
 * wants `total` as a JSON number.
 * @param {Object} row - Raw booking row.
 * @returns {Object} The row with `total` coerced to a number.
 */
function shapeBooking(row) {
  return { ...row, total: Number(row.total) };
}

/**
 * Create a booking for a seat/slot. Validation of the payload happens upstream
 * (`validators/bookingValidator.js`); this layer trusts the shape but still
 * fails cleanly on a missing seat and on a slot collision.
 *
 * @param {Object} payload - Validated booking input.
 * @param {string} payload.code - Seat code (e.g. `"B5"`).
 * @param {string} payload.date - `YYYY-MM-DD`.
 * @param {string} payload.time - Start time `HH:MM`.
 * @param {string} payload.tarif - Tariff key.
 * @param {string} payload.name - Customer name.
 * @param {string} [payload.email] - Optional customer email.
 * @param {number} [payload.units] - Billable hours for the hourly tariff.
 * @returns {Promise<Object>} The created booking in contract shape.
 * @throws {NotFoundError} If the seat code is unknown.
 * @throws {ConflictError} If the slot is already booked.
 */
async function createBooking(payload) {
  const { code, date, time, tarif, name, email = null, units = 1 } = payload;
  const total = computeTotal(tarif, units);

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Resolve the seat id from its code (FOR UPDATE keeps the row stable for
    // the duration of the transaction).
    const [seatRows] = await conn.execute(
      'SELECT id FROM seats WHERE code = ? LIMIT 1 FOR UPDATE',
      [code],
    );
    if (seatRows.length === 0) {
      throw new NotFoundError('Platz nicht gefunden.');
    }
    const seatId = seatRows[0].id;

    // Defensive re-check: surface a clean conflict before relying on the
    // UNIQUE (active = not cancelled). A cancelled row for the same slot still
    // occupies the UNIQUE key, so insert may also collide — handled below.
    const [active] = await conn.execute(
      `SELECT id FROM bookings
        WHERE seat_id = ? AND date = ? AND start_time = ? AND status <> 'storniert'
        LIMIT 1`,
      [seatId, date, time],
    );
    if (active.length > 0) {
      throw new ConflictError('Dieser Platz ist zu diesem Zeitpunkt bereits gebucht.');
    }

    const reference = generateReference();
    let insertId;
    try {
      const [result] = await conn.execute(
        `INSERT INTO bookings
           (seat_id, date, start_time, tarif, total, name, email, status, reference)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'bestaetigt', ?)`,
        [seatId, date, time, tarif, total, name, email, reference],
      );
      insertId = result.insertId;
    } catch (err) {
      // The UNIQUE on (seat_id, date, start_time) collapses a race into a 409.
      if (err && err.code === 'ER_DUP_ENTRY') {
        throw new ConflictError('Dieser Platz ist zu diesem Zeitpunkt bereits gebucht.');
      }
      throw err;
    }

    await conn.commit();

    const [rows] = await conn.execute(`${BOOKING_SELECT} WHERE b.id = ?`, [insertId]);
    return shapeBooking(rows[0]);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * List bookings for staff, newest first. Supports optional `date`/`status`
 * filters (both applied as exact matches when present).
 *
 * @param {Object} [filters={}] - Optional filters.
 * @param {string} [filters.date] - Restrict to a `YYYY-MM-DD`.
 * @param {string} [filters.status] - Restrict to a booking status.
 * @returns {Promise<Array<Object>>} Bookings in contract shape.
 */
async function listBookings(filters = {}) {
  const clauses = [];
  const params = [];
  if (filters.date) {
    clauses.push('b.date = ?');
    params.push(filters.date);
  }
  if (filters.status) {
    clauses.push('b.status = ?');
    params.push(filters.status);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  const rows = await query(
    `${BOOKING_SELECT}${where} ORDER BY b.date DESC, b.start_time DESC, b.id DESC`,
    params,
  );
  return rows.map(shapeBooking);
}

/**
 * Update a booking's status (staff). The contract's primary use is cancelling
 * (`status: 'storniert'`); any of the three statuses is accepted.
 *
 * @param {number} id - Booking id.
 * @param {string} [status=CANCELLED] - New status; defaults to cancellation.
 * @returns {Promise<Object>} The updated booking in contract shape.
 * @throws {ValidationError} If `status` is not a valid booking status.
 * @throws {NotFoundError} If no booking has that id.
 */
async function cancelBooking(id, status = CANCELLED) {
  if (!PATCHABLE_STATUSES.has(status)) {
    throw new ValidationError({ status: 'Ungültiger Status.' });
  }
  const result = await query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
  if (result.affectedRows === 0) {
    throw new NotFoundError('Buchung nicht gefunden.');
  }
  const rows = await query(`${BOOKING_SELECT} WHERE b.id = ?`, [id]);
  return shapeBooking(rows[0]);
}

module.exports = { createBooking, listBookings, cancelBooking, generateReference };
