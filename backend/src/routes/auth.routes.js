const express = require('express');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../utils/asyncHandler');
const { AppError } = require('../utils/appError');
const { validateBody, isRequired, isEmail } = require('../middlewares/validate');
const { authenticateJWT } = require('../middlewares/auth');

function authRoutes(db) {
  const router = express.Router();

  router.post(
    '/register',
    validateBody([
      isRequired('nombre', 'Nombre'),
      isRequired('correo', 'Correo'),
      isRequired('password', 'Contraseña'),
      isEmail('correo', 'Correo')
    ]),
    asyncHandler(async (req, res) => {
      const nombre = String(req.body.nombre).trim();
      const correo = String(req.body.correo).toLowerCase().trim();
      const password = String(req.body.password).trim();

      if (!correo.endsWith('@gmail.com')) {
        throw new AppError(400, 'Solo se permiten correos @gmail.com');
      }

      const [existRows] = await db.execute('SELECT id FROM usuarios WHERE correo = ? LIMIT 1', [correo]);
      if (existRows.length) {
        throw new AppError(409, 'Ese correo ya está registrado');
      }

      const rol = correo === 'admin@gmail.com' ? 'admin' : 'usuario';
      if (rol === 'admin') {
        const [adminRows] = await db.execute(
          "SELECT id FROM usuarios WHERE rol = 'admin' AND correo = 'admin@gmail.com' LIMIT 1"
        );
        if (adminRows.length) {
          throw new AppError(400, 'La cuenta admin@gmail.com ya existe');
        }
      }

      const [result] = await db.execute(
        'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
        [nombre, correo, password, rol]
      );

      res.status(201).json({
        ok: true,
        message: 'Usuario creado',
        id: result.insertId
      });
    })
  );

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
