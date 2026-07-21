const habitModel = require('../models/habitModel');
const activityTypeModel = require('../models/activityTypeModel');
const matchService = require('./matchService');
const { calculateStreak, todayUtc } = require('./streakService');
const { sanitizeInput } = require('./authService');
const httpError = require('../utils/httpError');

async function assertOwnership(habitId, userId) {
  const habit = await habitModel.findById(habitId);
  if (!habit) throw httpError(404, 'Alışkanlık bulunamadı.');
  if (habit.user_id !== userId) throw httpError(403, 'Bu alışkanlık size ait değil.');
  return habit;
}

async function listWithStreaks(userId) {
  const habits = await habitModel.findByUser(userId);
  const result = [];
  for (const habit of habits) {
    const logs = await habitModel.findLogsByHabit(habit.id);
    result.push({
      ...habit,
      streak: calculateStreak(logs),
      loggedToday: logs.some((l) => l.date === todayUtc() && (l.completed === 1 || l.completed === true)),
    });
  }
  return result;
}

async function createHabit(userId, { name, typeId }) {
  if (!name || String(name).trim().length < 2) throw httpError(400, 'Alışkanlık adı en az 2 karakter olmalıdır.');
  if (typeId) {
    const type = await activityTypeModel.findById(typeId);
    if (!type) throw httpError(400, 'Geçersiz aktivite tipi.');
  }
  return habitModel.create({ userId, name: sanitizeInput(name), typeId });
}

async function updateHabit(userId, habitId, { name, typeId }) {
  const habit = await assertOwnership(habitId, userId);
  return habitModel.update(habitId, {
    name: name ? sanitizeInput(name) : habit.name,
    typeId: typeId !== undefined ? typeId : habit.type_id,
  });
}

async function deleteHabit(userId, habitId) {
  await assertOwnership(habitId, userId);
  await habitModel.remove(habitId);
}

// Log ekle + streak hesapla + eşleşme motorunu tetikle.
async function addLog(userId, habitId, { date, completed = true } = {}) {
  await assertOwnership(habitId, userId);
  const logDate = date || todayUtc();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) throw httpError(400, 'Tarih formatı YYYY-MM-DD olmalıdır.');
  if (logDate > todayUtc()) throw httpError(400, 'Gelecek tarihe log giremezsiniz.');
  const log = await habitModel.upsertLog(habitId, logDate, completed);
  const logs = await habitModel.findLogsByHabit(habitId);
  const streak = calculateStreak(logs);
  const newMatches = await matchService.processMatchesAfterLog(userId, habitId);
  return { log, streak, newMatchCount: newMatches.length };
}

async function getLogs(userId, habitId) {
  await assertOwnership(habitId, userId);
  const logs = await habitModel.findLogsByHabit(habitId);
  return { logs, streak: calculateStreak(logs) };
}

module.exports = { listWithStreaks, createHabit, updateHabit, deleteHabit, addLog, getLogs };
