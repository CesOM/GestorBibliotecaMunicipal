import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readDb, writeDb } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const db = readDb();
  res.json(db.libros);
});

router.get('/:id', (req, res) => {
  const db = readDb();
  const libro = db.libros.find((l) => l.id === req.params.id);
  if (!libro) return res.status(404).json({ error: 'Libro no encontrado' });
  res.json(libro);
});

router.post('/', (req, res) => {
  const { titulo, autor, isbn, categoria, cantidad = 1 } = req.body;
  if (!titulo || !autor) {
    return res.status(400).json({ error: 'Título y autor son obligatorios' });
  }

  const now = new Date().toISOString();
  const libro = {
    id: uuidv4(),
    titulo,
    autor,
    isbn: isbn || '',
    categoria: categoria || 'General',
    cantidadTotal: Number(cantidad) || 1,
    cantidadDisponible: Number(cantidad) || 1,
    createdAt: now,
    updatedAt: now
  };

  const db = readDb();
  db.libros.push(libro);
  writeDb(db);
  res.status(201).json(libro);
});

router.put('/:id', (req, res) => {
  const db = readDb();
  const index = db.libros.findIndex((l) => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Libro no encontrado' });

  const prestados = db.prestamos.filter(
    (p) => p.libroId === req.params.id && p.estado === 'activo'
  ).length;

  const libro = db.libros[index];
  const nuevaCantidad = req.body.cantidadTotal ?? libro.cantidadTotal;

  if (nuevaCantidad < prestados) {
    return res.status(400).json({
      error: `No puede reducir el inventario por debajo de ${prestados} ejemplares prestados`
    });
  }

  const disponible = nuevaCantidad - prestados;

  db.libros[index] = {
    ...libro,
    titulo: req.body.titulo ?? libro.titulo,
    autor: req.body.autor ?? libro.autor,
    isbn: req.body.isbn ?? libro.isbn,
    categoria: req.body.categoria ?? libro.categoria,
    cantidadTotal: nuevaCantidad,
    cantidadDisponible: disponible,
    updatedAt: new Date().toISOString()
  };

  writeDb(db);
  res.json(db.libros[index]);
});

router.delete('/:id', (req, res) => {
  const db = readDb();
  const prestamoActivo = db.prestamos.some(
    (p) => p.libroId === req.params.id && p.estado === 'activo'
  );
  if (prestamoActivo) {
    return res.status(400).json({ error: 'No se puede eliminar un libro con préstamos activos' });
  }

  const index = db.libros.findIndex((l) => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Libro no encontrado' });

  db.libros.splice(index, 1);
  writeDb(db);
  res.status(204).send();
});

export default router;
