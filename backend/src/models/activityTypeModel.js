const db = require('../config/db');

async function create({ name, createdBy, isApproved = 0 }) {
  const rows = await db.query(
    'INSERT INTO activity_types (name, created_by, is_approved) VALUES ($1, $2, $3) RETURNING *',
    [name, createdBy, isApproved]
  );
  return rows[0];
}

async function findByName(name) {
  const rows = await db.query('SELECT * FROM activity_types WHERE LOWER(name) = LOWER($1)', [name]);
  return rows[0] || null;
}

async function findById(id) {
  const rows = await db.query('SELECT * FROM activity_types WHERE id = $1', [id]);
  return rows[0] || null;
}

// Onaylanmış tipler + kullanıcının kendi oluşturdukları (onay beklese bile görsün).
async function listVisible(userId) {
  return db.query(
    'SELECT * FROM activity_types WHERE is_approved = 1 OR created_by = $1 ORDER BY name',
    [userId]
  );
}

async function listPending() {
  return db.query(
    `SELECT at.*, u.name AS creator_name FROM activity_types at
     LEFT JOIN users u ON u.id = at.created_by
     WHERE at.is_approved = 0 ORDER BY at.id`
  );
}

async function approve(id) {
  await db.query('UPDATE activity_types SET is_approved = 1 WHERE id = $1', [id]);
}

async function remove(id) {
  await db.query('DELETE FROM activity_types WHERE id = $1', [id]);
}

module.exports = { create, findByName, findById, listVisible, listPending, approve, remove };
