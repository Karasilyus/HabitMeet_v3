// Mesajlaşma kuralları (v2): yalnızca KABUL EDİLMİŞ eşleşmelerde,
// taraflar arasında engelleme yoksa. İçerik filtreden geçer.
const matchModel = require('../models/matchModel');
const messageModel = require('../models/messageModel');
const blockModel = require('../models/blockModel');
const { assertClean } = require('./contentFilter');
const { sanitizeInput } = require('./authService');
const httpError = require('../utils/httpError');

async function assertParticipant(matchId, userId) {
  const match = await matchModel.findById(matchId);
  if (!match) throw httpError(404, 'Eşleşme bulunamadı.');
  if (match.user_id1 !== userId && match.user_id2 !== userId) {
    throw httpError(403, 'Bu sohbete erişim yetkiniz yok.');
  }
  return match;
}

async function listForMatch(userId, matchId) {
  const match = await assertParticipant(matchId, userId);
  await messageModel.markRead(matchId, userId);
  const messages = await messageModel.listByMatch(matchId);
  return { match, messages };
}

async function send(userId, matchId, body) {
  const match = await assertParticipant(matchId, userId);
  if (match.status !== 'accepted') {
    throw httpError(400, 'Mesajlaşma için eşleşmenin kabul edilmiş olması gerekir.');
  }
  const otherId = match.user_id1 === userId ? match.user_id2 : match.user_id1;
  if (await blockModel.isBlockedBetween(userId, otherId)) {
    throw httpError(403, 'Bu kullanıcıyla mesajlaşamıyorsunuz.');
  }
  if (!body || !String(body).trim()) throw httpError(400, 'Mesaj boş olamaz.');
  assertClean(body);
  return messageModel.create(matchId, userId, sanitizeInput(body));
}

module.exports = { listForMatch, send };
