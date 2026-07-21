const router = require('express').Router();
const wrap = require('../utils/asyncHandler');
const auth = require('../middlewares/authMiddleware');
const c = require('../controllers/habitController');

router.use(wrap(auth));
router.get('/', wrap(c.list));
router.post('/', wrap(c.create));
router.put('/:id', wrap(c.update));
router.delete('/:id', wrap(c.remove));
router.post('/:id/log', wrap(c.addLog));
router.get('/:id/logs', wrap(c.getLogs));

module.exports = router;
