const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { AppError } = require('../utils/appError');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth');
const {
  validateBody,
  validateQuery,
  isIntegerMin,
  isIn,
  isRequired,
  isEmail
} = require('../middlewares/validate');

function usuariosRoutes(db) {
  const router = express.Router();

  router.post(
    '/',
    authenticateJWT,
    authorizeRoles('admin'),
    validateBody([
      isRequired('nombre', 'Nombre'),
      isRequired('correo', 'Correo'),
      isRequired('password', 'Contraseña'),
      isEmail('correo', 'Correo')
    ]),
    asyncHandler(async (req, res) => {
      const nombre = String(req.body.nombre).trim();
      const correo = String(req.body.correo).trim().toLowerCase();
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

      res.status(201).json({ ok: true, message: 'Usuario creado', id: result.insertId });
    })
  );

  router.get(
    '/',
    authenticateJWT,
    authorizeRoles('admin'),
    validateQuery([
      isIntegerMin('page', 1, 'page'),
      isIntegerMin('limit', 1, 'limit'),
      isIn('rol', ['admin', 'usuario'], 'rol')
    ]),
    asyncHandler(async (req, res) => {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);
      const offset = (page - 1) * limit;
      const rol = req.query.rol;

      const whereSql = rol ? 'WHERE rol = ?' : '';
      const whereParams = rol ? [rol] : [];

      const [countRows] = await db.execute(
        `SELECT COUNT(*) AS total FROM usuarios ${whereSql}`,
        whereParams
      );

      const [rows] = await db.execute(
        `SELECT id, nombre, correo, rol FROM usuarios ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...whereParams, limit, offset]
      );

      const total = countRows[0].total;
      const totalPages = Math.max(1, Math.ceil(total / limit));

      res.json({
        ok: true,
        pagination: { page, limit, total, totalPages },
        data: rows
      });
    })
  );

  router.patch(
    '/:id/rol',
    authenticateJWT,
    authorizeRoles('admin'),
    validateBody([isIn('rol', ['admin', 'usuario'], 'rol')]),
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      const nuevoRol = req.body.rol;

      const [rows] = await db.execute('SELECT id, correo, rol FROM usuarios WHERE id = ? LIMIT 1', [id]);
      if (!rows.length) {
        throw new AppError(404, 'Usuario no encontrado');
      }

      const usuario = rows[0];
      const correo = String(usuario.correo).toLowerCase();

      if (correo === 'admin@gmail.com' && nuevoRol !== 'admin') {
        throw new AppError(400, 'admin@gmail.com debe permanecer como admin');
      }

      if (nuevoRol === 'admin' && correo !== 'admin@gmail.com') {
        throw new AppError(400, 'Solo admin@gmail.com puede ser admin');
      }

      await db.execute('UPDATE usuarios SET rol = ? WHERE id = ?', [nuevoRol, id]);

      res.json({ ok: true, message: 'Rol actualizado' });
    })
  );

  router.delete(
    '/:id',
    authenticateJWT,
    authorizeRoles('admin'),
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);

      const [rows] = await db.execute('SELECT correo, rol FROM usuarios WHERE id = ? LIMIT 1', [id]);
      if (!rows.length) {
        throw new AppError(404, 'Usuario no encontrado');
      }

      const usuario = rows[0];
      const correo = String(usuario.correo).toLowerCase();
      if (correo === 'admin@gmail.com' || usuario.rol === 'admin') {
        throw new AppError(400, 'No se puede eliminar al admin principal');
      }

      await db.execute('DELETE FROM usuarios WHERE id = ?', [id]);
      res.json({ ok: true, message: 'Usuario eliminado' });
    })
  );

  return router;
}

module.exports = { usuariosRoutes };
