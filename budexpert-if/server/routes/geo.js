import express from 'express'

const router = express.Router()

const TTL_MS = 12 * 60 * 60 * 1000
const cache = new Map()

const getCached = (key) => {
  const v = cache.get(key)
  if (!v) return null
  if (Date.now() > v.expiresAt) {
    cache.delete(key)
    return null
  }
  return v.data
}

const setCached = (key, data) => {
  cache.set(key, { data, expiresAt: Date.now() + TTL_MS })
}

router.get('/if/streets', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim()
    if (q.length < 4) return res.json([])

    // If user types Latin characters, Nominatim suggestions tend to be irrelevant.
    // For now, return empty suggestions (manual input still allowed).
    if (/[A-Za-z]/.test(q)) return res.json([])

    const key = q.toLowerCase()
    const cached = getCached(key)
    if (cached) return res.json(cached)

    const baseUrl = new URL('https://nominatim.openstreetmap.org/search')
    baseUrl.searchParams.set('format', 'jsonv2')
    baseUrl.searchParams.set('addressdetails', '1')
    baseUrl.searchParams.set('limit', '10')
    baseUrl.searchParams.set('countrycodes', 'ua')
    // approximate bounding box for Ivano-Frankivsk city area (lon_left, lat_top, lon_right, lat_bottom)
    baseUrl.searchParams.set('viewbox', '24.55,49.05,24.90,48.80')
    baseUrl.searchParams.set('bounded', '0')

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4500)

    const fetchJson = async (url) => {
      const r = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'budexpert-if (street autocomplete)',
          'Accept-Language': 'uk,en;q=0.8',
        },
      })
      if (!r.ok) return []
      const data = await r.json()
      return Array.isArray(data) ? data : []
    }

    // 1) Structured query usually works better for prefixes (e.g. "хім" -> "Хіміків")
    const structured = new URL(baseUrl.toString())
    structured.searchParams.delete('q')
    structured.searchParams.set('street', q)
    structured.searchParams.set('city', 'Івано-Франківськ')

    // 2) Fallback to free-form query
    const fallback = new URL(baseUrl.toString())
    fallback.searchParams.set('q', `${q}, Івано-Франківськ, Україна`)

    let dataStructured = []
    let dataFallback = []
    try {
      dataStructured = await fetchJson(structured)
      dataFallback = dataStructured.length ? [] : await fetchJson(fallback)
    } finally {
      clearTimeout(timer)
    }
    const data = dataStructured.length ? dataStructured : dataFallback

    const normalizeLabel = (s) => {
      const v = (s || '').toString().trim()
      return v
        .replace(/^(вулиця|вул\.|провулок|пров\.|проспект|просп\.|площа|пл\.)\s+/iu, '')
        .trim()
    }

    const suggestions = (Array.isArray(data) ? data : [])
      .map(x => {
        const name = (x && (x.display_name || x.name)) ? String(x.display_name || x.name) : ''
        const first = name.split(',')[0]?.trim() || ''
        const address = x?.address || {}
        const labelRaw = (
          address.road ||
          address.pedestrian ||
          address.footway ||
          address.cycleway ||
          address.path ||
          first
        ).toString().trim()

        const label = normalizeLabel(labelRaw)

        const isStreetLike = Boolean(address.road || address.pedestrian || address.footway || address.cycleway || address.path) || x?.class === 'highway'
        return { label, isStreetLike }
      })
      .filter(x => x.label && x.isStreetLike)
      .map(x => x.label)

    const qLower = q.toLowerCase()
    const unique = Array.from(new Set(suggestions))
      .filter(s => s.toLowerCase().includes(qLower))
      .slice(0, 10)
    setCached(key, unique)
    res.json(unique)
  } catch {
    res.json([])
  }
})

export default router
