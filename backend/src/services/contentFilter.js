// Basit içerik moderasyon filtresi. Liste genişletilebilir;
// ileride admin panelinden yönetilecek DB tablosuna taşınabilir (yol haritası 14.2c).
const httpError = require('../utils/httpError');

const BANNED_WORDS = ['salak', 'aptal', 'gerizekalı', 'mal'];

function containsBanned(text) {
  const lower = String(text || '').toLowerCase();
  return BANNED_WORDS.some((w) => lower.includes(w));
}

function assertClean(...texts) {
  for (const t of texts) {
    if (containsBanned(t)) {
      throw httpError(400, 'İçeriğiniz uygunsuz ifadeler içeriyor. Lütfen düzenleyin.');
    }
  }
}

module.exports = { containsBanned, assertClean };
