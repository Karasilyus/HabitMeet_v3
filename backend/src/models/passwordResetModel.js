const db = require('../config/db');

async function create(userId, token, expiresAt) {
  await db.query(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
}

async function findValidByToken(token) {
  const rows = await db.query(
    'SELECT * FROM password_resets WHERE token = $1 AND used = 0',
    [token]
  );
  return rows[0] || null;
}

async function markUsed(id) {
  await db.query('UPDATE password_resets SET used = 1 WHERE id = $1', [id]);
}

module.exports = { create, findValidByToken, markUsed };
