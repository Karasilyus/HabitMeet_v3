const db = require('../config/db');

async function create(blockerId, blockedId) {
  await db.query(
    `INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)
     ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
    [blockerId, blockedId]
  );
}

async function remove(blockerId, blockedId) {
  await db.query('DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2', [blockerId, blockedId]);
}

// Yönden bağımsız kontrol: taraflardan biri diğerini engellediyse true.
async function isBlockedBetween(userA, userB) {
  const rows = await db.query(
    `SELECT 1 AS b FROM blocks
     WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)
     LIMIT 1`,
    [userA, userB]
  );
  return rows.length > 0;
}

async function listByUser(blockerId) {
  return db.query(
    `SELECT b.blocked_id, u.name AS blocked_name FROM blocks b
     JOIN users u ON u.id = b.blocked_id WHERE b.blocker_id = $1`,
    [blockerId]
  );
}

module.exports = { create, remove, isBlockedBetween, listByUser };
