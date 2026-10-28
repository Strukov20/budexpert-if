import { createRouter } from '../middleware/router.js';
import multer from 'multer';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import requireAdmin from '../middleware/auth.js';

const router = createRouter();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
});

router.post('/', requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Файл не отримано' });
  // Decode and re-encode actual raster data. Do not trust a client-supplied MIME type
  // or publish original HTML/SVG files on the application origin.
  let buffer;
  try {
    const image = sharp(req.file.buffer, { limitInputPixels: 40_000_000 });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp', 'gif'].includes(metadata.format)) throw new Error('Invalid format');
    buffer = await image.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  } catch {
    return res.status(400).json({ message: 'Потрібне зображення JPEG, PNG, WebP або GIF до 5 МБ' });
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(503).json({ message: 'Завантаження зображень тимчасово недоступне' });
  }
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: 'products', resource_type: 'image', format: 'webp' }, (error, result) => {
      if (error) reject(error); else resolve(result);
    }).end(buffer);
  });
  res.status(201).json({ url: result.secure_url, filename: result.public_id });
});
export default router;
