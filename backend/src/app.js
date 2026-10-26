import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import catalogoRouter from './routes/catalogo.js';
import uploadsRouter, { uploadDirectory } from './routes/uploads.js';
import { requireAdmin } from './digital.js';
import librosRouter from './routes/libros.js';
import usuariosRouter from './routes/usuarios.js';
import prestamosRouter from './routes/prestamos.js';
import buscarRouter from './routes/buscar.js';
import dashboardRouter from './routes/dashboard.js';
import { testConnection } from './db.js';

const app = express();

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

app.use(
  '/uploads',
  express.static(uploadDirectory, {
    dotfiles: 'deny',
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  }),
);
app.use('/api/catalogo', catalogoRouter);
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
  }),
  requireAdmin,
);
app.get('/api/admin/session', (_req, res) => res.json({ ok: true }));
app.use('/api/uploads', uploadsRouter);
app.use('/api/libros', librosRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/prestamos', prestamosRouter);
app.use('/api/buscar', buscarRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err instanceof SyntaxError && err.status === 400)
    return res.status(400).json({ error: 'JSON no válido' });
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(413).json({ error: 'El archivo supera 30 MB' });
  if (err.name === 'MulterError')
    return res.status(400).json({ error: 'Carga de archivo no válida' });
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ error: 'Registro duplicado' });
  }
  res.status(500).json({ error: 'Error interno del servidor' });
});

export default app;
