const adminService = require('../services/adminService');

exports.overview = async (req, res) => {
  res.json(await adminService.overview());
};

exports.listUsers = async (req, res) => {
  res.json(await adminService.listUsers({ search: req.query.search || '', page: req.query.page }));
};

exports.banUser = async (req, res) => {
  res.json(await adminService.banUser(req.user, Number(req.params.id), (req.body || {}).reason));
};

exports.unbanUser = async (req, res) => {
  res.json(await adminService.unbanUser(req.user, Number(req.params.id)));
};

exports.listReports = async (req, res) => {
  res.json(await adminService.listReports(req.query.status || 'pending'));
};

exports.resolveReport = async (req, res) => {
  res.json(await adminService.resolveReport(req.user, Number(req.params.id), (req.body || {}).status));
};

exports.listPendingTypes = async (req, res) => {
  res.json(await adminService.listPendingTypes());
};

exports.approveType = async (req, res) => {
  res.json(await adminService.approveType(req.user, Number(req.params.id)));
};

exports.listLogs = async (req, res) => {
  res.json(await adminService.listLogs());
};
