const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const httpError = require('../utils/httpError');
const { isValidNeighborhood, NEIGHBORHOODS } = require('../constants/neighborhoods');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeInput(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw httpError(400, 'Şifre en az 8 karakter olmalıdır.');
  }
  if (!/[a-zçğıöşü]/.test(password) || !/[A-ZÇĞİÖŞÜ]/.test(password) || !/\d/.test(password)) {
    throw httpError(400, 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.');
  }
}

function validateRegisterInput({ name, email, password, neighborhood }) {
  if (!name || String(name).trim().length < 2) throw httpError(400, 'İsim en az 2 karakter olmalıdır.');
  if (!EMAIL_RE.test(email || '')) throw httpError(400, 'Geçerli bir e-posta adresi girin.');
  validatePassword(password);
  if (!isValidNeighborhood(neighborhood)) throw httpError(400, 'Geçerli bir ilçe seçin.');
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    neighborhood: user.neighborhood,
    role: user.role,
    created_at: user.created_at,
  };
}

async function register({ name, email, password, neighborhood, kvkkConsent }) {
  validateRegisterInput({ name, email, password, neighborhood });
  // KVKK: kayıtta açık rıza zorunlu (lansman planı 15.2).
  if (!kvkkConsent) throw httpError(400, 'Devam etmek için KVKK aydınlatma metnini onaylamanız gerekir.');
  const existing = await userModel.findByEmail(email);
  if (existing) throw httpError(409, 'Bu e-posta adresi zaten kayıtlı.');
  const hash = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    name: sanitizeInput(name),
    email: String(email).toLowerCase().trim(),
    password: hash,
    neighborhood,
  });
  return { token: signToken(user), user: publicUser(user) };
}

async function login({ email, password }) {
  const user = await userModel.findByEmail(email || '');
  if (!user || user.deleted_at) throw httpError(401, 'E-posta veya şifre hatalı.');
  const ok = await bcrypt.compare(password || '', user.password);
  if (!ok) throw httpError(401, 'E-posta veya şifre hatalı.');
  if (user.is_banned) throw httpError(403, 'Hesabınız askıya alınmıştır.');
  return { token: signToken(user), user: publicUser(user) };
}

// Profil güncelleme: ad ve/veya ilçe (semt) değişikliği.
async function updateProfile(userId, { name, neighborhood }) {
  const updates = {};
  if (name !== undefined) {
    const clean = sanitizeInput(name);
    if (!clean || clean.length < 2) throw httpError(400, 'İsim en az 2 karakter olmalıdır.');
    updates.name = clean;
  }
  if (neighborhood !== undefined) {
    if (!isValidNeighborhood(neighborhood)) throw httpError(400, 'Geçerli bir ilçe seçmelisin.');
    updates.neighborhood = neighborhood;
  }
  if (Object.keys(updates).length === 0) throw httpError(400, 'Güncellenecek bir alan gönderilmedi.');
  const user = await userModel.updateProfile(userId, updates);
  return { user: publicUser(user) };
}

// Şifre değiştirme: mevcut şifre doğrulanır, yeni şifre kurallardan geçirilir.
async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await userModel.findById(userId);
  if (!user) throw httpError(404, 'Kullanıcı bulunamadı.');
  const ok = await bcrypt.compare(currentPassword || '', user.password_hash);
  if (!ok) throw httpError(400, 'Mevcut şifren hatalı.');
  validatePassword(newPassword);
  const hash = await bcrypt.hash(newPassword, 10);
  await userModel.setPassword(userId, hash);
  return { message: 'Şifren güncellendi.' };
}

// KVKK: hesap ve kişisel verilerin silinmesi.
async function deleteAccount(userId) {
  await userModel.softDelete(userId);
}

// Admin seed: sabit kod yerine .env'den. Şifre bcrypt ile saklanır.
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await userModel.findByEmail(email);
  if (existing) return;
  const hash = await bcrypt.hash(password, 10);
  await userModel.create({
    name: 'Yönetici',
    email: email.toLowerCase(),
    password: hash,
    neighborhood: NEIGHBORHOODS[0],
    role: 'admin',
  });
  console.log('Admin hesabı oluşturuldu:', email);
}

module.exports = {
  sanitizeInput, validatePassword, validateRegisterInput,
  register, login, deleteAccount, seedAdmin, publicUser,
  updateProfile, changePassword,
};
