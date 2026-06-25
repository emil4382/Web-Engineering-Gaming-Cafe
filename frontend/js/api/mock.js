/**
 * @file Static mock data mirroring the backend seed.
 *
 * Used as a graceful fallback so the frontend is fully demoable as a *static
 * site* without the REST API running.  The shapes here match what the real
 * endpoints return (`/api/seats`, `/api/games`, `/api/menu`,
 * `/api/tournaments`, `/api/leaderboard`, `/api/content/tarife`).
 *
 * IMPORTANT: this module must be deterministic at import time — **no
 * `Math.random()`** — so seat states (and everything else) stay stable across
 * reloads.  Seat availability is derived from a fixed pattern instead.
 *
 * @module api/mock
 */

import { SEAT_ZONES, TARIFE, TOURNAMENT_GAMES } from '../config/seatLayout.js';

/* ------------------------------------------------------------------ */
/* Seats                                                              */
/* ------------------------------------------------------------------ */

/**
 * Resolve a deterministic seat status from the seat's flat index, giving a
 * stable ~70 % verfügbar / ~20 % belegt / ~10 % reserviert mix across the 62
 * PCs. No `Math.random()` → identical on every reload.
 *
 * A 10-slot repeating pattern provides the ratio (7 available, 2 occupied,
 * 1 reserved); the slots are interleaved so belegt/reserviert PCs are spread
 * across the floor instead of clumping at the end of each row.
 * @param {number} index - Zero-based position in the flat seat list.
 * @returns {'available'|'occupied'|'reserved'} The seat status.
 */
const STATUS_PATTERN = [
  'available', 'available', 'occupied', 'available', 'reserved',
  'available', 'available', 'occupied', 'available', 'available',
];
function seatStatus(index) {
  return STATUS_PATTERN[index % STATUS_PATTERN.length];
}

/**
 * Build the flat list of 62 seats from {@link SEAT_ZONES}.
 * Each seat carries its zone, label/code/tier and a deterministic status.
 * @returns {Array<{id:string,code:string,label:string,zoneId:string,zone:string,tier:string,status:string}>}
 */
function buildSeats() {
  const seats = [];
  let index = 0;
  for (const zone of SEAT_ZONES) {
    for (let i = 1; i <= zone.count; i++) {
      const code = `${zone.codePrefix}${i}`;
      seats.push({
        id: code,
        code,
        label: code,
        zoneId: zone.id,
        zone: zone.name,
        tier: zone.tier,
        status: seatStatus(index),
      });
      index += 1;
    }
  }
  return seats;
}

/** @type {Array} All 62 PCs with zone + label + tier + deterministic status. */
const seats = buildSeats();

/* ------------------------------------------------------------------ */
/* Games (from SPIELE.md)                                             */
/* ------------------------------------------------------------------ */

/**
 * Maps a game slug to its cover-image filename under `assets/games/`
 * (extensions vary: jpg/png/webp/avif/jpeg). Slugs not listed have no cover
 * and fall back to a designed poster tile.
 * @type {Readonly<Object<string,string>>}
 */
const GAME_IMAGES = {
  valorant: 'valorant.jpg',
  'counter-strike': 'counter-strike.jpg',
  fortnite: 'fortnite.jpg',
  'apex-legends': 'apex-legends.jpg',
  overwatch: 'overwatch.jpg',
  'cod-mwiii': 'cod-mwiii.jpg',
  'cod-warzone': 'cod-warzone.jpg',
  'rainbow-six-siege': 'rainbow-six-siege.webp',
  pubg: 'pubg.avif',
  'league-of-legends': 'league-of-legends.jpg',
  'dota-2': 'dota-2.jpg',
  deadlock: 'deadlock.jpg',
  fifa: 'fifa.jpg',
  'rocket-league': 'rocket-league.avif',
  'f1-24': 'f1-24.jpg',
  'assetto-corsa': 'assetto-corsa.png',
  'elden-ring': 'elden-ring.webp',
  'baldurs-gate-3': 'baldurs-gate-3.jpg',
  'cyberpunk-2077': 'cyberpunk-2077.jpg',
  'diablo-iv': 'diablo-iv.png',
  starfield: 'starfield.avif',
  'witcher-3': 'witcher-3.jpg',
  'tekken-8': 'tekken-8.jpg',
  'street-fighter-6': 'street-fighter-6.jpg',
  minecraft: 'minecraft.webp',
  terraria: 'terraria.png',
  rust: 'rust.avif',
  'gta-v': 'gta-v.png',
  'among-us': 'among-us.jpg',
  'fall-guys': 'fall-guys.webp',
  'hades-ii': 'hades-ii.jpeg',
  'clicky-keys': 'clicky-keys.png',
};

