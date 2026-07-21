// Basit içerik moderasyon filtresi. Liste genişletilebilir;
// ileride admin panelinden yönetilecek DB tablosuna taşınabilir (yol haritası 14.2c).
// NOT: Eşleşme tüm metinde substring olarak DEĞİL, tam kelime bazında yapılır.
// Aksi halde "buluşMALarı" gibi masum kelimeler "mal" yüzünden engellenir.
const httpError = require('../utils/httpError');

const BANNED_WORDS = ['salak', 'aptal', 'gerizekalı', 'mal'];

// Metni küçük harfe çevirip (Türkçe kurallarıyla) harf dışı karakterlerden böler.
function tokenize(text) {
  return String(text || '')
    .toLocaleLowerCase('tr')
    .split(/[^a-zçğıöşü]+/)
    .filter(Boolean);
}

function containsBanned(text) {
  const tokens = tokenize(text);
  return tokens.some((t) => BANNED_WORDS.includes(t));
}

function assertClean(...texts) {
  for (const t of texts) {
    if (containsBanned(t)) {
      throw httpError(400, 'İçeriğiniz uygunsuz ifadeler içeriyor. Lütfen düzenleyin.');
    }
  }
}

module.exports = { containsBanned, assertClean };