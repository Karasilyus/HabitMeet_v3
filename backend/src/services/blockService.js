// Kullanıcı engelleme (lansman planı 15.3): engellenince aradaki eşleşmeler de kapatılır.
const blockModel = require('../models/blockModel');
const matchModel = require('../models/matchModel');
const userModel = require('../models/userModel');
const httpError = require('../utils/httpError');

async function blockUser(userId, targetId) {
  const target = Number(targetId);
  if (!target || target === userId) throw httpError(400, 'Geçersiz kullanıcı.');
  const targetUser = await userModel.findById(target);
  if (!targetUser) throw httpError(404, 'Kullanıcı bulunamadı.');
  await blockModel.create(userId, target);
  await matchModel.rejectBetween(userId, target);
  return { message: 'Kullanıcı engellendi.' };
}

async function unblockUser(userId, targetId) {
  await blockModel.remove(userId, Number(targetId));
  return { message: 'Engel kaldırıldı.' };
}

async function listBlocked(userId) {
  return blockModel.listByUser(userId);
}

module.exports = { blockUser, unblockUser, listBlocked };
