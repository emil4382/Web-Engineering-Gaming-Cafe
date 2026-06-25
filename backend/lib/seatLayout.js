/**
 * @file Backend mirror of the static café floor-plan constants.
 *
 * The canonical source is `frontend/js/config/seatLayout.js`, but that file is
 * an ES module and uses browser-only conventions, so the backend cannot
 * `require` it. These constants are duplicated here (CommonJS) and MUST stay in
 * sync. They supply the *static* fields the API exposes per the contract:
 *
 *  - `zoneId` / `tier` for each seat (joined by the DB seat's `zone` name),
 *  - `ALLOWED_TIMES` (bookable start slots),
 *  - `TARIFE` (the four tariffs; not a DB table).
 *
 * @module lib/seatLayout
 */

'use strict';

/**
 * Zone metadata keyed by the DB `seats.zone` value. `zoneId`/`tier` come from
 * here so the rendered seat matches the floor plan without storing them in SQL.
 * @type {Object<string,{zoneId:string,tier:string}>}
 */
const ZONE_BY_NAME = Object.freeze({
  'Reihe Nord': { zoneId: 'reihe-nord', tier: 'Standard' },
  'Reihe West': { zoneId: 'reihe-west', tier: 'Standard' },
  'Insel A': { zoneId: 'insel-a', tier: 'Standard' },
  'Insel B': { zoneId: 'insel-b', tier: 'Premium' },
  'Privat-Box': { zoneId: 'privat-box', tier: 'Privat' },
});

/**
 * Bookable start-time slots (24h, on the hour). Mirrors the booking form.
 * @type {string[]}
 */
const ALLOWED_TIMES = Object.freeze([
  '10:00',
  '12:00',
  '14:00',
  '16:00',
  '18:00',
  '20:00',
  '22:00',
  '00:00',
]);

/**
 * The four booking tariffs (mirrors `TARIFE` in the frontend config). `price`
 * is in euros; `unit` drives how `lib/pricing.js` computes a booking total.
 * @type {Array<{key:string,name:string,price:number,unit:string,unitLabel:string,featured?:boolean}>}
 */
const TARIFE = Object.freeze([
  { key: 'starter', name: 'Starter', price: 5, unit: 'hour', unitLabel: 'pro Stunde' },
  { key: 'tagespass', name: 'Tagespass', price: 25, unit: 'day', unitLabel: '10:00 – 22:00 Uhr', featured: true },
  { key: 'night', name: 'Night-Surfer', price: 18, unit: 'night', unitLabel: '22:00 – 06:00 Uhr' },
  { key: 'vip', name: 'VIP-Monat', price: 89, unit: 'month', unitLabel: '30 Tage Flatrate' },
]);

/** Tariff keys, for fast validation. @type {Set<string>} */
const TARIF_KEYS = new Set(TARIFE.map((t) => t.key));

/**
 * Resolve the static `zoneId`/`tier` for a DB zone name.
 * @param {string} zoneName - The `seats.zone` value, e.g. `'Insel B'`.
 * @returns {{zoneId:string,tier:string}} Falls back to a slugified id + 'Standard'.
 */
function zoneMeta(zoneName) {
  return (
    ZONE_BY_NAME[zoneName] || {
      zoneId: String(zoneName || '').toLowerCase().replace(/\s+/g, '-'),
      tier: 'Standard',
    }
  );
}

module.exports = { ZONE_BY_NAME, ALLOWED_TIMES, TARIFE, TARIF_KEYS, zoneMeta };
