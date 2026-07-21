const db = require('../config/db');

async function upsert(userId, date, hours) {
  const rows = await db.query(
    `INSERT INTO sleep_logs (user_id, date, hours) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, date) DO UPDATE SET hours = EXCLUDED.hours RETURNING *`,
    [userId, date, hours]
  );
  return rows[0];
}

async function listByUser(userId, limit = 30) {
  return db.query(
    'SELECT date, hours FROM sleep_logs WHERE user_id = $1 ORDER BY date DESC LIMIT $2',
    [userId, limit]
  );
}

module.exports = { upsert, listByUser };
