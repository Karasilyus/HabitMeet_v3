// Rate limiting (lansman planı 15.1): brute force ve kötüye kullanım koruma.
// Limitler .env'den ayarlanabilir; gelistirmede rahat, canlıda sıkı deger kullanın.
const rateLimit = require('express-rate-limit');

function envInt(name, fallback) {
  const n = parseInt(process.env[name] || '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// RATE_LIMIT_DISABLED=1 ile tamamen kapatılabilir (yalnızca lokal geliştirme için!)
const disabled = process.env.RATE_LIMIT_DISABLED === '1';

// Login/register/şifre sıfırlama: varsayılan 15 dakikada 30 deneme.
// Canlıda AUTH_RATE_LIMIT_MAX=10 gibi daha sıkı bir değer önerilir.
const authLimiter = rateLimit({
  windowMs: envInt('AUTH_RATE_LIMIT_WINDOW_MIN', 15) * 60 * 1000,
  max: envInt('AUTH_RATE_LIMIT_MAX', 30),
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => disabled,
  message: { error: 'Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.' },
});

// Genel API: varsayılan 15 dakikada 2000 istek (tek kullanıcılı arayüz kullanımına yeter).
// Canlıda RATE_LIMIT_MAX=600 gibi bir değere çekebilirsiniz.
const generalLimiter = rateLimit({
  windowMs: envInt('RATE_LIMIT_WINDOW_MIN', 15) * 60 * 1000,
  max: envInt('RATE_LIMIT_MAX', 2000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => disabled,
  message: { error: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.' },
});

module.exports = { authLimiter, generalLimiter };
