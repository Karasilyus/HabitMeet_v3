const matchService = require('../services/matchService');

exports.list = async (req, res) => {
  res.json(await matchService.listForUser(req.user.id));
};

exports.respond = async (req, res) => {
  const accept = !!(req.body || {}).accept;
  res.json(await matchService.respond(Number(req.params.id), req.user.id, accept));
};
