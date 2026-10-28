import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getPageMetadata } from '../api'
import { staticPages, homeTitle } from '../../../shared/pages.mjs'

function setTag(selector, attributes) {
  let node = document.head.querySelector(selector)
  if (!node) { node = document.createElement(selector.startsWith('link') ? 'link' : 'meta'); document.head.appendChild(node) }
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value)
}
function applyMetadata(data) {
  document.title = data.title
  setTag('meta[name="description"]', { name: 'description', content: data.description || '' })
  setTag('meta[name="robots"]', { name: 'robots', content: data.noindex ? 'noindex,follow' : 'index,follow' })
  setTag('link[rel="canonical"]', { rel: 'canonical', href: data.canonical })
  for (const [name, content] of Object.entries({ title: data.title, description: data.description || '', image: data.image || new URL('/logo.png', location.origin).href, url: data.canonical, type: data.type || 'website' })) {
    setTag(`meta[property="og:${name}"]`, { property: `og:${name}`, content })
    if (['title', 'description', 'image'].includes(name)) setTag(`meta[name="twitter:${name}"]`, { name: `twitter:${name}`, content })
  }
  document.head.querySelectorAll('script[data-seo="structured"]').forEach(node => node.remove())
  for (const value of data.structuredData || []) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.seo = 'structured'
    script.textContent = JSON.stringify(value)
    document.head.appendChild(script)
  }
}
export default function Seo() {
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const controller = new AbortController()
    const fallback = staticPages[location.pathname]
    // Clear metadata from the previous route immediately.
    const canonical = new URL(location.pathname + location.search, window.location.origin).href
    if (document.querySelector('link[rel="canonical"]')?.href !== canonical) {
      applyMetadata({ title: fallback?.title || homeTitle, description: fallback?.description || '', noindex: fallback?.noindex || false, canonical })
    }
    getPageMetadata(location.pathname, location.search, controller.signal).then(data => {
      if (controller.signal.aborted) return
      if (data.redirect) navigate(data.redirect, { replace: true })
      else applyMetadata(data)
    }).catch(() => {})
    return () => controller.abort()
  }, [location.pathname, location.search, navigate])
  return null
}
