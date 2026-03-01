const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { AppError } = require('../utils/appError');
const { authenticateJWT } = require('../middlewares/auth');
const { validateQuery, isPositiveNumber, isCurrencyCode } = require('../middlewares/validate');

function externaRoutes(fetchFn = global.fetch) {
  const router = express.Router();

  if (typeof fetchFn !== 'function') {
    throw new Error('Fetch no está disponible en esta versión de Node.js');
  }

  router.get(
    '/convertir',
    authenticateJWT,
    validateQuery([
      isCurrencyCode('from', 'Moneda origen'),
      isCurrencyCode('to', 'Moneda destino'),
      isPositiveNumber('amount', 'Monto')
    ]),
    asyncHandler(async (req, res) => {
      const from = String(req.query.from || 'USD').toUpperCase();
      const to = String(req.query.to || 'MXN').toUpperCase();
      const amount = Number(req.query.amount || 1);

      if (amount <= 0) {
        throw new AppError(400, 'El monto debe ser mayor a 0');
      }

      const url = `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`;
      const response = await fetchFn(url, { method: 'GET' });

      if (!response.ok) {
        throw new AppError(502, 'La API externa de monedas no respondió correctamente');
      }

      const data = await response.json();
      const rate = data?.rates?.[to];

      if (rate === undefined || rate === null) {
        throw new AppError(502, 'No fue posible obtener el tipo de cambio solicitado');
      }

      res.json({
        ok: true,
        source: 'Frankfurter',
        query: { from, to, amount },
        result: {
          convertedAmount: Number(rate),
          date: data.date
        }
      });
    })
  );

  router.get(
    '/precio-producto-mxn',
    authenticateJWT,
    validateQuery([
      isPositiveNumber('precioUsd', 'precioUsd')
    ]),
    asyncHandler(async (req, res) => {
      const precioUsd = Number(req.query.precioUsd || 0);
      if (precioUsd <= 0) {
        throw new AppError(400, 'precioUsd debe ser mayor a 0');
      }

      const url = `https://api.frankfurter.app/latest?amount=${precioUsd}&from=USD&to=MXN`;
      const response = await fetchFn(url, { method: 'GET' });

      if (!response.ok) {
        throw new AppError(502, 'No se pudo consultar tipo de cambio USD/MXN');
      }

      const data = await response.json();
      const precioMxn = data?.rates?.MXN;

      if (precioMxn === undefined || precioMxn === null) {
        throw new AppError(502, 'No se pudo convertir precio a MXN');
      }

      res.json({
        ok: true,
        message: 'Precio convertido para uso en inventario',
        data: {
          precioUsd,
          precioMxn: Number(precioMxn),
          moneda: 'MXN',
          fechaCambio: data.date
        }
      });
    })
  );

  return router;
}

module.exports = { externaRoutes };
