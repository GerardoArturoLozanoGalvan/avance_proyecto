require('dotenv').config();

const { createApp } = require('./src/app');
const { createDbPool } = require('./src/db');

const PORT = process.env.PORT || 3000;

async function startServer() {
  const db = createDbPool();
  const app = createApp(db);

  try {
    await db.query('SELECT 1');
    if (db.isMock) {
      console.log('Backend en modo MOCK (sin MySQL remoto)');
    } else {
      console.log('MySQL conectado');
    }
  } catch (error) {
    console.error('Error MySQL:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Servidor activo en http://localhost:${PORT}`);
    console.log('Debug sugerido: npm run debug');
  });
}

startServer();
