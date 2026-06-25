/**
 * @file Static configuration for the café floor plan, pricing and tournaments.
 *
 * This is the single source of truth for the *shape* of the room (zones, seat
 * codes, counts) used by the seat-map renderer, plus the booking tariffs, the
 * allowed booking time slots, the four tournament games and the game genres.
 *
 * It intentionally contains no seat *status* — availability comes from the API
 * (or the mock) so it can change per date/time.  Layout here mirrors the
 * design mockup `frontend/design/dm-buchung.html`.
 *
 * @module config/seatLayout
 */

/**
 * @typedef {Object} SeatZone
 * @property {string} id            Stable zone id (matches API/mock).
 * @property {string} name          Human-readable label shown in the UI.
 * @property {'desk-row'|'box'} kind  Render style of the zone.
 * @property {string} codePrefix    Prefix for seat codes (e.g. 'A' → A1, A2 …).
 * @property {number} count         Number of PCs/seats in the zone.
 * @property {string} [zoneGroup]   Floor-plan grouping (gaming / premium / box).
 * @property {('Standard'|'Premium'|'Privat')} tier  Comfort/price tier.
 * @property {number} [perBox]      For `kind: 'box'`, seats per box.
 */

/**
 * The seat zones of the PixelForge hall, laid out as a dense LAN-café floor:
 * a tight vertical stack of desk-rows that fills the hall width.
 *
 * - Gaming-Floor: six Standard desk-rows "Reihe A".."Reihe F", 8 PCs each
 *   (A1–A8 … F1–F8) → 48 PCs.
 * - One Premium desk-row "Reihe G · Premium" (G1–G8) → 8 PCs.
 * - Privat-Boxen: three boxes of 2 (P1–P6) → 6 PCs.
 *
 * Total = 48 + 8 + 6 = **62 PCs**.
 *
 * Each desk-row is rendered as two desks of four seats with a small aisle gap
 * (so it reads as tables, not one long bar). The renderer derives everything
 * from `kind`, `codePrefix`, `count`, `tier` and `name` — no pixel coordinates.
 *
 * @type {SeatZone[]}
 */
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

/**
 * Bookable start-time slots (24h, on the hour) offered in the booking form.
 * Mirrors the `<select id="bookingTime">` options in `index.html`.
 * @type {string[]}
 */
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

/**
 * @typedef {Object} Tarif
 * @property {string} key       Stable identifier used as the API value.
 * @property {string} name      Display name.
 * @property {number} price     Price in euros.
 * @property {'hour'|'day'|'night'|'month'} unit  Billing unit.
 * @property {string} unitLabel Human-readable unit (German).
 * @property {string[]} features  Selling points shown on the pricing card.
 * @property {boolean} [featured] Whether to highlight this tariff.
 */

/**
 * The four booking tariffs.  Prices mirror the pricing cards in `index.html`
 * (Starter 5 €/h · Tagespass 25 € · Night-Surfer 18 € · VIP-Monat 89 €).
 * @type {Tarif[]}
 */
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
      '5% Rabatt auf Gastro',
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
      '15% Gastro-Rabatt',
      'VIP-Only Events',
      'Express-Check-in',
    ],
  },
];

/**
 * @typedef {Object} TournamentGame
 * @property {string} key    Stable slug ('valorant' | 'fifa' | 'lol' | 'cs').
 * @property {string} name   Display name.
 * @property {'solo'|'team'} mode  Competition mode.
 * @property {string} accent Hex accent colour used by the tournament cards.
 */

/**
 * The four tournament games.  FIFA is solo (1v1); the rest are 5v5 team.
 * Accent colours mirror the `--accent` values in `tournaments.html`.
 * @type {TournamentGame[]}
 */
export const TOURNAMENT_GAMES = [
  { key: 'valorant', name: 'Valorant', mode: 'team', accent: '#ff5470' },
  { key: 'fifa', name: 'FIFA 25', mode: 'solo', accent: '#39ff88' },
  { key: 'lol', name: 'League of Legends', mode: 'team', accent: '#00e5ff' },
  { key: 'cs', name: 'Counter-Strike', mode: 'team', accent: '#8b5cff' },
];

/**
 * Game genres (categories from `SPIELE.md`), usable as filter chips.
 * @type {string[]}
 */
export const GENRES = [
  'Shooter / FPS',
  'MOBA',
  'Sport / Racing',
  'RPG / Adventure',
  'Fighting',
  'Sandbox / Survival',
  'Party / Co-op',
];
