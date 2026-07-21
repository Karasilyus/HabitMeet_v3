// Eşleşme algoritması (v2):
// - Aynı ilçe + aynı aktivite tipi + iki tarafta da yeterli streak.
// - Eşik .env'den okunur (soğuk başlangıç: düşük başlat — lansman planı 15.4).
// - Eşleşme artık otomatik aktif olmaz: 'pending' oluşur, karşı taraf kabul etmelidir (15.3).
// - Engellenen kullanıcılarla eşleşme oluşmaz.
const habitModel = require('../models/habitModel');
const userModel = require('../models/userModel');
const matchModel = require('../models/matchModel');
const blockModel = require('../models/blockModel');
const { calculateStreak } = require('./streakService');
const httpError = require('../utils/httpError');

function minStreakDays() {
  return parseInt(process.env.MIN_STREAK_DAYS || '3', 10);
}

async function processMatchesAfterLog(userId, habitId) {
  const habit = await habitModel.findById(habitId);
  if (!habit || !habit.type_id) return [];

  const myLogs = await habitModel.findLogsByHabit(habitId);
  if (calculateStreak(myLogs) < minStreakDays()) return [];

  const user = await userModel.findById(userId);
  if (!user) return [];

  const candidates = await habitModel.findCandidates(habit.type_id, user.neighborhood, userId);
  const created = [];
  for (const candidate of candidates) {
    const candidateLogs = await habitModel.findLogsByHabit(candidate.id);
    if (calculateStreak(candidateLogs) < minStreakDays()) continue;
    if (await blockModel.isBlockedBetween(userId, candidate.user_id)) continue;
    const [u1, u2] = userId < candidate.user_id
      ? [userId, candidate.user_id]
      : [candidate.user_id, userId];
    const existing = await matchModel.findExisting(u1, u2, habit.type_id);
    if (existing) continue;
    created.push(await matchModel.create(u1, u2, habit.type_id, userId));
  }
  return created;
}

async function listForUser(userId) {
  return matchModel.findByUser(userId);
}

// Eşleşme isteğine yanıt: yalnızca isteği başlatmayan taraf kabul/red edebilir.
async function respond(matchId, userId, accept) {
  const match = await matchModel.findById(matchId);
  if (!match) throw httpError(404, 'Eşleşme bulunamadı.');
  if (match.user_id1 !== userId && match.user_id2 !== userId) {
    throw httpError(403, 'Bu eşleşme size ait değil.');
  }
  if (match.status !== 'pending') throw httpError(400, 'Bu eşleşme zaten yanıtlanmış.');
  if (match.requested_by === userId) {
    throw httpError(400, 'Karşı tarafın yanıtı bekleniyor.');
  }
  await matchModel.updateStatus(matchId, accept ? 'accepted' : 'rejected');
  return { id: matchId, status: accept ? 'accepted' : 'rejected' };
}

module.exports = { processMatchesAfterLog, listForUser, respond, minStreakDays };
