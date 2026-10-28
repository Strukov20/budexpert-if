import { createRouter } from '../middleware/router.js';
import { publicBaseUrl } from '../config.js'
import { priceInKopiykas } from '../services/pricing.js'
import { once } from 'node:events'
import Product from '../models/Product.js'

const router = createRouter()

function xmlEscape(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function stripHtml(input) {
  return String(input ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const CUSTOM_LABEL_RULES = [
  { match: 'будівельні суміші',    label: 'будівельні суміші' },
  { match: 'матеріали для ремонту', label: 'матеріали для ремонту' },
  { match: 'електротовари',         label: 'електротовари' },
  { match: 'витратні матеріали',    label: 'витратні матеріали' },
  { match: 'сантехніка',            label: 'сантехніка' },
  { match: 'клеї',                  label: 'клеї' },
]

function resolveCustomLabel0(categoryName) {
  const name = (categoryName || '').toString().toLowerCase().trim()
  if (!name) return ''
  const rule = CUSTOM_LABEL_RULES.find(r => name.includes(r.match))
  return rule ? rule.label : ''
}

function pickBrandFromSpecs(specs) {
  if (!specs) return ''
  const obj = specs instanceof Map ? Object.fromEntries(specs) : specs
  if (!obj || typeof obj !== 'object') return ''

  const keys = ['Бренд', 'бренд', 'Brand', 'brand', 'Виробник', 'виробник', 'Manufacturer', 'manufacturer']
  for (const k of keys) {
    const v = obj[k]
    const s = (v ?? '').toString().trim()
    if (s) return s
  }
  return ''
}

function absoluteUrl(base, maybeRelative) {
  const u = (maybeRelative || '').toString().trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('/')) return base.replace(/\/$/, '') + u
  return base.replace(/\/$/, '') + '/' + u
}

router.get('/google-shopping.xml', async (req, res) => {
  try {
    const baseUrl = publicBaseUrl()
    const currency = (process.env.SHOP_CURRENCY || 'UAH').toString().trim() || 'UAH'

    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .populate('category')
      .lean().cursor()

    const now = new Date().toUTCString()

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.write(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>БудЕксперт</title><link>${xmlEscape(baseUrl)}</link><description>Каталог товарів БудЕксперт</description><lastBuildDate>${xmlEscape(now)}</lastBuildDate>`)
    for await (const p of products) {
      if (res.destroyed) break
      const id = (p?.sku || p?._id || '').toString()
      const title = (p?.name || '').toString().trim()
      const description = stripHtml(p?.description || '')
      const link = `${baseUrl}/p/${encodeURIComponent(String(p?._id || ''))}`

      const img0 = (Array.isArray(p?.images) && p.images[0] && p.images[0].url) ? p.images[0].url : (p?.image || '')
      const imageLink = absoluteUrl(baseUrl, img0)

      const priceRaw = Number(p?.price || 0) || 0
      const discount = Math.max(0, Math.min(100, Number(p?.discount || 0) || 0))
      const finalPrice = priceInKopiykas(p) / 100

      const stock = Number(p?.stock ?? 0) || 0
      const availability = stock > 0 ? 'in_stock' : 'out_of_stock'

      const brand = pickBrandFromSpecs(p?.specs)
      const categoryName = (p?.category && typeof p.category === 'object') ? (p.category.name || '') : ''

      const mpn = (p?.sku || '').toString().trim()

      const parts = []
      parts.push('<item>')
      parts.push(`<g:id>${xmlEscape(id)}</g:id>`)
      parts.push(`<g:title>${xmlEscape(title)}</g:title>`)
      parts.push(`<g:description>${xmlEscape(description || title)}</g:description>`)
      parts.push(`<g:link>${xmlEscape(link)}</g:link>`)
      if (imageLink) parts.push(`<g:image_link>${xmlEscape(imageLink)}</g:image_link>`)
      parts.push(`<g:condition>new</g:condition>`)
      parts.push(`<g:availability>${availability}</g:availability>`)
      parts.push(`<g:price>${priceRaw.toFixed(2)} ${xmlEscape(currency)}</g:price>`)
      if (discount) {
        parts.push(`<g:sale_price>${finalPrice.toFixed(2)} ${xmlEscape(currency)}</g:sale_price>`)
      }

      if (brand) {
        parts.push(`<g:brand>${xmlEscape(brand)}</g:brand>`)
      } else {
        parts.push('<g:identifier_exists>false</g:identifier_exists>')
      }

      if (mpn) parts.push(`<g:mpn>${xmlEscape(mpn)}</g:mpn>`)
      if (categoryName) parts.push(`<g:product_type>${xmlEscape(categoryName)}</g:product_type>`)

      const customLabel0 = resolveCustomLabel0(categoryName)
      if (customLabel0) parts.push(`<g:custom_label_0>${xmlEscape(customLabel0)}</g:custom_label_0>`)

      parts.push('</item>')
      if (!res.write(parts.join(''))) await once(res, 'drain')
    }
    res.end('</channel></rss>')
  } catch (e) {
    if (res.headersSent) return res.destroy()
    res.status(500).json({ error: 'Failed to generate merchant feed' })
  }
})

export default router
