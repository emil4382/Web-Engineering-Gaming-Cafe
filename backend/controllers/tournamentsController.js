/**
 * @file Controllers for the tournament WRITE endpoints.
 *
 * Thin glue between routes and `tournamentService`: register, staff-create and
 * staff-record-results. `req.user` is populated by `requireAuth`/`requireStaff`
 * (mounted in the route file). The GET (list/detail) endpoints live in the
 * content layer; this controller owns only the writes. Async errors reach the
 * central handler via `asyncHandler`.
 *
 * @module controllers/tournamentsController
 */

'use strict';

const tournamentService = require('../services/tournamentService');
const {
  validateCreateTournament,
  validateRegister,
  validateResults,
} = require('../validators/tournamentValidator');
const { ValidationError } = require('../lib/errors');

/**
 * Parse a positive-integer `:id` param or throw a `400`.
 * @param {string} raw - The raw param.
 * @returns {number} The parsed id.
 */
function parseId(raw) {
  const id = Number.parseInt(raw, 10);
  if (!Number.isInteger(id) || id < 1) {
    throw new ValidationError({ id: 'Ungültige Turnier-ID.' });
  }
  return id;
}

/**
 * `POST /api/tournaments/:id/register` *(auth)* — sign up the session user
 * (solo) or their team (team mode). `201 { registration }`; `400` wrong mode;
 * `403` not captain; `409` full/duplicate.
 * @type {import('express').RequestHandler}
 */
async function register(req, res) {
  const tournamentId = parseId(req.params.id);
  const { team_id: teamId } = validateRegister(req.body);
  const registration = await tournamentService.register(tournamentId, {
    userId: req.user.id,
    teamId: teamId ?? undefined,
  });
  res.status(201).json({ registration });
}

/**
 * `POST /api/tournaments` *(staff)* — create a tournament.
 * `201 { tournament }`; `400` invalid.
 * @type {import('express').RequestHandler}
 */
async function createTournament(req, res) {
  const input = validateCreateTournament(req.body);
  const tournament = await tournamentService.createTournament(input);
  res.status(201).json({ tournament });
}

/**
 * `POST /api/tournaments/:id/results` *(staff)* — record placements; the server
 * computes points. `201 { results }`; `400` invalid; `404` unknown tournament.
 * @type {import('express').RequestHandler}
 */
async function recordResults(req, res) {
  const tournamentId = parseId(req.params.id);
  const { results } = validateResults(req.body);
  const recorded = await tournamentService.recordResults(tournamentId, results);
  res.status(201).json({ results: recorded });
}

module.exports = { register, createTournament, recordResults };
