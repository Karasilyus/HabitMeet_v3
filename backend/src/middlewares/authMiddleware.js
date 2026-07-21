// JWT doğrulama + ban/silinmiş hesap kontrolü (her istekte güncel durum DB'den okunur).
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

module.exports = async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Giriş yapmalısınız.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    if (!user || user.deleted_at) return res.status(401).json({ error: 'Hesap bulunamadı.' });
    if (user.is_banned) {
      return res.status(403).json({ error: 'Hesabınız askıya alınmıştır.', reason: user.ban_reason || null });
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      neighborhood: user.neighborhood,
    };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
  }
};
