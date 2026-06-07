import { Router } from 'express';
import pool, { asyncHandler, mapLibro, mapUsuario } from '../db.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.json({ libros: [], usuarios: [] });
  }

  const like = `%${q}%`;

  const [libros] = await pool.query(
    `SELECT * FROM libros
     WHERE titulo LIKE ? OR autor LIKE ? OR isbn LIKE ? OR categoria LIKE ?
     ORDER BY titulo`,
    [like, like, like, like]
  );

  const [usuarios] = await pool.query(
    `SELECT * FROM usuarios
     WHERE nombre LIKE ? OR documento LIKE ? OR email LIKE ?
     ORDER BY nombre`,
    [like, like, like]
  );

  res.json({
    libros: libros.map(mapLibro),
    usuarios: usuarios.map(mapUsuario)
  });
}));

export default router;
