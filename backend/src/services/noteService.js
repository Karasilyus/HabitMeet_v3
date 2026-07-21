// Not defteri: kullanıcıya özel kişisel alan. İçerik başkalarına görünmediği
// için moderasyon filtresinden geçmez; arayüz XSS'e karşı zaten kaçış uygular.
const noteModel = require('../models/noteModel');
const httpError = require('../utils/httpError');

const MAX_LEN = 5000;

function validateBody(body) {
  if (!body || !String(body).trim()) throw httpError(400, 'Not boş olamaz.');
  if (String(body).length > MAX_LEN) throw httpError(400, `Not en fazla ${MAX_LEN} karakter olabilir.`);
}

async function assertOwnership(noteId, userId) {
  const note = await noteModel.findById(noteId);
  if (!note) throw httpError(404, 'Not bulunamadı.');
  if (note.user_id !== userId) throw httpError(403, 'Bu not size ait değil.');
  return note;
}

async function list(userId) {
  return noteModel.listByUser(userId);
}

async function create(userId, body) {
  validateBody(body);
  return noteModel.create(userId, String(body).trim());
}

async function update(userId, noteId, body) {
  await assertOwnership(noteId, userId);
  validateBody(body);
  return noteModel.update(noteId, String(body).trim());
}

async function remove(userId, noteId) {
  await assertOwnership(noteId, userId);
  await noteModel.remove(noteId);
  return { message: 'Not silindi.' };
}

module.exports = { list, create, update, remove };
