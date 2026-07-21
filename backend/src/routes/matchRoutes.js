const router = require('express').Router();
const wrap = require('../utils/asyncHandler');
const auth = require('../middlewares/authMiddleware');
const c = require('../controllers/matchController');

router.use(wrap(auth));
router.get('/', wrap(c.list));
router.post('/:id/respond', wrap(c.respond));

module.exports = router;
