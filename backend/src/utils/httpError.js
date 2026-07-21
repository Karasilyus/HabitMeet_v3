// Bilinen (kullanıcıya gösterilebilir) hatalar için yardımcı.
module.exports = function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
};
