const db = require('../config/db');

async function listByUser(userId) {
  return db.query('SELECT * FROM notes WHERE user_id = $1 ORDER BY id DESC', [userId]);
}

async function create(userId, body) {
  const rows = await db.query(
    'INSERT INTO notes (user_id, body) VALUES ($1, $2) RETURNING *',
    [userId, body]
  );
  return rows[0];
}

async function findById(id) {
  const rows = await db.query('SELECT * FROM notes WHERE id = $1', [id]);
  return rows[0] || null;
}

async function update(id, body) {
  const rows = await db.query('UPDATE notes SET body = $1 WHERE id = $2 RETURNING *', [body, id]);
  return rows[0];
}

async function remove(id) {
  await db.query('DELETE FROM notes WHERE id = $1', [id]);
}

module.exports = { listByUser, create, findById, update, remove };
