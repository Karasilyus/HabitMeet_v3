// Forum: erken dönemde canlılık için eşleşme şartı ARANMAZ (lansman planı 15.4/5).
const forumModel = require('../models/forumModel');
const { assertClean } = require('./contentFilter');
const { sanitizeInput } = require('./authService');
const httpError = require('../utils/httpError');

async function listPosts(typeId) {
  return typeId ? forumModel.listPostsByType(typeId) : forumModel.listPosts();
}

async function createPost(userId, { title, body, typeId }) {
  if (!title || String(title).trim().length < 3) throw httpError(400, 'Başlık en az 3 karakter olmalıdır.');
  if (!body || !String(body).trim()) throw httpError(400, 'İçerik boş olamaz.');
  assertClean(title, body);
  return forumModel.createPost({
    userId,
    typeId: typeId || null,
    title: sanitizeInput(title),
    body: sanitizeInput(body),
  });
}

async function updatePost(user, postId, { title, body }) {
  const post = await forumModel.findPostById(postId);
  if (!post) throw httpError(404, 'İlan bulunamadı.');
  if (post.user_id !== user.id) throw httpError(403, 'Bu ilan size ait değil.');
  assertClean(title || '', body || '');
  return forumModel.updatePost(postId, {
    title: title ? sanitizeInput(title) : post.title,
    body: body ? sanitizeInput(body) : post.body,
  });
}

// Silme: ilan sahibi VEYA moderatör/admin (moderasyon yetkisi).
async function deletePost(user, postId) {
  const post = await forumModel.findPostById(postId);
  if (!post) throw httpError(404, 'İlan bulunamadı.');
  const isModerator = ['admin', 'moderator'].includes(user.role);
  if (post.user_id !== user.id && !isModerator) throw httpError(403, 'Bu ilanı silme yetkiniz yok.');
  await forumModel.deletePost(postId);
}

async function listComments(postId) {
  const post = await forumModel.findPostById(postId);
  if (!post) throw httpError(404, 'İlan bulunamadı.');
  return forumModel.listComments(postId);
}

async function createComment(userId, postId, body) {
  const post = await forumModel.findPostById(postId);
  if (!post) throw httpError(404, 'İlan bulunamadı.');
  if (!body || !String(body).trim()) throw httpError(400, 'Yorum boş olamaz.');
  assertClean(body);
  return forumModel.createComment({ postId, userId, body: sanitizeInput(body) });
}

module.exports = { listPosts, createPost, updatePost, deletePost, listComments, createComment };
