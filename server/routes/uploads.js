import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = express.Router()

const uploadsDir = path.join(process.cwd(), 'server', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

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
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Файл не отримано' })
  const filename = req.file.filename
  const relativeUrl = `/uploads/${filename}`
  const origin = `${req.protocol}://${req.get('host')}`
  const url = `${origin}${relativeUrl}`
  res.status(201).json({ url, filename })
})

export default router

