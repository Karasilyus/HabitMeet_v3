const db = require('../config/db');

async function create({ reporterId, targetType, targetId, reason }) {
  const rows = await db.query(
    `INSERT INTO reports (reporter_id, target_type, target_id, reason)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [reporterId, targetType, targetId, reason]
  );
  return rows[0];
}

async function listByStatus(status) {
  return db.query(
    `SELECT r.*, u.name AS reporter_name FROM reports r
     JOIN users u ON u.id = r.reporter_id
     WHERE r.status = $1 ORDER BY r.id DESC LIMIT 200`,
    [status]
  );
}

async function findById(id) {
  const rows = await db.query('SELECT * FROM reports WHERE id = $1', [id]);
  return rows[0] || null;
}

async function updateStatus(id, status, resolvedBy) {
  await db.query('UPDATE reports SET status = $1, resolved_by = $2 WHERE id = $3', [
    status, resolvedBy, id,
  ]);
}

module.exports = { create, listByStatus, findById, updateStatus };
