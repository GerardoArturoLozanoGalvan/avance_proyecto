const express = require('express');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../utils/asyncHandler');
const { AppError } = require('../utils/appError');
const { validateBody, isRequired, isEmail } = require('../middlewares/validate');
const { authenticateJWT } = require('../middlewares/auth');

function authRoutes(db) {
  const router = express.Router();

  router.post(
    '/login',
    validateBody([
      isRequired('correo', 'Correo'),
      isRequired('password', 'Contraseña'),
      isEmail('correo', 'Correo')
    ]),
    asyncHandler(async (req, res) => {
      const correo = String(req.body.correo).toLowerCase().trim();
      const password = String(req.body.password).trim();

      const [rows] = await db.execute(
        'SELECT id, nombre, correo, rol FROM usuarios WHERE correo = ? AND password = ? LIMIT 1',
        [correo, password]
      );

      if (!rows.length) {
        throw new AppError(401, 'Credenciales incorrectas');
      }

      const user = rows[0];
      const token = jwt.sign(
        {
          id: user.id,
          correo: user.correo,
          rol: user.rol
        },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: '1h' }
      );

      res.json({
        ok: true,
        token,
        usuario: {
          id: user.id,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol
        }
      });
    })
  );

  router.get(
    '/me',
    authenticateJWT,
    asyncHandler(async (req, res) => {
      const [rows] = await db.execute('SELECT id, nombre, correo, rol FROM usuarios WHERE id = ? LIMIT 1', [req.user.id]);
      if (!rows.length) {
        throw new AppError(404, 'Usuario no encontrado');
      }
      res.json({ ok: true, usuario: rows[0] });
    })
  );

  return router;
}

module.exports = { authRoutes };
