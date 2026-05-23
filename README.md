# Sistema de Gestión de Biblioteca Municipal

Aplicación web para la gestión de bibliotecas municipales: libros, usuarios, préstamos y devoluciones.

**Proyecto académico** — Electiva Desarrollo Web  
Corporación Universitaria Iberoamericana  
Autores: Jorge Antonio Piedrahita Noreña, César Alfonso Orozco Mejía

## Objetivos cubiertos

- Módulo de registro y administración de libros
- Módulo de control de préstamos y devoluciones
- Módulo de registro y búsqueda de usuarios
- Disponibilidad de libros en tiempo real
- Fechas de creación y actualización en registros

## Tecnologías

| Capa      | Stack                          |
|-----------|--------------------------------|
| Frontend  | React 19 + Vite + React Router |
| Backend   | Node.js + Express              |
| Datos     | JSON (archivo persistente)     |

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- npm

## Instalación y ejecución

### 1. Backend (API)

```bash
cd backend
npm install
npm run dev
```

El servidor queda en **http://localhost:3001**

### 2. Frontend (React)

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda en **http://localhost:5173**

## Estructura del proyecto

```
biblioteca-municipal/
├── backend/
│   ├── data/database.json    # Base de datos
│   └── src/
│       ├── server.js
│       ├── db.js
│       └── routes/
└── frontend/
    └── src/
        ├── pages/            # Dashboard, Libros, Usuarios, Préstamos, Búsqueda
        ├── components/
        └── api.js
```

## API REST

| Método | Ruta                         | Descripción              |
|--------|------------------------------|--------------------------|
| GET    | /api/dashboard               | Estadísticas generales   |
| GET    | /api/buscar?q=texto          | Búsqueda global          |
| CRUD   | /api/libros                  | Gestión de libros        |
| CRUD   | /api/usuarios                | Gestión de usuarios      |
| GET    | /api/prestamos               | Listar préstamos         |
| POST   | /api/prestamos               | Registrar préstamo       |
| PUT    | /api/prestamos/:id/devolver  | Registrar devolución     |

## Datos de ejemplo

El archivo `backend/data/database.json` incluye libros, usuarios y préstamos de demostración para probar el sistema de inmediato.
