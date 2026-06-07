import express from 'express';
import cors from 'cors';
import librosRouter from './routes/libros.js';
import usuariosRouter from './routes/usuarios.js';
import prestamosRouter from './routes/prestamos.js';
import buscarRouter from './routes/buscar.js';
import dashboardRouter from './routes/dashboard.js';
import { initDb, testConnection } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await testConnection();
    res.json({ ok: true, mensaje: 'API Biblioteca Municipal activa', database: 'mysql' });
  } catch {
    res.status(503).json({ ok: false, mensaje: 'Sin conexión a MySQL' });
  }
});

app.use('/api/libros', librosRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/prestamos', prestamosRouter);
app.use('/api/buscar', buscarRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ error: 'Registro duplicado' });
  }
  res.status(500).json({ error: 'Error interno del servidor' });
});

async function start() {
  try {
    await testConnection();
    await initDb();
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
