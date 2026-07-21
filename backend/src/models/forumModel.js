const db = require('../config/db');

const POST_SELECT = `
  SELECT p.*, u.name AS author_name, at.name AS type_name,
         (SELECT COUNT(*) FROM forum_comments c WHERE c.post_id = p.id) AS comment_count
  FROM forum_posts p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN activity_types at ON at.id = p.type_id`;

async function listPosts() {
  return db.query(POST_SELECT + ' ORDER BY p.id DESC LIMIT 100');
}

async function listPostsByType(typeId) {
  return db.query(POST_SELECT + ' WHERE p.type_id = $1 ORDER BY p.id DESC LIMIT 100', [typeId]);
}

async function createPost({ userId, typeId, title, body }) {
  const rows = await db.query(
    'INSERT INTO forum_posts (user_id, type_id, title, body) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, typeId || null, title, body]
  );
  return rows[0];
}

async function findPostById(id) {
  const rows = await db.query('SELECT * FROM forum_posts WHERE id = $1', [id]);
  return rows[0] || null;
}

async function updatePost(id, { title, body }) {
  const rows = await db.query(
    'UPDATE forum_posts SET title = $1, body = $2 WHERE id = $3 RETURNING *',
    [title, body, id]
  );
  return rows[0];
}

async function deletePost(id) {
  await db.query('DELETE FROM forum_comments WHERE post_id = $1', [id]);
  await db.query('DELETE FROM forum_posts WHERE id = $1', [id]);
}

async function listComments(postId) {
  return db.query(
    `SELECT c.*, u.name AS author_name FROM forum_comments c
     JOIN users u ON u.id = c.user_id WHERE c.post_id = $1 ORDER BY c.id`,
    [postId]
  );
}

async function createComment({ postId, userId, body }) {
  const rows = await db.query(
    'INSERT INTO forum_comments (post_id, user_id, body) VALUES ($1, $2, $3) RETURNING *',
    [postId, userId, body]
  );
  return rows[0];
}

async function findCommentById(id) {
  const rows = await db.query('SELECT * FROM forum_comments WHERE id = $1', [id]);
  return rows[0] || null;
}

async function deleteComment(id) {
  await db.query('DELETE FROM forum_comments WHERE id = $1', [id]);
}

module.exports = {
  listPosts, listPostsByType, createPost, findPostById, updatePost, deletePost,
  listComments, createComment, findCommentById, deleteComment,
};
