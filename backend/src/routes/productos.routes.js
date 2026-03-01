const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth');
const {
  validateBody,
  validateQuery,
  isRequired,
  isPositiveNumber,
  isIntegerMin
} = require('../middlewares/validate');

function productosRoutes(db) {
  const router = express.Router();

  router.get(
    '/',
    authenticateJWT,
    validateQuery([
      isIntegerMin('page', 1, 'page'),
      isIntegerMin('limit', 1, 'limit'),
      isPositiveNumber('minPrecio', 'minPrecio'),
      isPositiveNumber('maxPrecio', 'maxPrecio')
    ]),
    asyncHandler(async (req, res) => {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);
      const offset = (page - 1) * limit;
      const nombre = (req.query.nombre || '').trim();
      const minPrecio = req.query.minPrecio;
      const maxPrecio = req.query.maxPrecio;

      const where = [];
      const params = [];

      if (nombre) {
        where.push('nombre LIKE ?');
        params.push(`%${nombre}%`);
      }

      if (minPrecio !== undefined && minPrecio !== '') {
        where.push('precio >= ?');
        params.push(Number(minPrecio));
      }

      if (maxPrecio !== undefined && maxPrecio !== '') {
        where.push('precio <= ?');
        params.push(Number(maxPrecio));
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const [countRows] = await db.execute(
        `SELECT COUNT(*) AS total FROM productos ${whereSql}`,
        params
      );

      const [rows] = await db.execute(
        `SELECT id, nombre, precio, icono, cantidad FROM productos ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const total = countRows[0].total;
      const totalPages = Math.max(1, Math.ceil(total / limit));

      res.json({
        ok: true,
        pagination: {
          page,
          limit,
          total,
          totalPages
        },
        data: rows
      });
    })
  );

  router.post(
    '/',
    authenticateJWT,
    authorizeRoles('admin'),
    validateBody([
      isRequired('nombre', 'Nombre'),
      isRequired('precio', 'Precio'),
      isPositiveNumber('precio', 'Precio')
    ]),
    asyncHandler(async (req, res) => {
      const nombre = req.body.nombre.trim();
      const precio = Number(req.body.precio);
      const icono = (req.body.icono || '').trim();
      const cantidad = Number(req.body.cantidad || 0);

      const [result] = await db.execute(
        'INSERT INTO productos (nombre, precio, icono, cantidad) VALUES (?, ?, ?, ?)',
        [nombre, precio, icono, cantidad]
      );

      res.status(201).json({
        ok: true,
        message: 'Producto creado',
        id: result.insertId
      });
    })
  );

  router.put(
    '/:id',
    authenticateJWT,
    authorizeRoles('admin'),
    validateBody([
      isRequired('nombre', 'Nombre'),
      isRequired('precio', 'Precio'),
      isPositiveNumber('precio', 'Precio'),
      isPositiveNumber('cantidad', 'Cantidad')
    ]),
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      const nombre = req.body.nombre.trim();
      const precio = Number(req.body.precio);
      const cantidad = Number(req.body.cantidad);
      const icono = (req.body.icono || '').trim();

      await db.execute(
        'UPDATE productos SET nombre = ?, precio = ?, cantidad = ?, icono = ? WHERE id = ?',
        [nombre, precio, cantidad, icono, id]
      );

      res.json({ ok: true, message: 'Producto actualizado' });
    })
  );

  router.delete(
    '/:id',
    authenticateJWT,
    authorizeRoles('admin'),
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      await db.execute('DELETE FROM productos WHERE id = ?', [id]);
      res.json({ ok: true, message: 'Producto eliminado' });
    })
  );

  return router;
}

module.exports = { productosRoutes };
