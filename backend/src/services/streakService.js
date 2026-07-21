// Streak hesaplama — DB bağımlılığı yok, saf fonksiyon (unit test edilebilir).
// Bugünden geriye doğru ardışık completed günleri sayar. UTC kullanır.
function calculateStreak(logs, referenceDate = new Date()) {
  const completedDates = new Set(
    (logs || [])
      .filter((l) => l.completed === 1 || l.completed === true)
      .map((l) => l.date)
  );
  let streak = 0;
  const d = new Date(Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  ));
  for (;;) {
    const iso = d.toISOString().slice(0, 10);
    if (!completedDates.has(iso)) break;
    streak += 1;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return streak;
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = { calculateStreak, todayUtc };
