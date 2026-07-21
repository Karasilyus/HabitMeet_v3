const router = require('express').Router();
const wrap = require('../utils/asyncHandler');
const auth = require('../middlewares/authMiddleware');
const c = require('../controllers/miscController');

// Public: kayıt formu için ilçe listesi.
router.get('/meta/neighborhoods', wrap(c.neighborhoods));

router.use(wrap(auth));
router.get('/activity-types', wrap(c.listActivityTypes));
router.post('/activity-types', wrap(c.createActivityType));
router.get('/sleep', wrap(c.listSleep));
router.post('/sleep', wrap(c.addSleep));
router.get('/stats', wrap(c.stats));
router.post('/reports', wrap(c.createReport));
router.get('/blocks', wrap(c.listBlocked));
router.post('/blocks', wrap(c.blockUser));
router.delete('/blocks/:userId', wrap(c.unblockUser));

module.exports = router;
