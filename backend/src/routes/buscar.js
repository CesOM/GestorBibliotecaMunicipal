import { Router } from 'express';
import { readDb } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) {
    return res.json({ libros: [], usuarios: [] });
  }

  const db = readDb();

  const libros = db.libros.filter(
    (l) =>
      l.titulo.toLowerCase().includes(q) ||
      l.autor.toLowerCase().includes(q) ||
      l.isbn.toLowerCase().includes(q) ||
      l.categoria.toLowerCase().includes(q)
  );

  const usuarios = db.usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(q) ||
      u.documento.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
  );

  res.json({ libros, usuarios });
});

export default router;
