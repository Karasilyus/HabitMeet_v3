-- Not defteri: kullanıcıya özel kişisel notlar.
CREATE TABLE IF NOT EXISTS notes (
  id __PK__,
  user_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at __TS__
);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
