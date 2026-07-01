// booking service

'use strict';

const { query, getConnection  } = require('../db/pool');
const { computeTotal } = require('../lib/pricing' );
const {  NotFoundError, ConflictError, ValidationError } = require('../lib/errors');

const CANCELLED = 'storniert';

const PATCHABLE_STATUSES = new Set( ['offen',  'bestaetigt', 'storniert']);

const BOOKING_SELECT = `
  SELECT b.id, b.seat_id, s.code AS code, b.date, b.start_time, b.tarif,
         b.total, b.name, b.email, b.status, b.reference, b.created_at
    FROM bookings b
    JOIN seats s ON s.id = b.seat_id`;

// helpers
function generateReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let body = '';
  for (let i = 0; i < 6; i += 1) {
    body += alphabet[ Math.floor(Math.random( ) * alphabet.length)];
  }
  return `PF-${body}`;
}

function shapeBooking(row) {
  return { ...row, total: Number(row.total) };
}

// create booking
async function createBooking(payload) {
  const {  code, date, time, tarif, name,  email = null, units = 1 } = payload;
  const total = computeTotal(tarif, units);

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [seatRows] = await conn.execute(
      'SELECT id FROM seats WHERE code = ? LIMIT 1 FOR UPDATE',
      [code],
    );
    if (seatRows.length === 0 ) {
      throw new NotFoundError('Platz nicht gefunden.' );
    }
    const seatId = seatRows[0].id;

    const [active ] = await conn.execute(
      `SELECT id FROM bookings
        WHERE seat_id = ? AND date = ? AND start_time = ? AND status <> 'storniert'
        LIMIT 1`,
      [seatId, date, time],
    );
    if (active.length > 0 ) {
      throw new ConflictError('Dieser Platz ist zu diesem Zeitpunkt bereits gebucht.');
    }

    const reference = generateReference();
    let insertId;
    try {
      const [result] = await conn.execute(
        `INSERT INTO bookings
           (seat_id, date, start_time, tarif, total, name, email, status, reference)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'bestaetigt', ?)`,
        [ seatId, date,  time, tarif, total, name, email, reference],
      );
      insertId = result.insertId;
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        throw new ConflictError('Dieser Platz ist zu diesem Zeitpunkt bereits gebucht.');
      }
      throw err;
    }

    await conn.commit();

    const [rows] = await conn.execute(`${BOOKING_SELECT} WHERE b.id = ?`,  [insertId]);
    return shapeBooking(rows[0]);
  } catch (err) {
    await conn.rollback( );
    throw err;
  } finally {
    conn.release();
  }
}

// list bookings
async function listBookings(filters = {} ) {
  const clauses = [ ];
  const params = [];
  if (filters.date) {
    clauses.push('b.date = ?' );
    params.push(filters.date);
   }
  if (filters.status) {
    clauses.push('b.status = ?');
    params.push(filters.status);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ' )}` : '';
  const rows = await query(
    `${BOOKING_SELECT}${where} ORDER BY b.date DESC, b.start_time DESC, b.id DESC`,
    params,
  );
  return rows.map(shapeBooking);
}

// cancel booking
async function cancelBooking(id, status = CANCELLED) {
  if (!PATCHABLE_STATUSES.has( status)) {
    throw new ValidationError({ status: 'Ungültiger Status.'  });
  }
  const result = await query('UPDATE bookings SET status = ? WHERE id = ?', [status, id ] );
  if (result.affectedRows === 0) {
    throw new NotFoundError('Buchung nicht gefunden.');
  }
  const rows = await query( `${BOOKING_SELECT} WHERE b.id = ?`, [id]);
  return shapeBooking(rows[ 0]);
}

module.exports = { createBooking, listBookings, cancelBooking, generateReference  };
