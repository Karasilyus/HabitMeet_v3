// RBAC: rol tabanlı yetkilendirme. authMiddleware'den SONRA kullanılmalıdır.
// Kullanım: router.get('/users', auth, requireRole('admin', 'moderator'), handler)
module.exports = function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
    }
    next();
  };
};
