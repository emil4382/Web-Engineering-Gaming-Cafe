// seat layout constants

'use strict';

// zones
const ZONE_BY_NAME = Object.freeze( {
  'Reihe Nord': { zoneId: 'reihe-nord', tier: 'Standard'  },
  'Reihe West': { zoneId: 'reihe-west', tier: 'Standard' },
  'Insel A': { zoneId: 'insel-a', tier: 'Standard'  },
  'Insel B': {  zoneId: 'insel-b', tier: 'Premium' },
  'Privat-Box': { zoneId: 'privat-box', tier: 'Privat' },
} );

// time slots
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

// tariffs
const TARIFE = Object.freeze( [
  {  key: 'starter', name: 'Starter', price: 5, unit: 'hour',  unitLabel: 'pro Stunde'  },
  { key: 'tagespass', name: 'Tagespass', price: 25,  unit: 'day', unitLabel: '10:00 – 22:00 Uhr', featured: true },
  { key: 'night', name: 'Night-Surfer', price: 18,  unit: 'night', unitLabel: '22:00 – 06:00 Uhr' },
  { key: 'vip', name: 'VIP-Monat', price: 89, unit: 'month', unitLabel: '30 Tage Flatrate' },
]);

const TARIF_KEYS = new Set(TARIFE.map((t) => t.key ));

// zone lookup
function zoneMeta( zoneName) {
  return (
    ZONE_BY_NAME[zoneName] || {
      zoneId: String(zoneName || '').toLowerCase().replace( /\s+/g, '-'),
      tier: 'Standard',
    }
  );
}

module.exports = { ZONE_BY_NAME,  ALLOWED_TIMES, TARIFE, TARIF_KEYS, zoneMeta  };
