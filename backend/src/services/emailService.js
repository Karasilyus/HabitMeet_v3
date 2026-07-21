// SMTP konfigüre edilmişse gerçek e-posta gönderir; edilmemişse konsola yazar
// (lokal geliştirmede şifre sıfırlama linki konsoldan alınabilir).
const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

async function sendMail({ to, subject, text }) {
  if (!transporter) {
    console.log(`[MAIL - SMTP yok, konsola yazıldı]\nAlıcı: ${to}\nKonu: ${subject}\n${text}\n`);
    return;
  }
  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'HabitMeet <no-reply@habitmeet.app>',
    to,
    subject,
    text,
  });
}

module.exports = { sendMail };
