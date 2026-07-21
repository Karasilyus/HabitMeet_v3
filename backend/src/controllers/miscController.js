const activityTypeService = require('../services/activityTypeService');
const sleepService = require('../services/sleepService');
const statsService = require('../services/statsService');
const reportService = require('../services/reportService');
const blockService = require('../services/blockService');
const { NEIGHBORHOODS } = require('../constants/neighborhoods');

exports.listActivityTypes = async (req, res) => {
  res.json(await activityTypeService.listVisible(req.user.id));
};

exports.createActivityType = async (req, res) => {
  res.status(201).json(await activityTypeService.create(req.user, (req.body || {}).name));
};

exports.listSleep = async (req, res) => {
  res.json(await sleepService.list(req.user.id));
};

exports.addSleep = async (req, res) => {
  res.status(201).json(await sleepService.addLog(req.user.id, req.body || {}));
};

exports.stats = async (req, res) => {
  res.json(await statsService.userStats(req.user.id));
};

exports.createReport = async (req, res) => {
  await reportService.create(req.user.id, req.body || {});
  res.status(201).json({ message: 'Şikayetiniz alındı. Moderasyon ekibi inceleyecek.' });
};

exports.blockUser = async (req, res) => {
  res.json(await blockService.blockUser(req.user.id, (req.body || {}).userId));
};

exports.unblockUser = async (req, res) => {
  res.json(await blockService.unblockUser(req.user.id, Number(req.params.userId)));
};

exports.listBlocked = async (req, res) => {
  res.json(await blockService.listBlocked(req.user.id));
};

exports.neighborhoods = async (req, res) => {
  res.json(NEIGHBORHOODS);
};
