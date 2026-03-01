const express = require('express');
const cors = require('cors');
const { authRoutes } = require('./routes/auth.routes');
const { productosRoutes } = require('./routes/productos.routes');
const { usuariosRoutes } = require('./routes/usuarios.routes');
const { externaRoutes } = require('./routes/externa.routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

function createApp(db, options = {}) {
  const app = express();
  const fetchFn = options.fetchFn || global.fetch;

  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ ok: true, service: 'backend-api', timestamp: new Date().toISOString() });
  });

  app.use('/auth', authRoutes(db));
  app.use('/productos', productosRoutes(db));
  app.use('/usuarios', usuariosRoutes(db));
  app.use('/externa', externaRoutes(fetchFn));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
