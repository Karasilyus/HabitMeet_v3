const router = require('express').Router();
const wrap = require('../utils/asyncHandler');
const auth = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/adminMiddleware');
const c = require('../controllers/adminController');

router.use(wrap(auth));

// Moderatörler: şikayet kuyruğu + kullanıcı yönetimi.
router.get('/reports', requireRole('admin', 'moderator'), wrap(c.listReports));
router.post('/reports/:id/resolve', requireRole('admin', 'moderator'), wrap(c.resolveReport));
router.get('/users', requireRole('admin', 'moderator'), wrap(c.listUsers));
router.post('/users/:id/ban', requireRole('admin', 'moderator'), wrap(c.banUser));
router.post('/users/:id/unban', requireRole('admin', 'moderator'), wrap(c.unbanUser));

// Yalnızca admin: dashboard, tip onayı, audit log.
router.get('/stats', requireRole('admin'), wrap(c.overview));
router.get('/activity-types/pending', requireRole('admin'), wrap(c.listPendingTypes));
router.post('/activity-types/:id/approve', requireRole('admin'), wrap(c.approveType));
router.get('/logs', requireRole('admin'), wrap(c.listLogs));

module.exports = router;
