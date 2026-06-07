CREATE DATABASE IF NOT EXISTS biblioteca_municipal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE biblioteca_municipal;

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
