import test from 'node:test';
import assert from 'node:assert/strict';
import { digitalFields, requireAdmin } from '../src/digital.js';
test('existing books remain drafts and can be extended without losing fields', () => {
  assert.equal(digitalFields({}).publicado, false);
  assert.equal(
    digitalFields({ descripcion: 'Nueva' }, { pdf_url: '/uploads/123.pdf', publicado: 1 }).pdfUrl,
    '/uploads/123.pdf',
  );
});
test('publication requires a source matching its reading mode', () => {
  assert.throws(() => digitalFields({ publicado: true }), /PDF/);
  assert.throws(
    () =>
      digitalFields({ publicado: true, formato: 'ambos', flipbookUrl: 'https://example.com/book' }),
    /PDF/,
  );
  assert.equal(
    digitalFields({ publicado: true, formato: 'flipbook', pdfUrl: '/uploads/123.pdf' }).publicado,
    true,
  );
  assert.equal(
    digitalFields({ publicado: true, formato: 'flipbook', flipbookUrl: 'https://example.com/book' })
      .formato,
    'flipbook',
  );
});
test('rejects executable, relative external and credential URLs and invalid formats', () => {
  for (const pdfUrl of [
    'javascript:alert(1)',
    'data:text/html,hello',
    '//evil.test/a',
    'https://user:pass@example.com/a',
    '/uploads/../a.pdf',
  ])
    assert.throws(() => digitalFields({ pdfUrl }));
  assert.throws(() => digitalFields({ formato: 'video' }));
  assert.throws(() => digitalFields({ publicado: 'false' }));
});
test('admin API fails closed without a configured key and rejects wrong keys', () => {
  const old = process.env.ADMIN_TOKEN;
  try {
    let status,
      passed = false;
    const res = {
      status(n) {
        status = n;
        return this;
      },
      json() {},
    };
    delete process.env.ADMIN_TOKEN;
    requireAdmin({ headers: {} }, res, () => {
      passed = true;
    });
    assert.equal(status, 503);
    process.env.ADMIN_TOKEN = 'a'.repeat(32);
    requireAdmin({ headers: { authorization: 'Bearer wrong' } }, res, () => {
      passed = true;
    });
    assert.equal(status, 401);
    assert.equal(passed, false);
    requireAdmin({ headers: { authorization: `Bearer ${'a'.repeat(32)}` } }, res, () => {
      passed = true;
    });
    assert.equal(passed, true);
  } finally {
    if (old === undefined) delete process.env.ADMIN_TOKEN;
    else process.env.ADMIN_TOKEN = old;
  }
});
