import express from 'express';
import cors from 'cors';
import librosRouter from './routes/libros.js';
import usuariosRouter from './routes/usuarios.js';
import prestamosRouter from './routes/prestamos.js';
import buscarRouter from './routes/buscar.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mensaje: 'API Biblioteca Municipal activa' });
});

app.use('/api/libros', librosRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/prestamos', prestamosRouter);
app.use('/api/buscar', buscarRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
