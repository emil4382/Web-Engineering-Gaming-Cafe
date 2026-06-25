/**
 * @file Pure tournament-scoring helpers (placement → points).
 *
 * The point scheme is the single source of truth from `PLAN.md`:
 *   1st = 100 · 2nd = 60 · 3rd = 40 · 4th–8th = 20 · participation = 10.
 *
 * Everything here is PURE (no DB, no I/O, no `Date.now`) so it is trivially
 * unit-testable and safe to import from services that turn a list of
 * placements into `results` rows.
 *
 * @module lib/points
 */

'use strict';

/**
 * Points awarded per finishing place. Index `0` is unused so the array reads
 * naturally: `PLACEMENT_POINTS[1] === 100`, `PLACEMENT_POINTS[2] === 60`, etc.
 * Places 4..8 all award 20; anything beyond falls back to participation points.
 * @type {ReadonlyArray<number>}
 */
const PLACEMENT_POINTS = Object.freeze([0, 100, 60, 40, 20, 20, 20, 20, 20]);

/** Points for simply taking part (placement 9+ or "participation"). */
const PARTICIPATION_POINTS = 10;

/** Highest place that still earns the 20-point tier. */
const LAST_RANKED_PLACE = 8;

/**
 * Map a 1-based placement to its point value following the PLAN.md scheme.
 *
 * Non-integer, zero or negative placements are invalid input and throw, so a
 * miscomputed placement never silently becomes participation points.
 *
 * @param {number} placement - 1-based finishing place (1 = winner).
 * @returns {number} Points awarded: 100/60/40, 20 for places 4–8, else 10.
 * @throws {RangeError} If `placement` is not a positive integer.
 */
function pointsForPlacement(placement) {
  if (!Number.isInteger(placement) || placement < 1) {
    throw new RangeError(`Invalid placement: ${placement} (expected a positive integer).`);
  }
  if (placement <= LAST_RANKED_PLACE) {
    return PLACEMENT_POINTS[placement];
  }
  return PARTICIPATION_POINTS;
}

/**
 * Turn a list of `{ placement, user_id|team_id }` entries into result rows with
 * their computed `points`, preserving every other field on the entry.
 *
 * Used by the results service so `POST /tournaments/:id/results` never trusts a
 * client-supplied `points` value — the server always derives it.
 *
 * @template {{ placement: number }} T
 * @param {T[]} entries - Placement entries (each must carry a `placement`).
 * @returns {Array<T & { points: number }>} The same entries plus `points`.
 * @throws {RangeError} If any entry has an invalid placement.
 */
function computeResults(entries) {
  if (!Array.isArray(entries)) {
    throw new TypeError('computeResults expects an array of placement entries.');
  }
  return entries.map((entry) => ({
    ...entry,
    points: pointsForPlacement(entry.placement),
  }));
}

module.exports = {
  PLACEMENT_POINTS,
  PARTICIPATION_POINTS,
  pointsForPlacement,
  computeResults,
};
