// team controllers

'use strict';

const teamService = require('../services/teamService');
const { validateCreateTeam, validateAddMember } = require('../validators/teamValidator' );
const { ValidationError } = require('../lib/errors' );

// helpers
function parseId(raw, field = 'id' ) {
  const id = Number.parseInt( raw, 10);
  if ( !Number.isInteger(id ) || id < 1) {
    throw new ValidationError({  [field]: 'Ungültige ID.' });
  }
  return id;
}

// handlers
async function createTeam(req, res) {
  const input = validateCreateTeam(req.body);
  const team = await teamService.createTeam(input, req.user.id);
  res.status(201).json({ team });
}

async function getTeam(req, res) {
  const id = parseId(req.params.id);
  const team = await teamService.getTeam(id);
  res.status(200).json({ team });
}

async function addMember(req, res) {
  const id = parseId(req.params.id);
  const { username } = validateAddMember(req.body);
  const member = await teamService.addMember(id, username, req.user.id);
  res.status(201).json({ member  });
}

async function listMyTeams(req,  res) {
  const teams = await teamService.listMyTeams(req.user.id);
  res.status(200).json(teams);
}

module.exports = { createTeam,  getTeam,  addMember, listMyTeams };
