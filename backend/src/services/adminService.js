// Admin paneli iş mantığı (yol haritası 14.2): dashboard, kullanıcı yönetimi,
// şikayet kuyruğu, aktivite tipi onayı. Tüm işlemler audit log'a yazılır.
const userModel = require('../models/userModel');
const reportModel = require('../models/reportModel');
const adminLogModel = require('../models/adminLogModel');
const activityTypeModel = require('../models/activityTypeModel');
const statsModel = require('../models/statsModel');
const httpError = require('../utils/httpError');

async function overview() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return {
    totals: {
      users: await statsModel.countTable('users'),
      habits: await statsModel.countTable('habits'),
      logs: await statsModel.countTable('habit_logs'),
      matches: await statsModel.countTable('matches'),
      forumPosts: await statsModel.countTable('forum_posts'),
      messages: await statsModel.countTable('messages'),
    },
    signupsLast7Days: await statsModel.signupsSince(sevenDaysAgo),
    usersByNeighborhood: await statsModel.usersByNeighborhood(),
    popularTypes: await statsModel.popularTypes(),
    pendingReports: (await reportModel.listByStatus('pending')).length,
  };
}

async function listUsers({ search = '', page = 1 }) {
  const limit = 20;
  const offset = (Math.max(1, Number(page) || 1) - 1) * limit;
  return userModel.list({ search, limit, offset });
}

async function banUser(admin, userId, reason) {
  const target = await userModel.findById(userId);
  if (!target) throw httpError(404, 'Kullanıcı bulunamadı.');
  if (target.role === 'admin') throw httpError(403, 'Admin hesabı banlanamaz.');
  await userModel.setBan(userId, true, reason || 'Kural ihlali');
  await adminLogModel.create({
    adminId: admin.id, action: 'ban_user', targetType: 'user', targetId: Number(userId),
    detail: reason || null,
  });
  return { message: 'Kullanıcı askıya alındı.' };
}

async function unbanUser(admin, userId) {
  await userModel.setBan(userId, false, null);
  await adminLogModel.create({
    adminId: admin.id, action: 'unban_user', targetType: 'user', targetId: Number(userId),
  });
  return { message: 'Kullanıcının askısı kaldırıldı.' };
}

async function listReports(status = 'pending') {
  if (!['pending', 'resolved', 'dismissed'].includes(status)) {
    throw httpError(400, 'Geçersiz durum filtresi.');
  }
  return reportModel.listByStatus(status);
}

async function resolveReport(admin, reportId, status) {
  if (!['resolved', 'dismissed'].includes(status)) throw httpError(400, 'Geçersiz işlem.');
  const report = await reportModel.findById(reportId);
  if (!report) throw httpError(404, 'Şikayet bulunamadı.');
  await reportModel.updateStatus(reportId, status, admin.id);
  await adminLogModel.create({
    adminId: admin.id, action: status === 'resolved' ? 'resolve_report' : 'dismiss_report',
    targetType: 'report', targetId: Number(reportId),
  });
  return { message: 'Şikayet güncellendi.' };
}

async function listPendingTypes() {
  return activityTypeModel.listPending();
}

async function approveType(admin, typeId) {
  const type = await activityTypeModel.findById(typeId);
  if (!type) throw httpError(404, 'Aktivite tipi bulunamadı.');
  await activityTypeModel.approve(typeId);
  await adminLogModel.create({
    adminId: admin.id, action: 'approve_type', targetType: 'activity_type', targetId: Number(typeId),
    detail: type.name,
  });
  return { message: 'Aktivite tipi onaylandı.' };
}

async function listLogs() {
  return adminLogModel.list();
}

module.exports = {
  overview, listUsers, banUser, unbanUser,
  listReports, resolveReport, listPendingTypes, approveType, listLogs,
};
