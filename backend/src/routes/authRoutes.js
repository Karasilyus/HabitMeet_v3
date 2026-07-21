const router = require('express').Router();
const wrap = require('../utils/asyncHandler');
const auth = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiters');
const c = require('../controllers/authController');

router.post('/register', authLimiter, wrap(c.register));
router.post('/login', authLimiter, wrap(c.login));
router.post('/forgot-password', authLimiter, wrap(c.forgotPassword));
router.post('/reset-password', authLimiter, wrap(c.resetPassword));
router.get('/me', wrap(auth), wrap(c.me));
router.put('/me', wrap(auth), wrap(c.updateMe));
router.post('/change-password', wrap(auth), wrap(c.changePassword));
router.delete('/me', wrap(auth), wrap(c.deleteMe));

module.exports = router;
