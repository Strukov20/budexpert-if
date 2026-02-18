import express from 'express'
import Banner from '../models/Banner.js'
import requireAdmin from '../middleware/auth.js'

const router = express.Router()

const normalizeKey = (raw) => {
  const v = Array.isArray(raw) ? raw[0] : raw
  const k = (v ?? '').toString().trim()
  return k || 'home'
}

const normalizeImagesInput = (images) => {
  if (!Array.isArray(images)) return []
  return images
    .filter(Boolean)
    .map((x) => {
      if (typeof x === 'string') {
        const url = x.toString().trim()
        if (!url) return null
        return { url, publicId: '', link: '' }
      }
      if (typeof x !== 'object') return null
      const url = (x.url ?? x.image ?? '').toString().trim()
      const publicId = (x.publicId ?? x.imagePublicId ?? '').toString().trim()
      const link = (x.link ?? '').toString().trim()
      if (!url && !publicId) return null
      return { url, publicId, link }
    })
    .filter(Boolean)
}

// GET /api/banner (public)
router.get('/', async (req, res) => {
  console.log('[BANNER][GET]', { url: req.originalUrl, query: req.query })
  const key = normalizeKey(req.query?.key)
  const doc = await Banner.findOne({ key }).lean()
  res.json({ key, images: Array.isArray(doc?.images) ? doc.images : [] })
})

// PUT /api/banner (admin)
router.put('/', requireAdmin, async (req, res) => {
  console.log('[BANNER][PUT]', { url: req.originalUrl, query: req.query, bodyKey: req.body?.key })
  const key = normalizeKey(req.body?.key ?? req.query?.key)
  const images = normalizeImagesInput(req.body?.images)
  const updated = await Banner.findOneAndUpdate(
    { key },
    { $set: { images } },
    { new: true, upsert: true }
  ).lean()
  res.json({ key, images: Array.isArray(updated?.images) ? updated.images : [] })
})

export default router
