/**
 * @file Content controllers — the public catalog GET endpoints.
 *
 * Thin handlers that validate query params, delegate to {@link contentService}
 * and send the JSON the frontend mock expects. Invalid query params raise a
 * {@link ValidationError} (`400` with `fields`); everything else is read-only.
 *
 * @module controllers/contentController
 */

'use strict';

const contentService = require('../services/contentService');
const { asyncHandler } = require('../lib/asyncHandler');
const { ValidationError } = require('../lib/errors');

/** Allowed leaderboard board types. @type {Set<string>} */
const BOARD_TYPES = new Set(['solo', 'team']);

/** Default leaderboard selection when params are omitted. */
const DEFAULT_GAME = 'valorant';
const DEFAULT_TYPE = 'solo';

/**
 * `GET /api/games?q=` — list featured games; optional `q` filters by name.
 *
 * @type {import('express').RequestHandler}
 */
const getGames = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (q !== undefined && typeof q !== 'string') {
    throw new ValidationError({ q: 'Suchbegriff muss Text sein.' });
  }
  const games = await contentService.getGames(q);
  res.status(200).json(games);
});

/**
 * `GET /api/menu` — list all gastro menu items.
 *
 * @type {import('express').RequestHandler}
 */
const getMenu = asyncHandler(async (_req, res) => {
  const menu = await contentService.getMenu();
  res.status(200).json(menu);
});

/**
 * `GET /api/tournaments?game=&status=` — list tournament cards.
 * Validates the optional `game` and `status` filters against the known enums.
 *
 * @type {import('express').RequestHandler}
 */
const getTournaments = asyncHandler(async (req, res) => {
  const { game, status } = req.query;
  const fields = {};

  if (game !== undefined && !contentService.GAME_SLUGS.has(game)) {
    fields.game = 'Unbekanntes Spiel.';
  }
  if (status !== undefined && !contentService.TOURNAMENT_STATUSES.has(status)) {
    fields.status = 'Unbekannter Status.';
  }
  if (Object.keys(fields).length > 0) {
    throw new ValidationError(fields);
  }

  const tournaments = await contentService.getTournaments({ game, status });
  res.status(200).json(tournaments);
});

/**
 * `GET /api/leaderboard?game=&type=` — derived ranked standings.
 *
 * Defaults: `game=valorant`, `type=solo`. Validates the enums and rejects the
 * impossible `fifa`+`team` combination (FIFA is solo-only).
 *
 * @type {import('express').RequestHandler}
 */
const getLeaderboard = asyncHandler(async (req, res) => {
  const game = req.query.game === undefined ? DEFAULT_GAME : req.query.game;
  const type = req.query.type === undefined ? DEFAULT_TYPE : req.query.type;
  const fields = {};

  if (!contentService.GAME_SLUGS.has(game)) {
    fields.game = 'Unbekanntes Spiel.';
  }
  if (!BOARD_TYPES.has(type)) {
    fields.type = "Typ muss 'solo' oder 'team' sein.";
  }
  if (!fields.game && !fields.type && game === 'fifa' && type === 'team') {
    fields.type = 'FIFA hat nur eine Solo-Rangliste.';
  }
  if (Object.keys(fields).length > 0) {
    throw new ValidationError(fields);
  }

  const board = await contentService.getLeaderboard(game, type);
  res.status(200).json(board);
});

/**
 * `GET /api/tarife` — the four static booking tariffs.
 *
 * @type {import('express').RequestHandler}
 */
const getTarife = asyncHandler(async (_req, res) => {
  res.status(200).json(contentService.getTarife());
});

module.exports = {
  getGames,
  getMenu,
  getTournaments,
  getLeaderboard,
  getTarife,
};
