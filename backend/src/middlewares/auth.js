const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/appError');

function authenticateJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError(401, 'Token requerido'));
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = decoded;
    return next();
  } catch (error) {
    return next(new AppError(403, 'Token inválido o expirado'));
  }
}

function authorizeRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return next(new AppError(403, 'No tienes permisos para esta acción'));
    }
    return next();
  };
}

module.exports = { authenticateJWT, authorizeRoles };