/**
 * Resolve a game's cover image path, or null when no asset exists.
 * @param {string} slug - Game slug.
 * @returns {string|null} Image path or null.
 */
function gameImage(slug) {
  return GAME_IMAGES[slug] ? `assets/games/${GAME_IMAGES[slug]}` : null;
}

/**
 * Raw game definitions mirroring `SPIELE.md`. The `slug` drives the image
 * lookup; `tournament` flags one of the four tournament titles.
 * @type {Array<{name:string,emoji:string,genre:string,slug:string,tournament?:boolean}>}
 */
const GAME_DEFS = [
  // Shooter / FPS
  { name: 'Valorant', emoji: '🎯', genre: 'Shooter / FPS', slug: 'valorant', tournament: true },
  { name: 'Counter-Strike 2', emoji: '🔫', genre: 'Shooter / FPS', slug: 'counter-strike', tournament: true },
  { name: 'Fortnite', emoji: '🏗️', genre: 'Shooter / FPS', slug: 'fortnite' },
  { name: 'Apex Legends', emoji: '🦾', genre: 'Shooter / FPS', slug: 'apex-legends' },
  { name: 'Overwatch 2', emoji: '🛡️', genre: 'Shooter / FPS', slug: 'overwatch' },
  { name: 'Call of Duty: Modern Warfare III', emoji: '💥', genre: 'Shooter / FPS', slug: 'cod-mwiii' },
  { name: 'Call of Duty: Warzone', emoji: '🪂', genre: 'Shooter / FPS', slug: 'cod-warzone' },
  { name: 'Rainbow Six Siege', emoji: '🏚️', genre: 'Shooter / FPS', slug: 'rainbow-six-siege' },
  { name: 'PUBG: Battlegrounds', emoji: '🍗', genre: 'Shooter / FPS', slug: 'pubg' },
  // MOBA
  { name: 'League of Legends', emoji: '⚔️', genre: 'MOBA', slug: 'league-of-legends', tournament: true },
  { name: 'Dota 2', emoji: '🗡️', genre: 'MOBA', slug: 'dota-2' },
  { name: 'Deadlock', emoji: '🔮', genre: 'MOBA', slug: 'deadlock' },
  // Sport / Racing
  { name: 'EA Sports FC 25 (FIFA 25)', emoji: '⚽', genre: 'Sport / Racing', slug: 'fifa', tournament: true },
  { name: 'Rocket League', emoji: '🚀', genre: 'Sport / Racing', slug: 'rocket-league' },
  { name: 'F1 24', emoji: '🏁', genre: 'Sport / Racing', slug: 'f1-24' },
  { name: 'Assetto Corsa', emoji: '🏎️', genre: 'Sport / Racing', slug: 'assetto-corsa' },
  // RPG / Adventure
  { name: 'Elden Ring', emoji: '🐉', genre: 'RPG / Adventure', slug: 'elden-ring' },
  { name: "Baldur's Gate 3", emoji: '🎲', genre: 'RPG / Adventure', slug: 'baldurs-gate-3' },
  { name: 'Cyberpunk 2077', emoji: '🤖', genre: 'RPG / Adventure', slug: 'cyberpunk-2077' },
  { name: 'Diablo IV', emoji: '😈', genre: 'RPG / Adventure', slug: 'diablo-iv' },
  { name: 'Starfield', emoji: '🌌', genre: 'RPG / Adventure', slug: 'starfield' },
  { name: 'The Witcher 3: Wild Hunt', emoji: '🐺', genre: 'RPG / Adventure', slug: 'witcher-3' },
  // Fighting
  { name: 'Tekken 8', emoji: '🥊', genre: 'Fighting', slug: 'tekken-8' },
  { name: 'Street Fighter 6', emoji: '👊', genre: 'Fighting', slug: 'street-fighter-6' },
  // Sandbox / Survival / Open World
  { name: 'Minecraft', emoji: '⛏️', genre: 'Sandbox / Survival', slug: 'minecraft' },
  { name: 'Terraria', emoji: '🌳', genre: 'Sandbox / Survival', slug: 'terraria' },
  { name: 'Rust', emoji: '🔩', genre: 'Sandbox / Survival', slug: 'rust' },
  { name: 'GTA V', emoji: '🚗', genre: 'Sandbox / Survival', slug: 'gta-v' },
  // Party / Co-op / Casual
  { name: 'Among Us', emoji: '👽', genre: 'Party / Co-op', slug: 'among-us' },
  { name: 'Clicky Keys', emoji: '⌨️', genre: 'Party / Co-op', slug: 'clicky-keys' },
  { name: 'Fall Guys', emoji: '🏃', genre: 'Party / Co-op', slug: 'fall-guys' },
  { name: 'Hades II', emoji: '🔥', genre: 'Party / Co-op', slug: 'hades-ii' },
];

