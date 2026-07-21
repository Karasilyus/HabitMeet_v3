const noteService = require('../services/noteService');

exports.list = async (req, res) => {
  res.json(await noteService.list(req.user.id));
};

exports.create = async (req, res) => {
  res.status(201).json(await noteService.create(req.user.id, (req.body || {}).body));
};

exports.update = async (req, res) => {
  res.json(await noteService.update(req.user.id, Number(req.params.id), (req.body || {}).body));
};

exports.remove = async (req, res) => {
  res.json(await noteService.remove(req.user.id, Number(req.params.id)));
};
