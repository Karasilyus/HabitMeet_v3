const router = require('express').Router();
const wrap = require('../utils/asyncHandler');
const auth = require('../middlewares/authMiddleware');
const c = require('../controllers/forumController');

router.use(wrap(auth));
router.get('/', wrap(c.listPosts));
router.post('/', wrap(c.createPost));
router.put('/:id', wrap(c.updatePost));
router.delete('/:id', wrap(c.deletePost));
router.get('/:id/comments', wrap(c.listComments));
router.post('/:id/comments', wrap(c.createComment));

module.exports = router;