/** @type {Array} 32 featured games with name, emoji, genre, slug and image path. */
const games = GAME_DEFS.map((g) => ({
  name: g.name,
  emoji: g.emoji,
  genre: g.genre,
  slug: g.slug,
  image: gameImage(g.slug),
  tournament: Boolean(g.tournament),
}));

/* ------------------------------------------------------------------ */
/* Gastro menu (from index.html)                                     */
/* ------------------------------------------------------------------ */

/** @type {Array<{name:string,emoji:string,desc:string,price:number,category:string}>} */
const menu = [
  // Snacks
  { name: 'Pizza Salami', emoji: '🍕', desc: 'Frisch gebacken, 28cm', price: 8.5, category: 'snacks' },
  { name: 'Gaming-Burger', emoji: '🍔', desc: '180g Beef, Bacon, Cheddar', price: 9.9, category: 'snacks' },
  { name: 'Loaded Nachos', emoji: '🌮', desc: 'Mit Käse, Jalapeños & Salsa', price: 7.5, category: 'snacks' },
  { name: 'Brezel-Sticks', emoji: '🥨', desc: 'Mit Kräuterbutter-Dip', price: 5.0, category: 'snacks' },
  { name: 'Pommes Frites', emoji: '🍟', desc: 'XL-Portion mit Dips', price: 6.0, category: 'snacks' },
  { name: 'Protein-Bowl', emoji: '🥗', desc: 'Quinoa, Avocado, Hühnchen', price: 11.0, category: 'snacks' },
  // Energy Drinks
  { name: 'Red Bull', emoji: '⚡', desc: '250ml Dose', price: 3.5, category: 'energy' },
  { name: 'Monster Energy', emoji: '⚡', desc: '500ml Dose, versch. Sorten', price: 4.0, category: 'energy' },
  { name: 'Gamer Fuel', emoji: '🧊', desc: 'Hausgemachter Energy-Mix', price: 5.5, category: 'energy' },
  // Kaffee & Heißgetränke
  { name: 'Espresso', emoji: '☕', desc: 'Doppelter Shot', price: 2.8, category: 'kaffee' },
  { name: 'Cappuccino', emoji: '🫗', desc: 'Mit Milchschaum', price: 4.0, category: 'kaffee' },
  { name: 'Matcha Latte', emoji: '🍵', desc: 'Heiß oder kalt', price: 4.8, category: 'kaffee' },
  { name: 'Flat White', emoji: '☕', desc: 'Perfekt für die Night-Session', price: 4.2, category: 'kaffee' },
  // Softdrinks
  { name: 'Coca-Cola', emoji: '🥤', desc: '0,5l Glasflasche', price: 3.0, category: 'soft' },
  { name: 'Mineralwasser', emoji: '💧', desc: '0,75l, mit/ohne Sprudel', price: 2.5, category: 'soft' },
  { name: 'Bubble Tea', emoji: '🧋', desc: 'Verschiedene Sorten', price: 5.0, category: 'soft' },
];

