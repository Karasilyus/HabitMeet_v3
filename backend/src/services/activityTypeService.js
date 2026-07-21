const activityTypeModel = require('../models/activityTypeModel');
const { sanitizeInput } = require('./authService');
const httpError = require('../utils/httpError');

async function listVisible(userId) {
  return activityTypeModel.listVisible(userId);
}

// Kullanıcı yeni tip önerir → onay bekler (admin onaylayınca herkese açılır).
// Admin/moderatör oluştururca doğrudan onaylı olur. Mükerrer isim engellenir.
async function create(user, name) {
  const clean = sanitizeInput(name);
  if (!clean || clean.length < 2) throw httpError(400, 'Aktivite tipi adı en az 2 karakter olmalıdır.');
  const existing = await activityTypeModel.findByName(clean);
  if (existing) return existing;
  const isApproved = ['admin', 'moderator'].includes(user.role) ? 1 : 0;
  return activityTypeModel.create({ name: clean, createdBy: user.id, isApproved });
}

module.exports = { listVisible, create };
