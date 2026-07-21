const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const passwordResetModel = require('../models/passwordResetModel');
const { sendMail } = require('./emailService');
const { validatePassword } = require('./authService');
const httpError = require('../utils/httpError');

// Güvenlik: e-posta kayıtlı olsa da olmasa da aynı yanıt döner (enumeration engeli).
async function requestReset(email) {
  const user = await userModel.findByEmail(email || '');
  if (user && !user.deleted_at) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 saat
    await passwordResetModel.create(user.id, token, expiresAt);
    const link = `${process.env.FRONTEND_URL || 'http://localhost:5500'}/#/reset?token=${token}`;
    await sendMail({
      to: user.email,
      subject: 'HabitMeet - Şifre Sıfırlama',
      text: `Merhaba ${user.name},\n\nŞifreni sıfırlamak için aşağıdaki bağlantıya tıkla (1 saat geçerlidir):\n${link}\n\nBu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.`,
    });
  }
  return { message: 'Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.' };
}

async function resetPassword(token, newPassword) {
  const record = await passwordResetModel.findValidByToken(token || '');
  if (!record) throw httpError(400, 'Geçersiz veya kullanılmış sıfırlama bağlantısı.');
  if (new Date(record.expires_at) < new Date()) throw httpError(400, 'Sıfırlama bağlantısının süresi dolmuş.');
  validatePassword(newPassword);
  const hash = await bcrypt.hash(newPassword, 10);
  await userModel.setPassword(record.user_id, hash);
  await passwordResetModel.markUsed(record.id);
  return { message: 'Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.' };
}

module.exports = { requestReset, resetPassword };
