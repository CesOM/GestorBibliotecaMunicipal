import { Router } from 'express';
import pool, { asyncHandler } from '../db.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const [[librosStats]] = await pool.query(
    `SELECT COUNT(*) AS total_libros,
            COALESCE(SUM(cantidad_total), 0) AS total_ejemplares,
            COALESCE(SUM(cantidad_disponible), 0) AS ejemplares_disponibles
     FROM libros`
  );

  const [[usuariosStats]] = await pool.query('SELECT COUNT(*) AS total_usuarios FROM usuarios');

  const [[prestamosStats]] = await pool.query(
    `SELECT
       SUM(estado = 'activo') AS prestamos_activos,
       SUM(estado = 'activo' AND fecha_devolucion_esperada < NOW()) AS prestamos_vencidos
     FROM prestamos`
  );

  const totalEjemplares = Number(librosStats.total_ejemplares);
  const disponibles = Number(librosStats.ejemplares_disponibles);

  res.json({
    totalLibros: Number(librosStats.total_libros),
    totalUsuarios: Number(usuariosStats.total_usuarios),
    totalEjemplares,
    ejemplaresDisponibles: disponibles,
    ejemplaresPrestados: totalEjemplares - disponibles,
    prestamosActivos: Number(prestamosStats.prestamos_activos) || 0,
    prestamosVencidos: Number(prestamosStats.prestamos_vencidos) || 0
  });
}));

export default router;
