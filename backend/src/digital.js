import { timingSafeEqual } from 'node:crypto';

export function requireAdmin(req, res, next) {
  const secret = process.env.ADMIN_TOKEN || '';
  if (secret.length < 24)
    return res
      .status(503)
      .json({ error: 'Configura ADMIN_TOKEN (mínimo 24 caracteres) para administrar' });
  const supplied = Buffer.from((req.headers.authorization || '').replace(/^Bearer /, ''));
  const expected = Buffer.from(secret);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ error: 'Clave de administración incorrecta' });
  }
  next();
}

function url(value, kind) {
  if (!value) return '';
  if (typeof value !== 'string' || value.length > 2048)
    throw new Error('Dirección de archivo no válida');
  if (kind !== 'flipbook' && /^\/uploads\/[a-f0-9-]+\.(pdf|png|jpg|webp)$/.test(value))
    return value;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Utiliza una dirección HTTPS válida');
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password)
    throw new Error('Solo se permiten enlaces HTTPS sin credenciales');
  return parsed.href;
}

export function digitalFields(body, previous = {}) {
  const get = (key, column, fallback = '') => body[key] ?? previous[column] ?? fallback;
  const fields = {
    descripcion: String(get('descripcion', 'descripcion')).trim(),
    portadaUrl: url(get('portadaUrl', 'portada_url'), 'portada'),
    pdfUrl: url(get('pdfUrl', 'pdf_url'), 'pdf'),
    flipbookUrl: url(get('flipbookUrl', 'flipbook_url'), 'flipbook'),
    formato: get('formato', 'formato', 'pdf'),
    publicado: get('publicado', 'publicado', false),
  };
  if (!['pdf', 'flipbook', 'ambos'].includes(fields.formato)) throw new Error('Formato no válido');
  if (![true, false, 0, 1].includes(fields.publicado))
    throw new Error('Estado de publicación no válido');
  if (fields.descripcion.length > 4000)
    throw new Error('La descripción admite hasta 4000 caracteres');
  fields.publicado = Boolean(fields.publicado);
  if (fields.publicado) {
    if (['pdf', 'ambos'].includes(fields.formato) && !fields.pdfUrl)
      throw new Error('Añade un PDF antes de publicar');
    if (['flipbook', 'ambos'].includes(fields.formato) && !fields.pdfUrl && !fields.flipbookUrl)
      throw new Error('Añade un PDF o enlace Flipbook antes de publicar');
  }
  return fields;
}
