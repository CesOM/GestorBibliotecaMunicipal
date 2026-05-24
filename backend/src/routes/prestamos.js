import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readDb, writeDb } from '../db.js';

const router = Router();

function enriquecerPrestamo(prestamo, db) {
  const libro = db.libros.find((l) => l.id === prestamo.libroId);
  const usuario = db.usuarios.find((u) => u.id === prestamo.usuarioId);
  return {
    ...prestamo,
    libroTitulo: libro?.titulo || 'Libro eliminado',
    libroAutor: libro?.autor || '',
    usuarioNombre: usuario?.nombre || 'Usuario eliminado',
    usuarioDocumento: usuario?.documento || ''
  };
}

router.get('/', (req, res) => {
  const db = readDb();
  let prestamos = db.prestamos.map((p) => enriquecerPrestamo(p, db));

  if (req.query.estado) {
    prestamos = prestamos.filter((p) => p.estado === req.query.estado);
  }

  prestamos.sort((a, b) => new Date(b.fechaPrestamo) - new Date(a.fechaPrestamo));
  res.json(prestamos);
});

router.post('/', (req, res) => {
  const { libroId, usuarioId, diasPrestamo = 14 } = req.body;
  if (!libroId || !usuarioId) {
    return res.status(400).json({ error: 'Libro y usuario son obligatorios' });
  }

  const db = readDb();
  const libro = db.libros.find((l) => l.id === libroId);
  const usuario = db.usuarios.find((u) => u.id === usuarioId);

  if (!libro) return res.status(404).json({ error: 'Libro no encontrado' });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (libro.cantidadDisponible < 1) {
    return res.status(400).json({ error: 'No hay ejemplares disponibles de este libro' });
  }

  const now = new Date();
  const fechaDevolucionEsperada = new Date(now);
  fechaDevolucionEsperada.setDate(fechaDevolucionEsperada.getDate() + Number(diasPrestamo));

  const prestamo = {
    id: uuidv4(),
    libroId,
    usuarioId,
    fechaPrestamo: now.toISOString(),
    fechaDevolucionEsperada: fechaDevolucionEsperada.toISOString(),
    fechaDevolucionReal: null,
    estado: 'activo',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  libro.cantidadDisponible -= 1;
  libro.updatedAt = now.toISOString();

  db.prestamos.push(prestamo);
  writeDb(db);

  res.status(201).json(enriquecerPrestamo(prestamo, db));
});

router.put('/:id/devolver', (req, res) => {
  const db = readDb();
  const index = db.prestamos.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Préstamo no encontrado' });

  const prestamo = db.prestamos[index];
  if (prestamo.estado === 'devuelto') {
    return res.status(400).json({ error: 'Este préstamo ya fue devuelto' });
  }

  const libro = db.libros.find((l) => l.id === prestamo.libroId);
  if (libro) {
    libro.cantidadDisponible += 1;
    libro.updatedAt = new Date().toISOString();
  }

  const now = new Date().toISOString();
  db.prestamos[index] = {
    ...prestamo,
    estado: 'devuelto',
    fechaDevolucionReal: now,
    updatedAt: now
  };

  writeDb(db);
  res.json(enriquecerPrestamo(db.prestamos[index], db));
});

export default router;
