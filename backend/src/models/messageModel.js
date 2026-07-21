const db = require('../config/db');

async function listByMatch(matchId) {
  return db.query(
    `SELECT ms.*, u.name AS sender_name FROM messages ms
     JOIN users u ON u.id = ms.sender_id
     WHERE ms.match_id = $1 ORDER BY ms.id`,
    [matchId]
  );
}

async function create(matchId, senderId, body) {
  const rows = await db.query(
    'INSERT INTO messages (match_id, sender_id, body) VALUES ($1, $2, $3) RETURNING *',
    [matchId, senderId, body]
  );
  return rows[0];
}

async function markRead(matchId, readerId) {
  await db.query(
    'UPDATE messages SET is_read = 1 WHERE match_id = $1 AND sender_id != $2',
    [matchId, readerId]
  );
}

async function findById(id) {
  const rows = await db.query('SELECT * FROM messages WHERE id = $1', [id]);
  return rows[0] || null;
}

async function deleteById(id) {
  await db.query('DELETE FROM messages WHERE id = $1', [id]);
}

module.exports = { listByMatch, create, markRead, findById, deleteById };
