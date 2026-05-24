import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readDb, writeDb } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const db = readDb();
  res.json(db.usuarios);
});

router.get('/:id', (req, res) => {
  const db = readDb();
  const usuario = db.usuarios.find((u) => u.id === req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
});

router.post('/', (req, res) => {
  const { nombre, documento, email, telefono } = req.body;
  if (!nombre || !documento) {
    return res.status(400).json({ error: 'Nombre y documento son obligatorios' });
  }

  const db = readDb();
  const existe = db.usuarios.some((u) => u.documento === documento);
  if (existe) {
    return res.status(400).json({ error: 'Ya existe un usuario con ese documento' });
  }

  const now = new Date().toISOString();
  const usuario = {
    id: uuidv4(),
    nombre,
    documento,
    email: email || '',
    telefono: telefono || '',
    createdAt: now,
    updatedAt: now
  };

  db.usuarios.push(usuario);
  writeDb(db);
  res.status(201).json(usuario);
});

router.put('/:id', (req, res) => {
  const db = readDb();
  const index = db.usuarios.findIndex((u) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (req.body.documento) {
    const duplicado = db.usuarios.some(
      (u) => u.documento === req.body.documento && u.id !== req.params.id
    );
    if (duplicado) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese documento' });
    }
  }

  const usuario = db.usuarios[index];
  db.usuarios[index] = {
    ...usuario,
    nombre: req.body.nombre ?? usuario.nombre,
    documento: req.body.documento ?? usuario.documento,
    email: req.body.email ?? usuario.email,
    telefono: req.body.telefono ?? usuario.telefono,
    updatedAt: new Date().toISOString()
  };

  writeDb(db);
  res.json(db.usuarios[index]);
});

router.delete('/:id', (req, res) => {
  const db = readDb();
  const prestamoActivo = db.prestamos.some(
    (p) => p.usuarioId === req.params.id && p.estado === 'activo'
  );
  if (prestamoActivo) {
    return res.status(400).json({ error: 'No se puede eliminar un usuario con préstamos activos' });
  }

  const index = db.usuarios.findIndex((u) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Usuario no encontrado' });

  db.usuarios.splice(index, 1);
  writeDb(db);
  res.status(204).send();
});

export default router;
