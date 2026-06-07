import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool, { asyncHandler, mapUsuario } from '../db.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM usuarios ORDER BY nombre');
  res.json(rows.map(mapUsuario));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(mapUsuario(rows[0]));
}));

router.post('/', asyncHandler(async (req, res) => {
  const { nombre, documento, email, telefono } = req.body;
  if (!nombre || !documento) {
    return res.status(400).json({ error: 'Nombre y documento son obligatorios' });
  }

  const [existentes] = await pool.query('SELECT id FROM usuarios WHERE documento = ?', [documento]);
  if (existentes.length) {
    return res.status(400).json({ error: 'Ya existe un usuario con ese documento' });
  }

  const now = new Date();
  const id = uuidv4();

  await pool.query(
    `INSERT INTO usuarios (id, nombre, documento, email, telefono, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, nombre, documento, email || '', telefono || '', now, now]
  );

  const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
  res.status(201).json(mapUsuario(rows[0]));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const [usuarios] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
  if (!usuarios.length) return res.status(404).json({ error: 'Usuario no encontrado' });

  const usuario = usuarios[0];

  if (req.body.documento) {
    const [duplicados] = await pool.query(
      'SELECT id FROM usuarios WHERE documento = ? AND id != ?',
      [req.body.documento, req.params.id]
    );
    if (duplicados.length) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese documento' });
    }
  }

  const now = new Date();
  await pool.query(
    `UPDATE usuarios SET nombre = ?, documento = ?, email = ?, telefono = ?, updated_at = ?
     WHERE id = ?`,
    [
      req.body.nombre ?? usuario.nombre,
      req.body.documento ?? usuario.documento,
      req.body.email ?? usuario.email,
      req.body.telefono ?? usuario.telefono,
      now,
      req.params.id
    ]
  );

  const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
  res.json(mapUsuario(rows[0]));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const [activos] = await pool.query(
    `SELECT id FROM prestamos WHERE usuario_id = ? AND estado = 'activo' LIMIT 1`,
    [req.params.id]
  );
  if (activos.length) {
    return res.status(400).json({ error: 'No se puede eliminar un usuario con préstamos activos' });
  }

  const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

  res.status(204).send();
}));

export default router;
