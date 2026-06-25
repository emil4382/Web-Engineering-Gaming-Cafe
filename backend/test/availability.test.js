/**
 * @file Unit tests for `lib/availability.js` (pure seat-status logic).
 *
 * Verifies that DB seat rows project into the contract's seat object — with the
 * static `zoneId`/`tier` from the floor plan attached — and that a slot's booked
 * seat ids correctly flip each seat's `status` to `occupied`. No DB involved.
 *
 * @module test/availability
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { toSeat, buildLayout, buildAvailability } = require('../lib/availability');

/**
 * A small, representative slice of the 38-seat `seats` table — one row per zone
 * so every `zoneId`/`tier` mapping is exercised.
 * @type {Array<{id:number,code:string,zone:string,label:string}>}
 */
const ROWS = [
  { id: 1, code: 'N1', zone: 'Reihe Nord', label: 'N1' },
  { id: 7, code: 'W1', zone: 'Reihe West', label: 'W1' },
  { id: 17, code: 'A1', zone: 'Insel A', label: 'A1' },
  { id: 25, code: 'B5', zone: 'Insel B', label: 'B5' },
  { id: 33, code: 'P1', zone: 'Privat-Box', label: 'P1' },
];

/* --------------------------------- toSeat --------------------------------- */

test('toSeat: maps a DB row to the contract seat shape (id = code)', () => {
  const seat = toSeat({ id: 25, code: 'B5', zone: 'Insel B', label: 'B5' });
  assert.deepEqual(seat, {
    id: 'B5',
    code: 'B5',
    label: 'B5',
    zoneId: 'insel-b',
    zone: 'Insel B',
    tier: 'Premium',
    status: 'available',
  });
});

test('toSeat: defaults status to "available" and honours an explicit status', () => {
  assert.equal(toSeat(ROWS[0]).status, 'available');
  assert.equal(toSeat(ROWS[0], 'occupied').status, 'occupied');
});

test('toSeat: derives zoneId/tier from the static floor plan per zone', () => {
  const byCode = Object.fromEntries(ROWS.map((r) => [r.code, toSeat(r)]));
  assert.equal(byCode.N1.zoneId, 'reihe-nord');
  assert.equal(byCode.N1.tier, 'Standard');
  assert.equal(byCode.W1.zoneId, 'reihe-west');
  assert.equal(byCode.A1.tier, 'Standard');
  assert.equal(byCode.B5.tier, 'Premium', 'Insel B is Premium');
  assert.equal(byCode.P1.zoneId, 'privat-box');
  assert.equal(byCode.P1.tier, 'Privat');
});

test('toSeat: falls back to label = code when the row has no label', () => {
  const seat = toSeat({ id: 1, code: 'N3', zone: 'Reihe Nord' });
  assert.equal(seat.label, 'N3');
});

/* ------------------------------- buildLayout ------------------------------ */

test('buildLayout: projects every row with a uniform status', () => {
  const layout = buildLayout(ROWS);
  assert.equal(layout.length, ROWS.length);
  assert.ok(layout.every((s) => s.status === 'available'));
  assert.deepEqual(
    layout.map((s) => s.id),
    ['N1', 'W1', 'A1', 'B5', 'P1'],
  );
});

test('buildLayout: an explicit status applies to all seats', () => {
  const layout = buildLayout(ROWS, 'occupied');
  assert.ok(layout.every((s) => s.status === 'occupied'));
});

/* ---------------------------- buildAvailability --------------------------- */

test('buildAvailability: seats with a booked DB id become "occupied"', () => {
  // Book W1 (id 7) and P1 (id 33) for the slot.
  const seats = buildAvailability(ROWS, new Set([7, 33]));
  const status = Object.fromEntries(seats.map((s) => [s.code, s.status]));
  assert.equal(status.W1, 'occupied');
  assert.equal(status.P1, 'occupied');
  assert.equal(status.N1, 'available');
  assert.equal(status.A1, 'available');
  assert.equal(status.B5, 'available');
});

test('buildAvailability: accepts any iterable of booked ids (not only a Set)', () => {
  const seats = buildAvailability(ROWS, [25]); // plain array → B5 booked
  const b5 = seats.find((s) => s.code === 'B5');
  assert.equal(b5.status, 'occupied');
});

test('buildAvailability: an empty booked set leaves everything available', () => {
  const seats = buildAvailability(ROWS, new Set());
  assert.ok(seats.every((s) => s.status === 'available'));
});

test('buildAvailability: matches on DB id, never on the seat code string', () => {
  // 'B5' (the code) must NOT be treated as a booked id; only numeric id 7 is.
  const seats = buildAvailability(ROWS, new Set([7]));
  const status = Object.fromEntries(seats.map((s) => [s.code, s.status]));
  assert.equal(status.B5, 'available', 'code string is not an id');
  assert.equal(status.W1, 'occupied');
});
