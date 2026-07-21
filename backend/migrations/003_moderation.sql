-- Moderasyon katmanı: şikayet kuyruğu (status ile) ve admin audit log.
-- (Admin paneli gereksinimleri — yol haritası 14.2)

CREATE TABLE IF NOT EXISTS reports (
  id __PK__,
  reporter_id INTEGER NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by INTEGER REFERENCES users(id),
  created_at __TS__
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id __PK__,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id INTEGER,
  detail TEXT,
  created_at __TS__
);
