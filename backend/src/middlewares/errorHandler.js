// Global hata yakalama. Bilinen hatalar (err.status) kullanıcıya mesajıyla döner,
// bilinmeyenler loglanır ve jenerik 500 döner (iç detay sızdırılmaz).
module.exports = function errorHandler(err, req, res, next) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error('[HATA]', req.method, req.originalUrl, err);
  return res.status(500).json({ error: 'Beklenmeyen bir hata oluştu.' });
};
