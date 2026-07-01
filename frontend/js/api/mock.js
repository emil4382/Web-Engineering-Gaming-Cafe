// mock data

import { SEAT_ZONES, TARIFE,  TOURNAMENT_GAMES  } from '../config/seatLayout.js';

// seats
const STATUS_PATTERN = [
  'available', 'available', 'occupied', 'available', 'reserved',
  'available', 'available', 'occupied', 'available', 'available',
];
function seatStatus( index) {
  return STATUS_PATTERN[index % STATUS_PATTERN.length ];
}

function buildSeats() {
  const seats = [ ];
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

const seats = buildSeats();

// game images
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

function gameImage(slug) {
  return GAME_IMAGES[slug] ? `assets/games/${GAME_IMAGES[slug]}` : null;
}

// games
const GAME_DEFS = [
  { name: 'Clicky Keys', emoji: '⌨️', genre: 'Party / Co-op',  slug: 'clicky-keys', featured: true },
  // Shooter / FPS
  { name: 'Valorant', emoji: '🎯', genre: 'Shooter / FPS',  slug: 'valorant', tournament: true },
  { name: 'Counter-Strike 2', emoji: '🔫', genre: 'Shooter / FPS', slug: 'counter-strike', tournament: true },
  { name: 'Fortnite',  emoji: '🏗️',  genre: 'Shooter / FPS', slug: 'fortnite'  },
  {  name: 'Apex Legends', emoji: '🦾', genre: 'Shooter / FPS', slug: 'apex-legends' },
  { name: 'Overwatch 2', emoji: '🛡️', genre: 'Shooter / FPS', slug: 'overwatch' },
  { name: 'Call of Duty: Modern Warfare III', emoji: '💥',  genre: 'Shooter / FPS', slug: 'cod-mwiii' },
  { name: 'Call of Duty: Warzone',  emoji: '🪂', genre: 'Shooter / FPS', slug: 'cod-warzone'  },
  { name: 'Rainbow Six Siege', emoji: '🏚️',  genre: 'Shooter / FPS', slug: 'rainbow-six-siege'  },
  { name: 'PUBG: Battlegrounds', emoji: '🍗',  genre: 'Shooter / FPS', slug: 'pubg' },
  // MOBA
  {  name: 'League of Legends',  emoji: '⚔️', genre: 'MOBA', slug: 'league-of-legends',  tournament: true },
  { name: 'Dota 2',  emoji: '🗡️', genre: 'MOBA',  slug: 'dota-2' },
  { name: 'Deadlock', emoji: '🔮', genre: 'MOBA', slug: 'deadlock'  },
  // Sport / Racing
  { name: 'EA Sports FC 25 (FIFA 25)',  emoji: '⚽', genre: 'Sport / Racing', slug: 'fifa', tournament: true },
  { name: 'Rocket League', emoji: '🚀', genre: 'Sport / Racing', slug: 'rocket-league'  },
  { name: 'F1 24', emoji: '🏁', genre: 'Sport / Racing', slug: 'f1-24' },
  { name: 'Assetto Corsa', emoji: '🏎️',  genre: 'Sport / Racing',  slug: 'assetto-corsa' },
  // RPG / Adventure
  { name: 'Elden Ring', emoji: '🐉', genre: 'RPG / Adventure', slug: 'elden-ring' },
  { name: "Baldur's Gate 3",  emoji: '🎲', genre: 'RPG / Adventure', slug: 'baldurs-gate-3' },
  { name: 'Cyberpunk 2077',  emoji: '🤖', genre: 'RPG / Adventure', slug: 'cyberpunk-2077' },
  { name: 'Diablo IV', emoji: '😈',  genre: 'RPG / Adventure', slug: 'diablo-iv' },
  { name: 'Starfield', emoji: '🌌',  genre: 'RPG / Adventure', slug: 'starfield' },
  {  name: 'The Witcher 3: Wild Hunt',  emoji: '🐺',  genre: 'RPG / Adventure', slug: 'witcher-3' },
  // Fighting
  { name: 'Tekken 8',  emoji: '🥊', genre: 'Fighting', slug: 'tekken-8' },
  { name: 'Street Fighter 6', emoji: '👊', genre: 'Fighting', slug: 'street-fighter-6' },
  // Sandbox / Survival / Open World
  { name: 'Minecraft', emoji: '⛏️', genre: 'Sandbox / Survival', slug: 'minecraft' },
  { name: 'Terraria', emoji: '🌳', genre: 'Sandbox / Survival', slug: 'terraria' },
  { name: 'Rust', emoji: '🔩', genre: 'Sandbox / Survival', slug: 'rust' },
  { name: 'GTA V', emoji: '🚗',  genre: 'Sandbox / Survival', slug: 'gta-v'  },
  // Party / Co-op / Casual
  { name: 'Among Us',  emoji: '👽', genre: 'Party / Co-op',  slug: 'among-us' },
  { name: 'Fall Guys', emoji: '🏃', genre: 'Party / Co-op', slug: 'fall-guys'  },
  { name: 'Hades II', emoji: '🔥', genre: 'Party / Co-op', slug: 'hades-ii' },
];

const games = GAME_DEFS.map((g) => ({
  name: g.name,
  emoji: g.emoji,
  genre: g.genre,
  slug: g.slug,
  image: gameImage(g.slug),
  tournament: Boolean(g.tournament),
  featured: Boolean(g.featured),
} ));

// tournaments
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

// tarife
const tarife = TARIFE;

export const MOCK = {
  seats,
  games,
  tournaments,
  tarife,
  tournamentGames: TOURNAMENT_GAMES,
};

export default MOCK;
