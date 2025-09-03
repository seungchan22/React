export function notFound(req, res, next) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'not_found', path: req.path });
  }
  next();
}

export function errorHandler(err, _req, res, _next) {
  console.error('[ERROR]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.code || 'internal',
    detail: err.message || String(err),
  });
}
