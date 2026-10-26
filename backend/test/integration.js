// Run only against a disposable database; production schemas are never dropped.
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import { once } from 'node:events';
import { rm } from 'node:fs/promises';
if (!process.env.TEST_DB_NAME?.startsWith('test_biblioteca_'))
  throw new Error('TEST_DB_NAME debe empezar por test_biblioteca_');
process.env.DB_NAME = process.env.TEST_DB_NAME;
process.env.ADMIN_TOKEN = 'integration-test-key-with-32-characters';
const { default: pool, initDb } = await import('../src/db.js');
const { default: app } = await import('../src/app.js');
const { uploadDirectory } = await import('../src/routes/uploads.js');
let server;
let ownedDatabase = false;
const uploaded = [];
try {
  // Start with the old physical schema to exercise the upgrade path.
  const bootstrap = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });
  let existing;
  try {
    [existing] = await bootstrap.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [process.env.TEST_DB_NAME],
    );
  } finally {
    await bootstrap.end();
  }
  if (existing.length) throw new Error('La base de pruebas ya existe; usa otro TEST_DB_NAME');
  await initDb();
  ownedDatabase = true;
  for (const column of [
    'descripcion',
    'portada_url',
    'pdf_url',
    'flipbook_url',
    'formato',
    'publicado',
  ])
    await pool.query(`ALTER TABLE libros DROP COLUMN ${column}`);
  await pool.query(
    "INSERT INTO libros (id,titulo,autor,created_at,updated_at) VALUES ('legacy','Libro existente','Autor',NOW(),NOW())",
  );
  await pool.query(
    "INSERT INTO usuarios (id,nombre,documento,created_at,updated_at) VALUES ('legacy-user','Lector existente','123',NOW(),NOW())",
  );
  await pool.query(
    "INSERT INTO prestamos (id,libro_id,usuario_id,fecha_prestamo,fecha_devolucion_esperada,created_at,updated_at) VALUES ('legacy-loan','legacy','legacy-user',NOW(),DATE_ADD(NOW(), INTERVAL 14 DAY),NOW(),NOW())",
  );
  await pool.query("UPDATE libros SET cantidad_disponible = 0 WHERE id = 'legacy'");
  await initDb();
  await initDb();
  const [legacy] = await pool.query("SELECT * FROM libros WHERE id = 'legacy'");
  assert.equal(legacy[0].publicado, 0);
  assert.equal(legacy[0].titulo, 'Libro existente');
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = (path, options = {}, admin = true) =>
    fetch(base + path, {
      ...options,
      headers: {
        ...(admin ? { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` } : {}),
        ...(typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  for (const path of [
    '/api/usuarios',
    '/api/prestamos',
    '/api/dashboard',
    '/api/buscar?q=a',
    '/api/libros',
  ])
    assert.equal((await call(path, {}, false)).status, 401);
  assert.equal((await call('/api/libros', { method: 'POST', body: '{}' }, false)).status, 401);
  const loans = await (await call('/api/prestamos')).json();
  assert.equal(loans[0].id, 'legacy-loan');
  assert.equal(loans[0].usuarioNombre, 'Lector existente');
  assert.equal((await call('/api/libros/legacy', { method: 'DELETE' })).status, 400);
  assert.equal((await call('/api/prestamos/legacy-loan/devolver', { method: 'PUT' })).status, 200);
  const returnedBook = await (await call('/api/libros/legacy')).json();
  assert.equal(returnedBook.cantidadDisponible, 1);
  const loanResponse = await call('/api/prestamos', {
    method: 'POST',
    body: JSON.stringify({ libroId: 'legacy', usuarioId: 'legacy-user' }),
  });
  assert.equal(loanResponse.status, 201);
  const activeLoan = await loanResponse.json();
  assert.equal(
    (await call('/api/prestamos/' + activeLoan.id + '/devolver', { method: 'PUT' })).status,
    200,
  );
  assert.deepEqual(await (await call('/api/catalogo', {}, false)).json(), []);
  assert.equal((await call('/api/catalogo/legacy', {}, false)).status, 404);
  let form = new FormData();
  form.append('archivo', new Blob(['<script>bad</script>']), 'book.pdf');
  assert.equal((await call('/api/uploads', { method: 'POST', body: form })).status, 400);
  form = new FormData();
  form.append(
    'archivo',
    new Blob(['%PDF-1.7\nExample upload'], { type: 'application/pdf' }),
    'book.pdf',
  );
  let response = await call('/api/uploads', { method: 'POST', body: form });
  assert.equal(response.status, 201);
  const file = await response.json();
  uploaded.push(file.url.split('/').at(-1));
  assert.equal((await fetch(base + file.url)).status, 200);
  response = await call('/api/libros', {
    method: 'POST',
    body: JSON.stringify({
      titulo: 'Digital',
      autor: 'Autor',
      cantidad: 1,
      formato: 'ambos',
      pdfUrl: file.url,
      publicado: true,
    }),
  });
  assert.equal(response.status, 201);
  const book = await response.json();
  assert.equal(book.pdfUrl, file.url);
  assert.equal(book.publicado, true);
  let catalog = await (await call('/api/catalogo', {}, false)).json();
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].id, book.id);
  assert.equal(
    (await call('/api/libros/' + book.id, { method: 'PUT', body: JSON.stringify({ pdfUrl: '' }) }))
      .status,
    400,
  );
  await call('/api/libros/' + book.id, {
    method: 'PUT',
    body: JSON.stringify({ publicado: false }),
  });
  assert.equal((await call('/api/catalogo/' + book.id, {}, false)).status, 404);
  assert.equal((await call('/api/libros/' + book.id, { method: 'DELETE' })).status, 204);
  assert.equal(
    (
      await call('/api/libros', {
        method: 'POST',
        body: JSON.stringify({ titulo: 'Bad', autor: 'Autor', cantidad: -1 }),
      })
    ).status,
    400,
  );
  console.log(
    'PASS: additive migration, preserved records, public/private access, uploads, publish, unpublish, CRUD and invalid input',
  );
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  for (const name of uploaded) await rm(`${uploadDirectory}/${name}`, { force: true });
  if (ownedDatabase) await pool.query(`DROP DATABASE IF EXISTS \`${process.env.TEST_DB_NAME}\``);
  await pool.end();
}
