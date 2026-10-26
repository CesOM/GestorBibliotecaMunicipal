import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
export const uploadDirectory = fileURLToPath(new URL('../../uploads/', import.meta.url));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024, files: 1, fields: 0 },
});
const router = Router();
router.post('/', upload.single('archivo'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Selecciona un archivo' });
    const b = file.buffer;
    let extension;
    if (b.subarray(0, 5).toString() === '%PDF-') extension = 'pdf';
    else if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
      extension = 'png';
    else if (b[0] === 255 && b[1] === 216 && b[2] === 255) extension = 'jpg';
    else if (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP')
      extension = 'webp';
    if (!extension)
      return res.status(400).json({ error: 'Solo se admiten PDF e imágenes PNG, JPG o WebP' });
    await mkdir(uploadDirectory, { recursive: true });
    const filename = `${randomUUID()}.${extension}`;
    await writeFile(`${uploadDirectory}/${filename}`, b, { flag: 'wx' });
    res
      .status(201)
      .json({ url: `/uploads/${filename}`, tipo: extension === 'pdf' ? 'pdf' : 'imagen' });
  } catch (e) {
    next(e);
  }
});
export default router;
