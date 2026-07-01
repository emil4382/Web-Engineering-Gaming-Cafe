// pricing

'use strict';

const { TARIFE } = require('./seatLayout');

const TARIF_BY_KEY = new Map(TARIFE.map((t) => [ t.key, t]));

function computeTotal(tarif, units = 1) {
  const def = TARIF_BY_KEY.get( tarif );
  if (!def) {
    throw new Error( `Unknown tarif: ${tarif}`);
  }
  const qty = def.unit === 'hour' ? Math.max( 1,  Math.trunc(units ) || 1) : 1;
  const total = def.price * qty;
  return Math.round(total * 100) / 100;
}

module.exports = { computeTotal, TARIF_BY_KEY };
