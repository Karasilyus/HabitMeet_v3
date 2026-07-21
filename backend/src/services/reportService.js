const reportModel = require('../models/reportModel');
const { sanitizeInput } = require('./authService');
const httpError = require('../utils/httpError');

const VALID_TARGETS = ['user', 'forum_post', 'forum_comment', 'message'];

async function create(reporterId, { targetType, targetId, reason }) {
  if (!VALID_TARGETS.includes(targetType)) throw httpError(400, 'Geçersiz şikayet türü.');
  if (!Number(targetId)) throw httpError(400, 'Geçersiz hedef.');
  if (!reason || String(reason).trim().length < 5) throw httpError(400, 'Şikayet nedeni en az 5 karakter olmalıdır.');
  return reportModel.create({
    reporterId,
    targetType,
    targetId: Number(targetId),
    reason: sanitizeInput(reason),
  });
}

module.exports = { create };
