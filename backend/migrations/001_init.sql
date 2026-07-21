-- Temel tablolar: kullanıcılar, aktivite tipleri, alışkanlıklar, loglar.
-- v2 yenilikleri: users.role (RBAC), is_banned/ban_reason (moderasyon),
-- deleted_at (KVKK soft delete), activity_types.is_approved (admin onayı).

CREATE TABLE IF NOT EXISTS users (
  id __PK__,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  is_banned INTEGER NOT NULL DEFAULT 0,
  ban_reason TEXT,
  deleted_at TEXT,
  created_at __TS__
);

CREATE TABLE IF NOT EXISTS activity_types (
  id __PK__,
  name TEXT UNIQUE NOT NULL,
  is_approved INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at __TS__
);

CREATE TABLE IF NOT EXISTS habits (
  id __PK__,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  type_id INTEGER REFERENCES activity_types(id),
  created_at __TS__
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id __PK__,
  habit_id INTEGER NOT NULL REFERENCES habits(id),
  date TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 1,
  UNIQUE(habit_id, date)
);

CREATE TABLE IF NOT EXISTS sleep_logs (
  id __PK__,
  user_id INTEGER NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  hours REAL NOT NULL,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS password_resets (
  id __PK__,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
