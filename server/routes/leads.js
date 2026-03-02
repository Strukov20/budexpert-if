import express from 'express'
import Lead from '../models/Lead.js'
import requireAdmin from '../middleware/auth.js'

const router = express.Router()

const UA_MOBILE_OPERATOR_CODES = new Set([
  '39','50','63','66','67','68','73','89','91','92','93','94','95','96','97','98','99'
])

const normalizeUaPhone = (v) => {
  const digits = (v || '').toString().replace(/\D+/g, '')
  let local = ''
  if (digits.startsWith('380')) local = digits.slice(3, 12)
  else if (digits.startsWith('0')) local = digits.slice(1, 10)
  else local = digits.slice(-9)
  return '+380' + (local ? local : '')
}

const isUaMobilePhoneValid = (v) => {
  if (!/^\+380\d{9}$/.test(v)) return false
  const code = v.slice(4, 6)
  return UA_MOBILE_OPERATOR_CODES.has(code)
}

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

    const normalizedPhone = normalizeUaPhone(phone)
    if (!isUaMobilePhoneValid(normalizedPhone)) {
      return res.status(400).json({ error: 'Invalid phone' })
    }
    if (t === 'delivery' && (!city || !street || !house || !datetime)) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const doc = await Lead.create({
      type: t,
      name,
      phone: normalizedPhone,
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

// Delete lead (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const doc = await Lead.findByIdAndDelete(id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete lead' })
  }
})

export default router
