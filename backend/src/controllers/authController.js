const authService = require('../services/authService');
const passwordResetService = require('../services/passwordResetService');

exports.register = async (req, res) => {
  const result = await authService.register(req.body || {});
  res.status(201).json(result);
};

exports.login = async (req, res) => {
  res.json(await authService.login(req.body || {}));
};

exports.forgotPassword = async (req, res) => {
  res.json(await passwordResetService.requestReset((req.body || {}).email));
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body || {};
  res.json(await passwordResetService.resetPassword(token, password));
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

// Profil güncelleme (ad / ilçe).
exports.updateMe = async (req, res) => {
  res.json(await authService.updateProfile(req.user.id, req.body || {}));
};

// Şifre değiştirme (giriş yapmış kullanıcı).
exports.changePassword = async (req, res) => {
  res.json(await authService.changePassword(req.user.id, req.body || {}));
};

// KVKK: hesap silme hakkı.
exports.deleteMe = async (req, res) => {
  await authService.deleteAccount(req.user.id);
  res.json({ message: 'Hesabınız ve kişisel verileriniz silindi.' });
};
