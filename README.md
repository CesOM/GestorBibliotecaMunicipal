# Biblioteca Municipal · Biblioteca virtual y gestión

Proyecto académico — Electiva Desarrollo Web, Corporación Universitaria Iberoamericana.  
Autores: Jorge Antonio Piedrahita Noreña y César Alfonso Orozco Mejía.

Aplicación React 19 + Vite, API Node.js/Express y base de datos **MySQL**. Incluye catálogo público, lectura PDF/Flipbook y administración de libros físicos, usuarios, préstamos y devoluciones.

## Requisitos y arranque

- Node.js **22.13 o superior** (recomendado Node 24 LTS).
- MySQL 8 o MariaDB compatible, en funcionamiento.
- Dos terminales para desarrollo.

```bash
cd backend
npm ci
cp .env.example .env
```

En Windows puedes copiar `.env.example` a `.env` desde el explorador. Configura `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `ADMIN_TOKEN` en ese archivo. Genera una clave de administración aleatoria y pégala como `ADMIN_TOKEN`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run dev
```

La API inicia en `http://localhost:3001`. La cuenta MySQL debe poder crear la base de datos y modificar tablas; si no tiene esos permisos, un administrador debe preparar el esquema previamente. Al iniciar se añaden las columnas digitales faltantes **sin borrar los libros, usuarios ni préstamos existentes**. Los libros anteriores quedan como borradores privados en el catálogo.

En otra terminal:

```bash
cd frontend
npm ci
npm run dev
```

Abre `http://localhost:5173` para leer y `/admin` para administrar. La clave se conserva solo durante la sesión de esa pestaña; todas las rutas administrativas de la API verifican la clave en el servidor. No incluyas la clave en el código frontend ni en Git. Este acceso usa una clave compartida; no es un sistema de cuentas individuales ni de roles.

## Agregar un libro digital

1. Entra a `/admin`, abre **Libros → Nuevo libro** o edita uno existente.
2. Completa título, autor y categoría. Los ejemplares corresponden al inventario físico.
3. Añade descripción y portada PNG, JPG o WebP.
4. Elige PDF, Flipbook o ambos. Sube un PDF (máximo 30 MB) o introduce un enlace HTTPS.
5. Para crear un Flipbook con el PDF, deja vacío el enlace Flipbook. También puedes pegar la URL de inserción de un proveedor externo.
6. Marca **Publicar en el catálogo público** y guarda.

Las portadas y PDF subidos se almacenan en `backend/uploads`, que debe persistir en tu hosting y respaldarse junto con MySQL. No se guardan como BLOB ni se incluyen en Git. El límite es de 30 MB por archivo. El servidor verifica las firmas básicas del formato y genera los nombres de archivo.

Desmarcar publicación oculta el libro y su ruta de lectura del catálogo, pero **los archivos de `/uploads` se sirven públicamente**: no uses este sistema para documentos confidenciales. Los archivos reemplazados o de formularios cancelados no se eliminan automáticamente; esto evita borrar material referenciado y requiere limpieza manual cuando corresponda.

## Lectura

- PDF: anterior/siguiente, número de página, zoom y pantalla completa cuando el navegador lo admite. PDF.js y su worker se sirven con la aplicación, sin CDN.
- Flipbook desde PDF: efecto de hojas con clic, gesto o botones. Las páginas cercanas se dibujan bajo demanda; el PDF conserva su número de páginas. El documento debe contener páginas legibles; un PDF escaneado conserva las limitaciones de accesibilidad de su origen.
- Flipbook externo: usa un iframe restringido. El proveedor tiene que permitir incrustación; sus controles y disponibilidad dependen del servicio. Se muestra un enlace alternativo si bloquea la inserción.
- PDF externo: el proveedor debe admitir CORS. Subir el PDF al servidor evita esa dependencia.
- La lectura digital no consume ejemplares físicos ni requiere un préstamo.

No se incluyen obras digitales de terceros. Publica únicamente material cuya distribución esté autorizada.

## Rutas y API

| Ruta                                                                              | Uso                                                             |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `/`                                                                               | Catálogo público, búsqueda por título/autor/categoría y filtros |
| `/leer/:id`                                                                       | Lectura de libros publicados                                    |
| `/admin`                                                                          | Panel administrativo protegido                                  |
| `/admin/libros`                                                                   | Libros, archivos, formatos y publicación                        |
| `/admin/usuarios`, `/admin/prestamos`, `/admin/buscar`                            | Gestión existente                                               |
| `GET /api/catalogo`, `GET /api/catalogo/:id`                                      | Solo libros publicados; no devuelve usuarios                    |
| `GET /api/health`                                                                 | Estado de la API y MySQL                                        |
| `GET /api/admin/session`                                                          | Validar clave administrativa                                    |
| `POST /api/uploads`                                                               | Subir `multipart/form-data`, campo `archivo`                    |
| `/api/libros`, `/api/usuarios`, `/api/prestamos`, `/api/dashboard`, `/api/buscar` | API administrativa existente                                    |

Todas las rutas `/api` salvo catálogo y health requieren `Authorization: Bearer <ADMIN_TOKEN>`. El límite administrativo es de 200 solicitudes por 15 minutos y dirección IP. Los libros publicados se sirven independientemente del inventario físico.

## Validación

```bash
cd backend
npm test
# Solo en una instancia local de pruebas; crea y elimina un esquema desechable.
TEST_DB_NAME=test_biblioteca_local npm run test:integration
cd ../frontend
npm run build
```

En PowerShell: `$env:TEST_DB_NAME="test_biblioteca_local"; npm run test:integration`. Las pruebas de integración requieren acceso a MySQL con permisos de crear/eliminar bases. Nunca uses el nombre de una base real para esas pruebas.

`backend/data/database.json` es solo una fuente de datos de demostración. `npm run db:seed` **reemplaza los libros, usuarios y préstamos** de la base configurada: úsalo únicamente en una base de prueba vacía. La persistencia de la aplicación es MySQL, no JSON.

## Publicación en hosting

`frontend/npm run build` genera `frontend/dist`. Sirve esa carpeta con fallback a `index.html` para las rutas React y configura un proxy `/api` y `/uploads` al backend. En desarrollo Vite ya configura ambos proxies. Usa HTTPS para proteger la clave administrativa, almacenamiento persistente para uploads y copias de seguridad de archivos y base de datos. Si hay un proxy inverso, configura explícitamente `trust proxy` en Express según la infraestructura para que el límite por IP funcione correctamente; no habilites confianza indiscriminada.
