// Veritabanı katmanı: DATABASE_URL varsa PostgreSQL, yoksa SQLite (better-sqlite3).
// Tüm sorgular PostgreSQL stilinde ($1, $2) yazılır; SQLite'a otomatik çevrilir.
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const usePg = !!process.env.DATABASE_URL;
let pool = null;
let sqlite = null;

if (usePg) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
  });
} else {
  const Database = require('better-sqlite3');
  const dbPath = process.env.DATABASE_PATH
    ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
    : path.join(__dirname, '../../data/habitmeet.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
}

// $1, $2... parametrelerini SQLite '?' formatına çevirir.
// Aynı parametre birden fazla kez kullanılabilir ($1 ... $1) — param listesi genişletilir.
function convertForSqlite(sql, params) {
  const outParams = [];
  const outSql = sql.replace(/\$(\d+)/g, (_, n) => {
    outParams.push(params[Number(n) - 1]);
    return '?';
  });
  return { sql: outSql, params: outParams };
}

// Tek sorgu çalıştırır. SELECT / RETURNING için satır dizisi döner,
// diğer sorgular için { changes, lastInsertRowid } döner.
async function query(sql, params = []) {
  if (usePg) {
    const res = await pool.query(sql, params);
    return res.rows;
  }
  const { sql: s, params: p } = convertForSqlite(sql, params);
  const stmt = sqlite.prepare(s);
  if (stmt.reader) return stmt.all(p);
  const info = stmt.run(p);
  return { changes: info.changes, lastInsertRowid: Number(info.lastInsertRowid) };
}

// Çoklu statement içeren SQL blokları (migration dosyaları) için.
async function exec(sqlText) {
  if (usePg) {
    await pool.query(sqlText);
    return;
  }
  sqlite.exec(sqlText);
}

module.exports = { query, exec, usePg };
