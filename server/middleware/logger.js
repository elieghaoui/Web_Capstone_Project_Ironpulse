// Lecture 16: a request logger. Prints "10:42:03 GET /api/classes 200" for every request.
export function logger(req, res, next) {
  if (process.env.NODE_ENV === 'test') return next();
  res.on('finish', () => {
    const time = new Date().toLocaleTimeString();
    console.log(`${time} ${req.method} ${req.originalUrl} ${res.statusCode}`);
  });
  next(); // pass it on
}
