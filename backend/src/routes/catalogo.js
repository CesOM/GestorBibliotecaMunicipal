import { Router } from 'express';
import pool, { asyncHandler, mapLibro } from '../db.js';
const router = Router();
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.query('SELECT * FROM libros WHERE publicado = 1 ORDER BY titulo');
    res.json(rows.map(mapLibro));
  }),
);
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM libros WHERE id = ? AND publicado = 1', [
      req.params.id,
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Libro no disponible' });
    res.json(mapLibro(rows[0]));
  }),
);
export default router;
