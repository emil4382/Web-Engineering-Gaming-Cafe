// room config

// seat zones
export const SEAT_ZONES = [
  {
    id: 'reihe-a',
    name: 'Reihe A',
    kind: 'desk-row',
    codePrefix: 'A',
    count: 8,
    zoneGroup: 'gaming-floor',
    tier: 'Standard',
  },
  {
    id: 'reihe-b',
    name: 'Reihe B',
    kind: 'desk-row',
    codePrefix: 'B',
    count: 8,
    zoneGroup: 'gaming-floor',
    tier: 'Standard',
  },
  {
    id: 'reihe-c',
    name: 'Reihe C',
    kind: 'desk-row',
    codePrefix: 'C',
    count: 8,
    zoneGroup: 'gaming-floor',
    tier: 'Standard',
   },
  {
    id: 'reihe-d',
    name: 'Reihe D',
    kind: 'desk-row',
    codePrefix: 'D',
    count: 8,
    zoneGroup: 'gaming-floor',
    tier: 'Standard',
  },
  {
    id: 'reihe-e',
    name: 'Reihe E',
    kind: 'desk-row',
    codePrefix: 'E',
    count: 8,
    zoneGroup: 'gaming-floor',
    tier: 'Standard',
   },
  {
    id: 'reihe-f',
    name: 'Reihe F',
    kind: 'desk-row',
    codePrefix: 'F',
    count: 8,
    zoneGroup: 'gaming-floor',
    tier: 'Standard',
  },
  {
    id: 'reihe-g',
    name: 'Reihe G · Premium',
    kind: 'desk-row',
    codePrefix: 'G',
    count: 8,
    zoneGroup: 'premium',
    tier: 'Premium',
  },
  {
    id: 'privat-boxen',
    name: 'Privat-Boxen',
    kind: 'box',
    codePrefix: 'P',
    count: 6,
    perBox: 2,
    zoneGroup: 'box',
    tier: 'Privat',
  },
];

// times
export const ALLOWED_TIMES = [
  '10:00',
  '12:00',
  '14:00',
  '16:00',
  '18:00',
  '20:00',
  '22:00',
  '00:00',
];

// tarife
export const TARIFE = [
  {
    key: 'starter',
    name: 'Starter',
    price: 5,
    unit: 'hour',
    unitLabel: 'pro Stunde',
    features: [
      'High-End Gaming-PC',
      '1 Gbit/s Internet',
      'Zugang zur Spiele-Bibliothek',
      'Komfortabler Gaming-Stuhl',
    ],
  },
  {
    key: 'tagespass',
    name: 'Tagespass',
    price: 25,
    unit: 'day',
    unitLabel: '10:00 – 22:00 Uhr',
    featured: true,
    features: [
      'Unbegrenzte Spielzeit (12h)',
      '1 Gratis Energy-Drink',
      'Reservierter Premium-Platz',
      '5% Rabatt auf Snacks & Getränke',
      'Priority-Queue bei Turnieren',
    ],
  },
  {
    key: 'night',
    name: 'Night-Surfer',
    price: 18,
    unit: 'night',
    unitLabel: '22:00 – 06:00 Uhr',
    features: [
      '8 Stunden Nacht-Tarif',
      'Ruhige Atmosphäre',
      '2 Kaffee inklusive',
      'Perfekt für Nachtschwärmer',
    ],
  },
  {
    key: 'vip',
    name: 'VIP-Monat',
    price: 89,
    unit: 'month',
    unitLabel: '30 Tage Flatrate',
    features: [
      'Unbegrenzter Zugang',
      'Eigener Schließfach-Spind',
      '15% Rabatt auf Snacks & Getränke',
      'VIP-Only Events',
      'Express-Check-in',
    ],
  },
];

// tournament games
export const TOURNAMENT_GAMES = [
  { key: 'valorant', name: 'Valorant', mode: 'team', accent: '#ff5470', image: 'assets/games/valorant.jpg' },
  { key: 'fifa', name: 'FIFA 25', mode: 'solo', accent: '#39ff88', image: 'assets/games/fifa.jpg'  },
  { key: 'lol',  name: 'League of Legends', mode: 'team', accent: '#00e5ff', image: 'assets/games/league-of-legends.jpg' },
  { key: 'cs', name: 'Counter-Strike', mode: 'team', accent: '#8b5cff', image: 'assets/games/counter-strike.jpg' },
];

// genres
export const GENRES = [
  'Shooter / FPS',
  'MOBA',
  'Sport / Racing',
  'RPG / Adventure',
  'Fighting',
  'Sandbox / Survival',
  'Party / Co-op',
];
