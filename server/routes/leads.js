import express from 'express'
import Lead from '../models/Lead.js'

const router = express.Router()

// Create lead
router.post('/', async (req, res) => {
  try {
    const { type, name, phone, city, street, house, datetime } = req.body
    const t = (type || 'delivery').toString()
    if (!['call', 'delivery'].includes(t)) {
      return res.status(400).json({ error: 'Invalid type' })
    }
    if (!name || !phone) {
      return res.status(400).json({ error: 'Missing fields' })
    }
    if (t === 'delivery' && (!city || !street || !house || !datetime)) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const doc = await Lead.create({
      type: t,
      name,
      phone,
      city: city || '',
      street: street || '',
      house: house || '',
      datetime: datetime || undefined,
    })
    res.json(doc)
  } catch (e) {
    res.status(500).json({ error: 'Failed to create lead' })
  }
})

// List leads (latest first)
router.get('/', async (req, res) => {
  try {
    const { active } = req.query
    const query = {}
    if (active === 'true') {
      query.status = { $in: ['new','in_progress'] }
    }
    const page = parseInt(req.query.page, 10)
    const limit = parseInt(req.query.limit, 10)
    if (Number.isInteger(page) && Number.isInteger(limit) && limit > 0) {
      const skip = Math.max(0, (page - 1)) * limit
      const [items, total] = await Promise.all([
        Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Lead.countDocuments(query)
      ])
      return res.json({ items, total, page, limit, pages: Math.ceil(total/limit) })
    }
    const list = await Lead.find(query).sort({ createdAt: -1 }).limit(500)
    res.json(list)
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch leads' })
  }
})

// Update lead (status)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const allowed = ['new','in_progress','done','cancelled']
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' })
    const doc = await Lead.findByIdAndUpdate(id, { status }, { new: true })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (e) {
    res.status(500).json({ error: 'Failed to update lead' })
  }
})

export default router
