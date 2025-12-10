import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v2 as cloudinary } from 'cloudinary'

const router = express.Router()

// Локальна папка можна залишити як тимчасове сховище (multer зберігає сюди перед аплоудом у Cloudinary)
const uploadsDir = path.join(process.cwd(), 'server', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

// Конфіг Cloudinary з env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '')
    const base = path.basename(file.originalname || 'file', ext).replace(/[^a-zA-Z0-9_-]/g,'')
    const name = `${base || 'file'}_${Date.now()}${ext || ''}`
    cb(null, name)
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
    if (allowed.includes(file.mimetype)) return cb(null, true)
    cb(new Error('Invalid file type'))
  }
})

// POST /api/uploads (form-data: file)
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Файл не отримано' })

    // Шлях до тимчасового файлу, який зберіг multer
    const localPath = req.file.path

    // Завантаження у Cloudinary в папку "products"
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'products',
      resource_type: 'image',
    })

    const url = result.secure_url
    const publicId = result.public_id

    // Відповідь у форматі, сумісному з адмінкою (url основний, filename залишаємо як publicId)
    res.status(201).json({ url, filename: publicId })
  } catch (err) {
    console.error('Upload error (Cloudinary):', err)
    res.status(500).json({ message: 'Не вдалося завантажити зображення' })
  }
})

export default router

