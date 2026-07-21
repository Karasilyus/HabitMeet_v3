const forumService = require('../services/forumService');

exports.listPosts = async (req, res) => {
  const typeId = req.query.typeId ? Number(req.query.typeId) : null;
  res.json(await forumService.listPosts(typeId));
};

exports.createPost = async (req, res) => {
  res.status(201).json(await forumService.createPost(req.user.id, req.body || {}));
};

exports.updatePost = async (req, res) => {
  res.json(await forumService.updatePost(req.user, Number(req.params.id), req.body || {}));
};

exports.deletePost = async (req, res) => {
  await forumService.deletePost(req.user, Number(req.params.id));
  res.json({ message: 'İlan silindi.' });
};

exports.listComments = async (req, res) => {
  res.json(await forumService.listComments(Number(req.params.id)));
};

exports.createComment = async (req, res) => {
  res.status(201).json(await forumService.createComment(req.user.id, Number(req.params.id), (req.body || {}).body));
};
