/**
 * @file Controllers for the team endpoints.
 *
 * Thin glue between routes and `teamService`. `req.user` is populated by
 * `requireAuth` (mounted in the route file). Validation throws
 * {@link ValidationError} (`400`); the service raises `404`/`403`/`409` as
 * appropriate. Async errors reach the central handler via `asyncHandler`.
 *
 * @module controllers/teamsController
 */

'use strict';

const teamService = require('../services/teamService');
const { validateCreateTeam, validateAddMember } = require('../validators/teamValidator');
const { ValidationError } = require('../lib/errors');

/**
 * Parse a positive-integer route param or throw a `400`.
 * @param {string} raw - The raw `:id` param.
 * @param {string} [field='id'] - Field name for the error.
 * @returns {number} The parsed id.
 */
function parseId(raw, field = 'id') {
  const id = Number.parseInt(raw, 10);
  if (!Number.isInteger(id) || id < 1) {
    throw new ValidationError({ [field]: 'Ungültige ID.' });
  }
  return id;
}

/**
 * `POST /api/teams` *(auth)* — create a team; the creator becomes captain.
 * `201 { team }`; `400` invalid; `409` name taken.
 * @type {import('express').RequestHandler}
 */
async function createTeam(req, res) {
  const input = validateCreateTeam(req.body);
  const team = await teamService.createTeam(input, req.user.id);
  res.status(201).json({ team });
}

/**
 * `GET /api/teams/:id` — a team with its members. `404` unknown id.
 * @type {import('express').RequestHandler}
 */
async function getTeam(req, res) {
  const id = parseId(req.params.id);
  const team = await teamService.getTeam(id);
  res.status(200).json({ team });
}

/**
 * `POST /api/teams/:id/members` *(captain)* — add a member by username.
 * `201 { member }`; `403` not captain; `404` user/team unknown; `409` already member.
 * @type {import('express').RequestHandler}
 */
async function addMember(req, res) {
  const id = parseId(req.params.id);
  const { username } = validateAddMember(req.body);
  const member = await teamService.addMember(id, username, req.user.id);
  res.status(201).json({ member });
}

/**
 * `GET /api/me/teams` *(auth)* — the session user's teams with their role.
 * @type {import('express').RequestHandler}
 */
async function listMyTeams(req, res) {
  const teams = await teamService.listMyTeams(req.user.id);
  res.status(200).json(teams);
}

module.exports = { createTeam, getTeam, addMember, listMyTeams };
