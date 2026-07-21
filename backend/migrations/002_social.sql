-- Sosyal katman: eşleşmeler (kabul/red modeli), mesajlar, forum, engelleme.
-- v2 yenilikleri: matches.status (pending/accepted/rejected) + requested_by,
-- blocks tablosu (kullanıcı güvenliği — lansman planı 15.3).

CREATE TABLE IF NOT EXISTS matches (
  id __PK__,
  user_id1 INTEGER NOT NULL REFERENCES users(id),
  user_id2 INTEGER NOT NULL REFERENCES users(id),
  type_id INTEGER NOT NULL REFERENCES activity_types(id),
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by INTEGER NOT NULL REFERENCES users(id),
  created_at __TS__,
  UNIQUE(user_id1, user_id2, type_id),
  CHECK (user_id1 < user_id2)
);

CREATE TABLE IF NOT EXISTS messages (
  id __PK__,
  match_id INTEGER NOT NULL REFERENCES matches(id),
  sender_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at __TS__
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id __PK__,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type_id INTEGER REFERENCES activity_types(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at __TS__
);

CREATE TABLE IF NOT EXISTS forum_comments (
  id __PK__,
  post_id INTEGER NOT NULL REFERENCES forum_posts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at __TS__
);

CREATE TABLE IF NOT EXISTS blocks (
  id __PK__,
  blocker_id INTEGER NOT NULL REFERENCES users(id),
  blocked_id INTEGER NOT NULL REFERENCES users(id),
  created_at __TS__,
  UNIQUE(blocker_id, blocked_id)
);
