import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool, { asyncHandler, mapLibro } from '../db.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM libros ORDER BY titulo');
  res.json(rows.map(mapLibro));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM libros WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Libro no encontrado' });
  res.json(mapLibro(rows[0]));
}));

router.post('/', asyncHandler(async (req, res) => {
  const { titulo, autor, isbn, categoria, cantidad = 1 } = req.body;
  if (!titulo || !autor) {
    return res.status(400).json({ error: 'Título y autor son obligatorios' });
  }

  const now = new Date();
  const id = uuidv4();
  const cantidadNum = Number(cantidad) || 1;

  await pool.query(
    `INSERT INTO libros (id, titulo, autor, isbn, categoria, cantidad_total, cantidad_disponible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, titulo, autor, isbn || '', categoria || 'General', cantidadNum, cantidadNum, now, now]
  );

  const [rows] = await pool.query('SELECT * FROM libros WHERE id = ?', [id]);
  res.status(201).json(mapLibro(rows[0]));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const [libros] = await pool.query('SELECT * FROM libros WHERE id = ?', [req.params.id]);
  if (!libros.length) return res.status(404).json({ error: 'Libro no encontrado' });

  const libro = libros[0];
  const [prestadosRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM prestamos WHERE libro_id = ? AND estado = 'activo'`,
    [req.params.id]
  );
  const prestados = prestadosRows[0].total;

  const nuevaCantidad = req.body.cantidadTotal ?? libro.cantidad_total;
  if (nuevaCantidad < prestados) {
    return res.status(400).json({
      error: `No puede reducir el inventario por debajo de ${prestados} ejemplares prestados`
    });
  }

  const disponible = nuevaCantidad - prestados;
  const now = new Date();

  await pool.query(
    `UPDATE libros SET titulo = ?, autor = ?, isbn = ?, categoria = ?,
     cantidad_total = ?, cantidad_disponible = ?, updated_at = ?
     WHERE id = ?`,
    [
      req.body.titulo ?? libro.titulo,
      req.body.autor ?? libro.autor,
      req.body.isbn ?? libro.isbn,
      req.body.categoria ?? libro.categoria,
      nuevaCantidad,
      disponible,
      now,
      req.params.id
    ]
  );

  const [rows] = await pool.query('SELECT * FROM libros WHERE id = ?', [req.params.id]);
  res.json(mapLibro(rows[0]));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const [activos] = await pool.query(
    `SELECT id FROM prestamos WHERE libro_id = ? AND estado = 'activo' LIMIT 1`,
    [req.params.id]
  );
  if (activos.length) {
    return res.status(400).json({ error: 'No se puede eliminar un libro con préstamos activos' });
  }

  const [result] = await pool.query('DELETE FROM libros WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Libro no encontrado' });

  res.status(204).send();
}));

export default router;
