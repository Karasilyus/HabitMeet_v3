// async controller'lardaki hataları errorHandler'a iletir.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
