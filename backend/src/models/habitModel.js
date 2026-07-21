const db = require('../config/db');

async function create({ userId, name, typeId }) {
  const rows = await db.query(
    'INSERT INTO habits (user_id, name, type_id) VALUES ($1, $2, $3) RETURNING *',
    [userId, name, typeId || null]
  );
  return rows[0];
}

async function findByUser(userId) {
  return db.query(
    `SELECT h.*, at.name AS type_name FROM habits h
     LEFT JOIN activity_types at ON at.id = h.type_id
     WHERE h.user_id = $1 ORDER BY h.id DESC`,
    [userId]
  );
}

async function findById(id) {
  const rows = await db.query('SELECT * FROM habits WHERE id = $1', [id]);
  return rows[0] || null;
}

async function update(id, { name, typeId }) {
  const rows = await db.query(
    'UPDATE habits SET name = $1, type_id = $2 WHERE id = $3 RETURNING *',
    [name, typeId || null, id]
  );
  return rows[0];
}

async function remove(id) {
  await db.query('DELETE FROM habit_logs WHERE habit_id = $1', [id]);
  await db.query('DELETE FROM habits WHERE id = $1', [id]);
}

// Eşleşme adayları: aynı aktivite tipi + aynı bölge + banlı/silinmiş olmayan kullanıcılar.
async function findCandidates(typeId, neighborhood, excludeUserId) {
  return db.query(
    `SELECT h.id, h.user_id FROM habits h
     JOIN users u ON u.id = h.user_id
     WHERE h.type_id = $1 AND u.neighborhood = $2 AND h.user_id != $3
       AND u.is_banned = 0 AND u.deleted_at IS NULL`,
    [typeId, neighborhood, excludeUserId]
  );
}

// Log ekleme: aynı güne ikinci kayıt upsert olur (UNIQUE(habit_id, date)).
async function upsertLog(habitId, date, completed) {
  const rows = await db.query(
    `INSERT INTO habit_logs (habit_id, date, completed) VALUES ($1, $2, $3)
     ON CONFLICT (habit_id, date) DO UPDATE SET completed = EXCLUDED.completed
     RETURNING *`,
    [habitId, date, completed ? 1 : 0]
  );
  return rows[0];
}

async function findLogsByHabit(habitId) {
  return db.query(
    'SELECT date, completed FROM habit_logs WHERE habit_id = $1 ORDER BY date DESC',
    [habitId]
  );
}

module.exports = { create, findByUser, findById, update, remove, findCandidates, upsertLog, findLogsByHabit };
