import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDb } from '../src/db.js';
import pool from '../src/db.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data', 'database.json');

async function seed() {
  await initDb();

  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const data = JSON.parse(raw);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM prestamos');
    await connection.query('DELETE FROM libros');
    await connection.query('DELETE FROM usuarios');

    for (const libro of data.libros) {
      await connection.query(
        `INSERT INTO libros (id, titulo, autor, isbn, categoria, cantidad_total, cantidad_disponible, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          libro.id,
          libro.titulo,
          libro.autor,
          libro.isbn || '',
          libro.categoria || 'General',
          libro.cantidadTotal,
          libro.cantidadDisponible,
          new Date(libro.createdAt),
          new Date(libro.updatedAt)
        ]
      );
    }

    for (const usuario of data.usuarios) {
      await connection.query(
        `INSERT INTO usuarios (id, nombre, documento, email, telefono, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          usuario.id,
          usuario.nombre,
          usuario.documento,
          usuario.email || '',
          usuario.telefono || '',
          new Date(usuario.createdAt),
          new Date(usuario.updatedAt)
        ]
      );
    }

    const libroIds = new Set(data.libros.map((l) => l.id));
    const usuarioIds = new Set(data.usuarios.map((u) => u.id));

    for (const prestamo of data.prestamos) {
      if (!libroIds.has(prestamo.libroId) || !usuarioIds.has(prestamo.usuarioId)) {
        console.warn(`Préstamo ${prestamo.id} omitido: referencia a libro o usuario inexistente`);
        continue;
      }

      await connection.query(
        `INSERT INTO prestamos (id, libro_id, usuario_id, fecha_prestamo, fecha_devolucion_esperada,
         fecha_devolucion_real, estado, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          prestamo.id,
          prestamo.libroId,
          prestamo.usuarioId,
          new Date(prestamo.fechaPrestamo),
          new Date(prestamo.fechaDevolucionEsperada),
          prestamo.fechaDevolucionReal ? new Date(prestamo.fechaDevolucionReal) : null,
          prestamo.estado,
          new Date(prestamo.createdAt),
          new Date(prestamo.updatedAt)
        ]
      );
    }

    await connection.commit();
    console.log('Datos importados desde database.json correctamente.');
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Error al importar datos:', err.message);
  process.exit(1);
});
