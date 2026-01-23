import express from 'express'
import Banner from '../models/Banner.js'
import requireAdmin from '../middleware/auth.js'

const router = express.Router()

const normalizeImagesInput = (images) => {
  if (!Array.isArray(images)) return []
  return images
    .filter(Boolean)
    .map((x) => {
      if (typeof x === 'string') {
        const url = x.toString().trim()
        if (!url) return null
        return { url, publicId: '' }
      }
      if (typeof x !== 'object') return null
      const url = (x.url ?? x.image ?? '').toString().trim()
      const publicId = (x.publicId ?? x.imagePublicId ?? '').toString().trim()
      if (!url && !publicId) return null
      return { url, publicId }
    })
    .filter(Boolean)
}

// GET /api/banner (public)
router.get('/', async (_req, res) => {
  const doc = await Banner.findOne({ key: 'home' }).lean()
  res.json({ key: 'home', images: Array.isArray(doc?.images) ? doc.images : [] })
})

// PUT /api/banner (admin)
router.put('/', requireAdmin, async (req, res) => {
  const images = normalizeImagesInput(req.body?.images)
  const updated = await Banner.findOneAndUpdate(
    { key: 'home' },
    { $set: { images } },
    { new: true, upsert: true }
  ).lean()
  res.json({ key: 'home', images: Array.isArray(updated?.images) ? updated.images : [] })
})

export default router
