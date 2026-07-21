const habitService = require('../services/habitService');

exports.list = async (req, res) => {
  res.json(await habitService.listWithStreaks(req.user.id));
};

exports.create = async (req, res) => {
  res.status(201).json(await habitService.createHabit(req.user.id, req.body || {}));
};

exports.update = async (req, res) => {
  res.json(await habitService.updateHabit(req.user.id, Number(req.params.id), req.body || {}));
};

exports.remove = async (req, res) => {
  await habitService.deleteHabit(req.user.id, Number(req.params.id));
  res.json({ message: 'Alışkanlık silindi.' });
};

exports.addLog = async (req, res) => {
  res.status(201).json(await habitService.addLog(req.user.id, Number(req.params.id), req.body || {}));
};

exports.getLogs = async (req, res) => {
  res.json(await habitService.getLogs(req.user.id, Number(req.params.id)));
};
