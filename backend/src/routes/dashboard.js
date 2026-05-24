import { Router } from 'express';
import { readDb } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const db = readDb();
  const prestamosActivos = db.prestamos.filter((p) => p.estado === 'activo');
  const prestamosVencidos = prestamosActivos.filter(
    (p) => new Date(p.fechaDevolucionEsperada) < new Date()
  );

  const totalEjemplares = db.libros.reduce((sum, l) => sum + l.cantidadTotal, 0);
  const disponibles = db.libros.reduce((sum, l) => sum + l.cantidadDisponible, 0);

  res.json({
    totalLibros: db.libros.length,
    totalUsuarios: db.usuarios.length,
    totalEjemplares,
    ejemplaresDisponibles: disponibles,
    ejemplaresPrestados: totalEjemplares - disponibles,
    prestamosActivos: prestamosActivos.length,
    prestamosVencidos: prestamosVencidos.length
  });
});

export default router;
