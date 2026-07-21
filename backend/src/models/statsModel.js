const db = require('../config/db');

async function countTable(table) {
  const rows = await db.query(`SELECT COUNT(*) AS c FROM ${table}`);
  return Number(rows[0].c);
}

// created_at hem SQLite (TEXT) hem PG (TIMESTAMPTZ) ile karşılaştırılabilsin diye
// parametre 'YYYY-MM-DD' formatında gönderilir.
async function signupsSince(dateStr) {
  const rows = await db.query('SELECT COUNT(*) AS c FROM users WHERE created_at >= $1', [dateStr]);
  return Number(rows[0].c);
}

async function usersByNeighborhood() {
  return db.query(
    `SELECT neighborhood, COUNT(*) AS user_count FROM users
     WHERE deleted_at IS NULL GROUP BY neighborhood ORDER BY user_count DESC LIMIT 10`
  );
}

async function popularTypes() {
  return db.query(
    `SELECT at.name, COUNT(h.id) AS habit_count FROM habits h
     JOIN activity_types at ON at.id = h.type_id
     GROUP BY at.name ORDER BY habit_count DESC LIMIT 10`
  );
}

async function userTotals(userId) {
  const habits = await db.query('SELECT COUNT(*) AS c FROM habits WHERE user_id = $1', [userId]);
  const logs = await db.query(
    `SELECT COUNT(*) AS c FROM habit_logs hl JOIN habits h ON h.id = hl.habit_id
     WHERE h.user_id = $1 AND hl.completed = 1`,
    [userId]
  );
  const matches = await db.query(
    `SELECT COUNT(*) AS c FROM matches
     WHERE (user_id1 = $1 OR user_id2 = $1) AND status = 'accepted'`,
    [userId]
  );
  return {
    totalHabits: Number(habits[0].c),
    totalCompletedLogs: Number(logs[0].c),
    acceptedMatches: Number(matches[0].c),
  };
}

module.exports = { countTable, signupsSince, usersByNeighborhood, popularTypes, userTotals };
