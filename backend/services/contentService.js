// content service

'use strict';

const {  query } = require('../db/pool');
const { TARIFE } = require('../lib/seatLayout');

const GAME_SLUGS = new Set(['valorant', 'fifa', 'lol',  'cs' ]);

const TOURNAMENT_STATUSES = new Set([
  'angekuendigt',
  'anmeldung_offen',
  'laufend',
  'abgeschlossen',
]);

// games
async function getGames( q) {
  const term = typeof q === 'string' ? q.trim( ) : '';
  const where = term ? 'WHERE name LIKE ?' : '';
  const params = term ? [`%${term}%`] : [ ];
  const rows = await query(
    `SELECT name, emoji, genre, image_url, featured FROM games ${where} ORDER BY featured DESC, name ASC`,
    params,
  );
  return rows.map(( g) => ({
    name: g.name,
    emoji: g.emoji,
    genre: g.genre,
    image: g.image_url ?? null,
    featured: Boolean(g.featured),
  }));
}

// tournaments
async function getTournaments(filter = {}) {
  const clauses = [ ];
  const params = [];
  if (filter.game) {
    clauses.push( 't.game = ?');
    params.push(filter.game);
  }
  if ( filter.status) {
    clauses.push('t.status = ?');
    params.push(filter.status );
  } else {
    clauses.push("t.status <> 'abgeschlossen'");
  }
  const where = clauses.length ? `WHERE ${clauses.join( ' AND ' )}` : '';

  const rows = await query(
    `SELECT t.id, t.game, t.title, t.mode, t.date, t.format, t.prize,
            t.max_participants, t.status,
            (SELECT COUNT(*) FROM registrations r WHERE r.tournament_id = t.id) AS registered
       FROM tournaments t
       ${where}
      ORDER BY t.date IS NULL, t.date ASC, t.id ASC`,
    params,
  );

  return rows.map((t) => ({
    id: t.id,
    game: t.game,
    title: t.title,
    mode: t.mode,
    date: t.date ?? null,
    format: t.format ?? null,
    prize: t.prize ?? null,
    status: t.status,
    slots: t.max_participants ?? null,
    registered: Number( t.registered),
  }));
}

// tarife
function getTarife() {
  return TARIFE.map((t) => ({ ...t } ));
}

module.exports = {
  GAME_SLUGS,
  TOURNAMENT_STATUSES,
  getGames,
  getTournaments,
  getTarife,
};
