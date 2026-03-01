const { AppError } = require('../utils/appError');

function validateBody(validators) {
  return (req, res, next) => {
    const errors = [];

    validators.forEach((validator) => {
      const error = validator(req.body);
      if (error) errors.push(error);
    });

    if (errors.length) {
      return next(new AppError(400, 'Validación fallida', errors));
    }

    return next();
  };
}

function validateQuery(validators) {
  return (req, res, next) => {
    const errors = [];

    validators.forEach((validator) => {
      const error = validator(req.query);
      if (error) errors.push(error);
    });

    if (errors.length) {
      return next(new AppError(400, 'Parámetros inválidos', errors));
    }

    return next();
  };
}

const isRequired = (field, label = field) => (obj) => {
  if (obj[field] === undefined || obj[field] === null || String(obj[field]).trim() === '') {
    return `${label} es obligatorio`;
  }
  return null;
};

const isPositiveNumber = (field, label = field) => (obj) => {
  if (obj[field] === undefined || obj[field] === null || obj[field] === '') return null;
  const value = Number(obj[field]);
  if (Number.isNaN(value) || value < 0) {
    return `${label} debe ser un número mayor o igual a 0`;
  }
  return null;
};

const isIntegerMin = (field, min, label = field) => (obj) => {
  if (obj[field] === undefined || obj[field] === null || obj[field] === '') return null;
  const value = Number(obj[field]);
  if (!Number.isInteger(value) || value < min) {
    return `${label} debe ser entero y mayor o igual a ${min}`;
  }
  return null;
};

const isEmail = (field, label = field) => (obj) => {
  if (obj[field] === undefined || obj[field] === null || obj[field] === '') return null;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(String(obj[field]).toLowerCase())) {
    return `${label} no es válido`;
  }
  return null;
};

const isIn = (field, values, label = field) => (obj) => {
  if (obj[field] === undefined || obj[field] === null || obj[field] === '') return null;
  if (!values.includes(obj[field])) {
    return `${label} debe ser uno de: ${values.join(', ')}`;
  }
  return null;
};

const isCurrencyCode = (field, label = field) => (obj) => {
  if (obj[field] === undefined || obj[field] === null || obj[field] === '') return null;
  const value = String(obj[field]).toUpperCase();
  if (!/^[A-Z]{3}$/.test(value)) {
    return `${label} debe tener formato de moneda ISO (ej: USD, MXN)`;
  }
  return null;
};

module.exports = {
  validateBody,
  validateQuery,
  isRequired,
  isPositiveNumber,
  isIntegerMin,
  isEmail,
  isIn,
  isCurrencyCode
};
