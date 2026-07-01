// seat availability

'use strict';

const { zoneMeta } = require( './seatLayout');

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

// layout
function buildLayout(rows, status = 'available') {
  return rows.map( ( row) => toSeat(row, status));
}

// availability per slot
function buildAvailability(rows,  bookedSeatIds ) {
  const booked = bookedSeatIds instanceof Set ? bookedSeatIds : new Set(bookedSeatIds );
  return rows.map( (row) => toSeat( row, booked.has(row.id) ? 'occupied' : 'available') );
}

module.exports = {  toSeat, buildLayout, buildAvailability };
