const db = require('../config/db');

async function create({ name, email, password, neighborhood, role = 'user' }) {
  const rows = await db.query(
    `INSERT INTO users (name, email, password, neighborhood, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, email, password, neighborhood, role]
  );
  return rows[0];
}

async function findByEmail(email) {
  const rows = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const rows = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function setPassword(id, password) {
  await db.query('UPDATE users SET password = $1 WHERE id = $2', [password, id]);
}

async function setBan(id, banned, reason = null) {
  await db.query('UPDATE users SET is_banned = $1, ban_reason = $2 WHERE id = $3', [
    banned ? 1 : 0,
    reason,
    id,
  ]);
}

// KVKK: hesap silme = soft delete + kişisel verilerin anonimleştirilmesi.
async function softDelete(id) {
  await db.query(
    `UPDATE users SET name = 'Silinmiş Kullanıcı', email = $1, password = '', deleted_at = $2 WHERE id = $3`,
    ['deleted_' + id + '@habitmeet.local', new Date().toISOString(), id]
  );
}

async function list({ search = '', limit = 20, offset = 0 }) {
  return db.query(
    `SELECT id, name, email, neighborhood, role, is_banned, ban_reason, deleted_at, created_at
     FROM users WHERE (name LIKE $1 OR email LIKE $1)
     ORDER BY id DESC LIMIT $2 OFFSET $3`,
    ['%' + search + '%', limit, offset]
  );
}

module.exports = { create, findByEmail, findById, setPassword, setBan, softDelete, list };
