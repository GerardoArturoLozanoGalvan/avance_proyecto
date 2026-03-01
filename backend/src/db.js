const mysql = require('mysql2/promise');
const { createMockDb } = require('./db.mock');

function createDbPool() {
  if (String(process.env.MOCK_MODE).toLowerCase() === 'true') {
    return createMockDb();
  }

  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'empresa',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

module.exports = { createDbPool };
