/**
 * @file Unit tests for the pure scoring + pricing libs.
 *
 * Covers `lib/points.js` (placement → points) and `lib/pricing.js` (tarif →
 * total). Both modules are pure — no DB, no clock, no randomness — so these
 * tests are fully deterministic and must never flake.
 *
 * Run with: `npm test` (i.e. `node --test`).
 *
 * @module test/points
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PLACEMENT_POINTS,
  PARTICIPATION_POINTS,
  pointsForPlacement,
  computeResults,
} = require('../lib/points');
const { computeTotal, TARIF_BY_KEY } = require('../lib/pricing');

/* ----------------------------- points: scheme ----------------------------- */

test('pointsForPlacement: podium places follow the PLAN.md scheme', () => {
  assert.equal(pointsForPlacement(1), 100, '1st place = 100');
  assert.equal(pointsForPlacement(2), 60, '2nd place = 60');
  assert.equal(pointsForPlacement(3), 40, '3rd place = 40');
});

test('pointsForPlacement: places 4–8 each award 20', () => {
  for (let place = 4; place <= 8; place += 1) {
    assert.equal(pointsForPlacement(place), 20, `place ${place} = 20`);
  }
});

test('pointsForPlacement: places beyond 8 fall back to participation (10)', () => {
  assert.equal(pointsForPlacement(9), PARTICIPATION_POINTS);
  assert.equal(pointsForPlacement(9), 10);
  assert.equal(pointsForPlacement(50), 10);
});

test('pointsForPlacement: rejects non-positive / non-integer placements', () => {
  assert.throws(() => pointsForPlacement(0), RangeError);
  assert.throws(() => pointsForPlacement(-1), RangeError);
  assert.throws(() => pointsForPlacement(1.5), RangeError);
  assert.throws(() => pointsForPlacement('1'), RangeError);
  assert.throws(() => pointsForPlacement(NaN), RangeError);
});

test('PLACEMENT_POINTS table is frozen and aligned with the helper', () => {
  assert.ok(Object.isFrozen(PLACEMENT_POINTS));
  // Index reads naturally: PLACEMENT_POINTS[place] === pointsForPlacement(place).
  for (let place = 1; place <= 8; place += 1) {
    assert.equal(PLACEMENT_POINTS[place], pointsForPlacement(place));
  }
});

/* -------------------------- points: computeResults ------------------------ */

test('computeResults: attaches derived points and preserves entry fields', () => {
  const input = [
    { team_id: 1, placement: 1 },
    { team_id: 2, placement: 2 },
    { user_id: 7, placement: 3 },
  ];
  const out = computeResults(input);

  assert.deepEqual(out, [
    { team_id: 1, placement: 1, points: 100 },
    { team_id: 2, placement: 2, points: 60 },
    { user_id: 7, placement: 3, points: 40 },
  ]);
});

test('computeResults: does not mutate the input entries', () => {
  const input = [{ user_id: 9, placement: 5 }];
  const out = computeResults(input);
  assert.equal('points' in input[0], false, 'original entry untouched');
  assert.equal(out[0].points, 20);
  assert.notEqual(out[0], input[0], 'returns new objects');
});

test('computeResults: empty list yields an empty list', () => {
  assert.deepEqual(computeResults([]), []);
});

test('computeResults: rejects non-array input and bad placements', () => {
  assert.throws(() => computeResults(null), TypeError);
  assert.throws(() => computeResults({ placement: 1 }), TypeError);
  assert.throws(() => computeResults([{ placement: 0 }]), RangeError);
});

/* ------------------------------ pricing: total ---------------------------- */

test('computeTotal: hourly starter tariff multiplies price by hours', () => {
  assert.equal(computeTotal('starter'), 5, 'default 1 hour → 5 €');
  assert.equal(computeTotal('starter', 1), 5);
  assert.equal(computeTotal('starter', 3), 15);
  assert.equal(computeTotal('starter', 8), 40);
});

test('computeTotal: flat tariffs ignore the hour count', () => {
  assert.equal(computeTotal('tagespass'), 25);
  assert.equal(computeTotal('tagespass', 12), 25, 'flat → units ignored');
  assert.equal(computeTotal('night'), 18);
  assert.equal(computeTotal('night', 99), 18);
  assert.equal(computeTotal('vip'), 89);
  assert.equal(computeTotal('vip', 3), 89);
});

test('computeTotal: result is a finite number rounded to cents', () => {
  const total = computeTotal('starter', 2);
  assert.equal(typeof total, 'number');
  assert.ok(Number.isFinite(total));
  // No binary float drift in the stored DECIMAL.
  assert.equal(total, Math.round(total * 100) / 100);
});

test('computeTotal: non-positive / fractional hours clamp to at least 1 unit', () => {
  // The implementation guards hourly tariffs against 0/negative/NaN units.
  assert.equal(computeTotal('starter', 0), 5);
  assert.equal(computeTotal('starter', -4), 5);
  assert.equal(computeTotal('starter', 2.9), 10, 'truncates to 2 hours');
});

test('computeTotal: unknown tariff throws', () => {
  assert.throws(() => computeTotal('platinum'), /Unknown tarif/);
  assert.throws(() => computeTotal(undefined), /Unknown tarif/);
});

test('TARIF_BY_KEY: exposes exactly the four known tariffs with their prices', () => {
  assert.deepEqual([...TARIF_BY_KEY.keys()].sort(), ['night', 'starter', 'tagespass', 'vip']);
  assert.equal(TARIF_BY_KEY.get('starter').price, 5);
  assert.equal(TARIF_BY_KEY.get('tagespass').price, 25);
  assert.equal(TARIF_BY_KEY.get('night').price, 18);
  assert.equal(TARIF_BY_KEY.get('vip').price, 89);
});
