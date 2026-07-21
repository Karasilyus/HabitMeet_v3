const statsModel = require('../models/statsModel');
const habitModel = require('../models/habitModel');
const { calculateStreak } = require('./streakService');

async function userStats(userId) {
  const totals = await statsModel.userTotals(userId);
  const habits = await habitModel.findByUser(userId);
  let bestStreak = 0;
  for (const habit of habits) {
    const logs = await habitModel.findLogsByHabit(habit.id);
    bestStreak = Math.max(bestStreak, calculateStreak(logs));
  }
  return { ...totals, bestCurrentStreak: bestStreak };
}

module.exports = { userStats };
