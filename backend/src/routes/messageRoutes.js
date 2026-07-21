const router = require('express').Router();
const wrap = require('../utils/asyncHandler');
const auth = require('../middlewares/authMiddleware');
const c = require('../controllers/messageController');

router.use(wrap(auth));
router.get('/:matchId', wrap(c.list));
router.post('/:matchId', wrap(c.send));

module.exports = router;