/* ------------------------------------------------------------------ */
/* Tournaments (the 4 games)                                          */
/* ------------------------------------------------------------------ */

/** @type {Array} Sample tournaments per game, mirroring tournaments.html. */
const tournaments = [
  {
    id: 1,
    game: 'valorant',
    title: 'Valorant 5v5 Cup',
    mode: 'team',
    date: '2026-06-22',
    format: '5v5 · Team',
    prize: 500,
    status: 'open',
    slots: 16,
    registered: 11,
  },
  {
    id: 2,
    game: 'fifa',
    title: 'FIFA 25 Championship',
    mode: 'solo',
    date: '2026-07-05',
    format: '1v1 · Solo',
    prize: 300,
    status: 'open',
    slots: 32,
    registered: 18,
  },
  {
    id: 3,
    game: 'lol',
    title: 'League of Legends Clash',
    mode: 'team',
    date: '2026-07-12',
    format: '5v5 · Team',
    prize: 400,
    status: 'full',
    slots: 8,
    registered: 8,
  },
  {
    id: 4,
    game: 'cs',
    title: 'Counter-Strike Major Night',
    mode: 'team',
    date: '2026-07-19',
    format: '5v5 · Team',
    prize: 350,
    status: 'open',
    slots: 16,
    registered: 9,
  },
];

/* ------------------------------------------------------------------ */
/* Leaderboards (solo + team standings)                              */
/* ------------------------------------------------------------------ */

/**
 * Solo standings keyed by game (all four tournament games have a solo board).
 * @type {Object<string, Array<{rank:number,name:string,points:number,delta:number}>>}
 */
const leaderboardsSolo = {
  valorant: [
    { rank: 1, name: 'xX_ShadowBlade_Xx', points: 920, delta: 2 },
    { rank: 2, name: 'NeonFury99', points: 780, delta: -1 },
    { rank: 3, name: 'PixelQueen', points: 715, delta: 1 },
    { rank: 4, name: 'AimBot3000', points: 688, delta: 0 },
    { rank: 5, name: 'NightOwl_GG', points: 642, delta: 3 },
    { rank: 6, name: 'RocketRanger', points: 601, delta: -2 },
    { rank: 7, name: 'PhantomStrike', points: 564, delta: 1 },
    { rank: 8, name: 'LootGoblin', points: 529, delta: 0 },
  ],
  fifa: [
    { rank: 1, name: 'GoalMachine', points: 880, delta: 1 },
    { rank: 2, name: 'TikiTaka_Tom', points: 760, delta: 0 },
    { rank: 3, name: 'NutmegNico', points: 690, delta: 2 },
    { rank: 4, name: 'BicycleKickBen', points: 610, delta: -1 },
    { rank: 5, name: 'OffsideOlli', points: 540, delta: 0 },
  ],
  lol: [
    { rank: 1, name: 'MidLaneMage', points: 905, delta: 2 },
    { rank: 2, name: 'JungleDiff', points: 800, delta: -1 },
    { rank: 3, name: 'BaronSteal', points: 730, delta: 1 },
    { rank: 4, name: 'WardBot', points: 655, delta: 0 },
    { rank: 5, name: 'PentaPete', points: 590, delta: 1 },
  ],
  cs: [
    { rank: 1, name: 'OneTapOscar', points: 915, delta: 1 },
    { rank: 2, name: 'ClutchKing', points: 795, delta: 0 },
    { rank: 3, name: 'SmokeCriminal', points: 720, delta: -1 },
    { rank: 4, name: 'EcoFragger', points: 640, delta: 2 },
    { rank: 5, name: 'AWPandita', points: 575, delta: 0 },
  ],
};

