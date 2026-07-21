const sleepModel = require('../models/sleepModel');
const { todayUtc } = require('./streakService');
const httpError = require('../utils/httpError');

async function addLog(userId, { date, hours }) {
  const logDate = date || todayUtc();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) throw httpError(400, 'Tarih formatı YYYY-MM-DD olmalıdır.');
  const h = Number(hours);
  if (!Number.isFinite(h) || h < 0 || h > 24) throw httpError(400, 'Uyku süresi 0-24 saat arasında olmalıdır.');
  return sleepModel.upsert(userId, logDate, h);
}

async function list(userId) {
  return sleepModel.listByUser(userId);
}

module.exports = { addLog, list };
