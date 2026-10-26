import app from './app.js';
import { initDb, testConnection } from './db.js';
const PORT = process.env.PORT || 3001;
async function start() {
  try {
    await initDb();
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
      console.log(`Base de datos: MySQL (${process.env.DB_NAME || 'biblioteca_municipal'})`);
    });
  } catch (err) {
    console.error('No se pudo conectar a MySQL:', err.message);
    console.error('Verifica que MySQL esté activo y configura backend/.env');
    process.exit(1);
  }
}
start();
