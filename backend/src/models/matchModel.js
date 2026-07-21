const db = require('../config/db');

async function findExisting(userId1, userId2, typeId) {
  const rows = await db.query(
    'SELECT * FROM matches WHERE user_id1 = $1 AND user_id2 = $2 AND type_id = $3',
    [userId1, userId2, typeId]
  );
  return rows[0] || null;
}

async function create(userId1, userId2, typeId, requestedBy) {
  const rows = await db.query(
    `INSERT INTO matches (user_id1, user_id2, type_id, status, requested_by)
     VALUES ($1, $2, $3, 'pending', $4) RETURNING *`,
    [userId1, userId2, typeId, requestedBy]
  );
  return rows[0];
}

async function findById(id) {
  const rows = await db.query('SELECT * FROM matches WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findByUser(userId) {
  return db.query(
    `SELECT m.*, at.name AS type_name,
            CASE WHEN m.user_id1 = $1 THEN m.user_id2 ELSE m.user_id1 END AS other_user_id,
            u.name AS other_user_name, u.neighborhood AS other_neighborhood,
            (SELECT COUNT(*) FROM messages ms
              WHERE ms.match_id = m.id AND ms.is_read = 0 AND ms.sender_id != $1) AS unread_count
     FROM matches m
     JOIN activity_types at ON at.id = m.type_id
     JOIN users u ON u.id = CASE WHEN m.user_id1 = $1 THEN m.user_id2 ELSE m.user_id1 END
     WHERE m.user_id1 = $1 OR m.user_id2 = $1
     ORDER BY m.id DESC`,
    [userId]
  );
}

async function updateStatus(id, status) {
  await db.query('UPDATE matches SET status = $1 WHERE id = $2', [status, id]);
}

// Engelleme sonrası: iki kullanıcı arasındaki bekleyen/kabul edilmiş eşleşmeler kapatılır.
async function rejectBetween(userA, userB) {
  const [u1, u2] = userA < userB ? [userA, userB] : [userB, userA];
  await db.query(
    `UPDATE matches SET status = 'rejected' WHERE user_id1 = $1 AND user_id2 = $2`,
    [u1, u2]
  );
}

module.exports = { findExisting, create, findById, findByUser, updateStatus, rejectBetween };
