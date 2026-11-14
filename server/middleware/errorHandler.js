import mongoose from 'mongoose';

export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Last middleware: turns any thrown error into a JSON response
// so bad input never crashes the server.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Invalid input', details });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: 'Invalid id' }); // lecture 18: malformed id = 400
  }
  if (err?.code === 11000) {
    return res.status(409).json({ error: 'Already exists' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
}
