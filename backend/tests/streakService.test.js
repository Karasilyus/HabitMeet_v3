const { calculateStreak } = require('../src/services/streakService');

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

describe('calculateStreak', () => {
  test('log yoksa 0 döner', () => {
    expect(calculateStreak([])).toBe(0);
  });

  test('bugün tamamlanmamışsa 0 döner', () => {
    const logs = [
      { date: daysAgo(1), completed: 1 },
      { date: daysAgo(2), completed: 1 },
    ];
    expect(calculateStreak(logs)).toBe(0);
  });

  test('ardışık günler doğru sayılır', () => {
    const logs = [
      { date: daysAgo(0), completed: 1 },
      { date: daysAgo(1), completed: 1 },
      { date: daysAgo(2), completed: 1 },
    ];
    expect(calculateStreak(logs)).toBe(3);
  });

  test('ilk boşlukta durur (dün completed=false ise streak=1)', () => {
    const logs = [
      { date: daysAgo(0), completed: 1 },
      { date: daysAgo(1), completed: 0 },
      { date: daysAgo(2), completed: 1 },
    ];
    expect(calculateStreak(logs)).toBe(1);
  });

  test('2 günlük streak (bugün + dün)', () => {
    const logs = [
      { date: daysAgo(0), completed: 1 },
      { date: daysAgo(1), completed: true },
    ];
    expect(calculateStreak(logs)).toBe(2);
  });
});
