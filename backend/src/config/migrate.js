// Migration çalıştırıcı: schema_migrations tablosuyla geçmişi takip eder.
// Her dosya yalnızca bir kez çalışır (v1'deki 'takipsiz migration' sorunu çözüldü).
// __PK__ ve __TS__ tokenları dialekte göre çevrilir (SQLite / PostgreSQL).
const fs = require('fs');
const path = require('path');
const db = require('./db');

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

function adapt(sql) {
  if (db.usePg) {
    return sql
      .replace(/__PK__/g, 'SERIAL PRIMARY KEY')
      .replace(/__TS__/g, 'TIMESTAMPTZ DEFAULT NOW()');
  }
  return sql
    .replace(/__PK__/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/__TS__/g, "TEXT DEFAULT (datetime('now'))");
}

async function runMigrations() {
  const tsCol = db.usePg ? 'TIMESTAMPTZ DEFAULT NOW()' : "TEXT DEFAULT (datetime('now'))";
  await db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, run_at ${tsCol})`
  );
  const done = new Set(
    (await db.query('SELECT filename FROM schema_migrations')).map((r) => r.filename)
  );
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = adapt(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
    await db.exec(sql);
    await db.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    console.log('Migration çalıştı:', file);
  }
}

module.exports = { runMigrations };
