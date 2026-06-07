import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool, { asyncHandler, mapPrestamoEnriquecido } from '../db.js';

const router = Router();

const PRESTAMO_SELECT = `
  SELECT p.*,
    l.titulo AS libro_titulo,
    l.autor AS libro_autor,
    u.nombre AS usuario_nombre,
    u.documento AS usuario_documento
  FROM prestamos p
  LEFT JOIN libros l ON l.id = p.libro_id
  LEFT JOIN usuarios u ON u.id = p.usuario_id
`;

router.get('/', asyncHandler(async (req, res) => {
  let sql = PRESTAMO_SELECT;
  const params = [];

  if (req.query.estado) {
    sql += ' WHERE p.estado = ?';
    params.push(req.query.estado);
  }

  sql += ' ORDER BY p.fecha_prestamo DESC';

  const [rows] = await pool.query(sql, params);
  res.json(rows.map(mapPrestamoEnriquecido));
}));

router.post('/', asyncHandler(async (req, res) => {
  const { libroId, usuarioId, diasPrestamo = 14 } = req.body;
  if (!libroId || !usuarioId) {
    return res.status(400).json({ error: 'Libro y usuario son obligatorios' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [libros] = await connection.query('SELECT * FROM libros WHERE id = ? FOR UPDATE', [libroId]);
    const [usuarios] = await connection.query('SELECT id FROM usuarios WHERE id = ?', [usuarioId]);

    if (!libros.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    if (!usuarios.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const libro = libros[0];
    if (libro.cantidad_disponible < 1) {
      await connection.rollback();
      return res.status(400).json({ error: 'No hay ejemplares disponibles de este libro' });
    }

    const now = new Date();
    const fechaDevolucionEsperada = new Date(now);
    fechaDevolucionEsperada.setDate(fechaDevolucionEsperada.getDate() + Number(diasPrestamo));
    const id = uuidv4();

    await connection.query(
      `INSERT INTO prestamos (id, libro_id, usuario_id, fecha_prestamo, fecha_devolucion_esperada,
       fecha_devolucion_real, estado, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NULL, 'activo', ?, ?)`,
      [id, libroId, usuarioId, now, fechaDevolucionEsperada, now, now]
    );

    await connection.query(
      'UPDATE libros SET cantidad_disponible = cantidad_disponible - 1, updated_at = ? WHERE id = ?',
      [now, libroId]
    );

    await connection.commit();

    const [rows] = await pool.query(`${PRESTAMO_SELECT} WHERE p.id = ?`, [id]);
    res.status(201).json(mapPrestamoEnriquecido(rows[0]));
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}));

router.put('/:id/devolver', asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [prestamos] = await connection.query(
      'SELECT * FROM prestamos WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (!prestamos.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    const prestamo = prestamos[0];
    if (prestamo.estado === 'devuelto') {
      await connection.rollback();
      return res.status(400).json({ error: 'Este préstamo ya fue devuelto' });
    }

    const now = new Date();

    await connection.query(
      `UPDATE prestamos SET estado = 'devuelto', fecha_devolucion_real = ?, updated_at = ? WHERE id = ?`,
      [now, now, req.params.id]
    );

    await connection.query(
      'UPDATE libros SET cantidad_disponible = cantidad_disponible + 1, updated_at = ? WHERE id = ?',
      [now, prestamo.libro_id]
    );

    await connection.commit();

    const [rows] = await pool.query(`${PRESTAMO_SELECT} WHERE p.id = ?`, [req.params.id]);
    res.json(mapPrestamoEnriquecido(rows[0]));
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}));

export default router;
