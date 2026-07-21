const db = require('../config/db');

// Audit log: hangi admin, ne zaman, neyi yaptı (yol haritası 14.2e).
async function create({ adminId, action, targetType = null, targetId = null, detail = null }) {
  await db.query(
    `INSERT INTO admin_logs (admin_id, action, target_type, target_id, detail)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminId, action, targetType, targetId, detail]
  );
}

async function list(limit = 100) {
  return db.query(
    `SELECT al.*, u.name AS admin_name FROM admin_logs al
     JOIN users u ON u.id = al.admin_id ORDER BY al.id DESC LIMIT $1`,
    [limit]
  );
}

module.exports = { create, list };
