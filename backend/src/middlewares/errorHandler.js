function notFoundHandler(req, res) {
  res.status(404).json({
    ok: false,
    message: 'Ruta no encontrada'
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  if (process.env.NODE_ENV !== 'test') {
    console.error('[API ERROR]', {
      route: req.originalUrl,
      method: req.method,
      message,
      details: err.details || null
    });
  }

  res.status(statusCode).json({
    ok: false,
    message,
    details: err.details || undefined
  });
}

module.exports = { notFoundHandler, errorHandler };
