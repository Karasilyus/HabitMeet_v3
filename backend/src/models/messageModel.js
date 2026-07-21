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

module.exports = { listByMatch, create, markRead };
