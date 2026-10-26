import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'biblioteca_municipal',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: false,
});

export function toIso(value) {
  if (!value) return value;
  return value instanceof Date ? value.toISOString() : value;
}

export function mapLibro(row) {
  if (!row) return null;
  return {
    id: row.id,
    titulo: row.titulo,
    autor: row.autor,
    isbn: row.isbn,
    categoria: row.categoria,
    descripcion: row.descripcion || '',
    portadaUrl: row.portada_url || '',
    pdfUrl: row.pdf_url || '',
    flipbookUrl: row.flipbook_url || '',
    formato: row.formato || 'pdf',
    publicado: Boolean(row.publicado),
    cantidadTotal: row.cantidad_total,
    cantidadDisponible: row.cantidad_disponible,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapUsuario(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    documento: row.documento,
    email: row.email,
    telefono: row.telefono,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapPrestamo(row) {
  if (!row) return null;
  return {
    id: row.id,
    libroId: row.libro_id,
    usuarioId: row.usuario_id,
    fechaPrestamo: toIso(row.fecha_prestamo),
    fechaDevolucionEsperada: toIso(row.fecha_devolucion_esperada),
    fechaDevolucionReal: toIso(row.fecha_devolucion_real),
    estado: row.estado,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapPrestamoEnriquecido(row) {
  return {
    ...mapPrestamo(row),
    libroTitulo: row.libro_titulo || 'Libro eliminado',
    libroAutor: row.libro_autor || '',
    usuarioNombre: row.usuario_nombre || 'Usuario eliminado',
    usuarioDocumento: row.usuario_documento || '',
  };
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS libros (
  id VARCHAR(36) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(255) NOT NULL,
  isbn VARCHAR(50) DEFAULT '',
  categoria VARCHAR(100) DEFAULT 'General',
  cantidad_total INT NOT NULL DEFAULT 1,
  cantidad_disponible INT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  documento VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) DEFAULT '',
  telefono VARCHAR(50) DEFAULT '',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS prestamos (
  id VARCHAR(36) PRIMARY KEY,
  libro_id VARCHAR(36) NOT NULL,
  usuario_id VARCHAR(36) NOT NULL,
  fecha_prestamo DATETIME(3) NOT NULL,
  fecha_devolucion_esperada DATETIME(3) NOT NULL,
  fecha_devolucion_real DATETIME(3) NULL,
  estado ENUM('activo', 'devuelto') NOT NULL DEFAULT 'activo',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  FOREIGN KEY (libro_id) REFERENCES libros(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
`;

async function ensureDatabase() {
  const dbName = process.env.DB_NAME || 'biblioteca_municipal';
  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) throw new Error('DB_NAME no válido');
  const bootstrap = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    await bootstrap.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await bootstrap.end();
  }
}

export async function initDb() {
  await ensureDatabase();

  const connection = await pool.getConnection();
  try {
    const statements = SCHEMA.split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await connection.query(statement);
    }
    // Additive, repeatable migration: preserve existing books and loans.
    const additions = {
      descripcion: 'TEXT NULL',
      portada_url: "VARCHAR(2048) NOT NULL DEFAULT ''",
      pdf_url: "VARCHAR(2048) NOT NULL DEFAULT ''",
      flipbook_url: "VARCHAR(2048) NOT NULL DEFAULT ''",
      formato: "ENUM('pdf','flipbook','ambos') NOT NULL DEFAULT 'pdf'",
      publicado: 'TINYINT(1) NOT NULL DEFAULT 0',
    };
    const [columns] = await connection.query('SHOW COLUMNS FROM libros');
    for (const [name, definition] of Object.entries(additions)) {
      if (!columns.some((c) => c.Field === name)) {
        await connection.query(`ALTER TABLE libros ADD COLUMN ${name} ${definition}`);
      }
    }
  } finally {
    connection.release();
  }
}

export async function testConnection() {
  const connection = await pool.getConnection();
  connection.release();
}

export default pool;
