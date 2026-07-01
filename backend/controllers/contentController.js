// catalog controllers

'use strict';

const contentService = require('../services/contentService');
const { asyncHandler } = require('../lib/asyncHandler');
const { ValidationError } = require('../lib/errors' );

// games
const getGames = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (q !== undefined && typeof q !== 'string') {
    throw new ValidationError({ q: 'Suchbegriff muss Text sein.' });
  }
  const games = await contentService.getGames(q);
  res.status(200).json( games);
} );

// tournaments
const getTournaments = asyncHandler( async (req, res) => {
  const { game, status  } = req.query;
  const fields = {};

  if (game !== undefined && !contentService.GAME_SLUGS.has(game)) {
    fields.game = 'Unbekanntes Spiel.';
  }
  if (status !== undefined && !contentService.TOURNAMENT_STATUSES.has(status)) {
    fields.status = 'Unbekannter Status.';
  }
  if (Object.keys(fields).length > 0 ) {
    throw new ValidationError( fields );
  }

  const tournaments = await contentService.getTournaments({ game, status });
  res.status(200).json(tournaments);
});

// tarife
const getTarife = asyncHandler(async (_req, res ) => {
  res.status(200).json(contentService.getTarife());
});

module.exports = {
  getGames,
  getTournaments,
  getTarife,
};