/**
 * Team standings keyed by game (only the three 5v5 games have team boards;
 * FIFA is solo-only). Mirrors leaderboard.html.
 * @type {Object<string, Array<{rank:number,name:string,players:number,points:number,delta:number}>>}
 */
const leaderboardsTeam = {
  valorant: [
    { rank: 1, name: 'Neon Vipers', players: 5, points: 920, delta: 2 },
    { rank: 2, name: 'Shadow Syndicate', players: 5, points: 780, delta: -1 },
    { rank: 3, name: 'Pixel Reapers', players: 5, points: 715, delta: 1 },
    { rank: 4, name: 'Cyber Wolves', players: 4, points: 688, delta: 0 },
    { rank: 5, name: 'Quantum Aces', players: 5, points: 642, delta: 3 },
    { rank: 6, name: 'Frost Legion', players: 5, points: 601, delta: -2 },
    { rank: 7, name: 'Crimson Echo', players: 4, points: 564, delta: 1 },
    { rank: 8, name: 'Void Runners', players: 5, points: 529, delta: 0 },
  ],
  lol: [
    { rank: 1, name: 'Rift Wardens', players: 5, points: 890, delta: 1 },
    { rank: 2, name: 'Baron Barons', players: 5, points: 770, delta: 0 },
    { rank: 3, name: 'Nexus Knights', players: 5, points: 700, delta: 2 },
    { rank: 4, name: 'Dragon Soul', players: 4, points: 630, delta: -1 },
    { rank: 5, name: 'Inhibitor Inc', players: 5, points: 560, delta: 0 },
  ],
  cs: [
    { rank: 1, name: 'Headshot Hooligans', players: 5, points: 905, delta: 2 },
    { rank: 2, name: 'Smoke & Mirrors', players: 5, points: 785, delta: -1 },
    { rank: 3, name: 'Bomb Squad', players: 5, points: 710, delta: 0 },
    { rank: 4, name: 'Retake Republic', players: 4, points: 645, delta: 1 },
    { rank: 5, name: 'Eco Warriors', players: 5, points: 580, delta: 0 },
  ],
};

/**
 * Combined leaderboards container. `solo`/`team` are keyed by game slug.
 * `boards` lists which (game, type) boards exist (4 solo + 3 team).
 */
const leaderboards = {
  solo: leaderboardsSolo,
  team: leaderboardsTeam,
  boards: [
    { game: 'fifa', type: 'solo' },
    { game: 'valorant', type: 'solo' },
    { game: 'valorant', type: 'team' },
    { game: 'lol', type: 'solo' },
    { game: 'lol', type: 'team' },
    { game: 'cs', type: 'solo' },
    { game: 'cs', type: 'team' },
  ],
};

/* ------------------------------------------------------------------ */
/* Tarife (re-export from config so there is one source of truth)    */
/* ------------------------------------------------------------------ */

/** @type {Array} The four booking tariffs (see config/seatLayout.js). */
const tarife = TARIFE;

/* ------------------------------------------------------------------ */
/* Public mock dataset                                               */
/* ------------------------------------------------------------------ */

/**
 * The full mock dataset consumed by the API fallback layer.
 * @type {{
 *   seats: Array,
 *   games: Array,
 *   menu: Array,
 *   tournaments: Array,
 *   leaderboards: Object,
 *   tarife: Array,
 *   tournamentGames: Array
 * }}
 */
export const MOCK = {
  seats,
  games,
  menu,
  tournaments,
  leaderboards,
  tarife,
  tournamentGames: TOURNAMENT_GAMES,
};

export default MOCK;
