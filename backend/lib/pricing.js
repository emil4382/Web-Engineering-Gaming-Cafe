/**
 * @file Pure booking-price calculation.
 *
 * Kept dependency-free and side-effect-free so it is trivially unit-testable.
 * Per the contract (§5): the hourly `starter` tariff is `price × units` (units
 * default to 1 for the POC) and the flat tariffs (`tagespass`, `night`, `vip`)
 * always cost their fixed price regardless of units.
 *
 * @module lib/pricing
 */

'use strict';

const { TARIFE } = require('./seatLayout');

/** Tariff lookup by key. @type {Map<string,{key:string,price:number,unit:string}>} */
const TARIF_BY_KEY = new Map(TARIFE.map((t) => [t.key, t]));

/**
 * Compute the total price for a booking in euros.
 *
 * @param {string} tarif - A tariff key (`starter` | `tagespass` | `night` | `vip`).
 * @param {number} [units=1] - Billable units (hours) for hourly tariffs; ignored for flat ones.
 * @returns {number} Total in euros, rounded to 2 decimals.
 * @throws {Error} If the tariff key is unknown (validators should catch this first).
 */
function computeTotal(tarif, units = 1) {
  const def = TARIF_BY_KEY.get(tarif);
  if (!def) {
    throw new Error(`Unknown tarif: ${tarif}`);
  }
  const qty = def.unit === 'hour' ? Math.max(1, Math.trunc(units) || 1) : 1;
  const total = def.price * qty;
  // Avoid binary float drift (e.g. 0.1*3) before persisting a DECIMAL.
  return Math.round(total * 100) / 100;
}

module.exports = { computeTotal, TARIF_BY_KEY };
