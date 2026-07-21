const messageService = require('../services/messageService');

exports.list = async (req, res) => {
  res.json(await messageService.listForMatch(req.user.id, Number(req.params.matchId)));
};

exports.send = async (req, res) => {
  res.status(201).json(await messageService.send(req.user.id, Number(req.params.matchId), (req.body || {}).body));
};

// Mesaj silme.
exports.remove = async (req, res) => {
  res.json(await messageService.removeMessage(req.user.id, Number(req.params.messageId)));
};
