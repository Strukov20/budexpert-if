import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiShoppingCart } from 'react-icons/fi'

const NO_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="9">No image</text></svg>'
const fmt = new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const resolveSrc = (raw) => {
  const s = (raw || '').toString().trim()
  if (!s || s === 'null' || s === 'undefined') return ''
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/')) return s
  return ''
}

export default function FloatingCart() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const leaveTimer = useRef(null)

  const readCart = () => {
    try {
      setItems(JSON.parse(localStorage.getItem('cart') || '[]'))
    } catch {
      setItems([])
    }
  }

  useEffect(() => {
    readCart()
    const onScroll = () => setScrolled(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('add-to-cart', readCart)
    window.addEventListener('remove-from-cart', readCart)
    window.addEventListener('cart-updated', readCart)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('add-to-cart', readCart)
      window.removeEventListener('remove-from-cart', readCart)
      window.removeEventListener('cart-updated', readCart)
    }
  }, [])

  const count = items.reduce((s, i) => s + (i.quantity || 1), 0)
  const total = items.reduce((s, i) => s + i.price * (i.quantity || 1), 0)

  const handleMouseEnter = () => {
    clearTimeout(leaveTimer.current)
    setOpen(true)
  }
  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setOpen(false), 150)
  }

  return (
    <div
      className="fixed bottom-20 right-4 z-[9998]"
      style={{
        opacity: scrolled ? 1 : 0,
        transform: scrolled ? 'translateY(0)' : 'translateY(1.5rem)',
        pointerEvents: scrolled ? 'auto' : 'none',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Попап */}
      <div
        className="absolute bottom-14 right-0 w-72 bg-white rounded-2xl shadow-2xl ring-1 ring-gray-100 overflow-hidden transition-all duration-200"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.97)',
          pointerEvents: open ? 'auto' : 'none',
          transformOrigin: 'bottom right',
        }}
      >
        <div className="p-4">
          <div className="font-semibold text-gray-800 mb-3">Мій кошик</div>
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">Кошик порожній</div>
          ) : (
            <>
              <div className="divide-y max-h-60 overflow-auto">
                {items.slice(0, 5).map(i => (
                  <div key={i._id} className="py-2.5 flex items-center gap-3">
                    <img
                      src={resolveSrc(i.images?.[0]?.url || i.image) || NO_IMG}
                      alt={i.name}
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = NO_IMG }}
                      className="w-11 h-11 object-cover rounded-lg flex-shrink-0 bg-gray-50"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{i.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {i.quantity || 1} × {fmt.format(i.price)} ₴
                      </div>
                    </div>
                  </div>
                ))}
                {items.length > 5 && (
                  <div className="pt-2 text-xs text-gray-400 text-center">
                    +{items.length - 5} ще...
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">Всього:</span>
                <span className="px-3 py-1.5 rounded-full text-white text-sm font-semibold shadow" style={{ background: 'var(--primary)' }}>
                  {fmt.format(total)} ₴
                </span>
              </div>
              <button
                onClick={() => navigate('/cart')}
                className="mt-3 w-full py-2 rounded-xl text-sm font-semibold text-white transition active:scale-95"
                style={{ background: 'var(--primary)' }}
              >
                Перейти в кошик
              </button>
            </>
          )}
        </div>
      </div>

      {/* Кнопка */}
      <button
        onClick={() => navigate('/cart')}
        aria-label="Кошик"
        className="relative w-11 h-11 rounded-xl shadow-lg flex items-center justify-center bg-white transition-all duration-200 active:scale-95"
        style={{ border: '1.5px solid #e5e7eb' }}
      >
        <FiShoppingCart size={20} strokeWidth={2} style={{ color: 'var(--primary)' }} />
        {count > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none"
            style={{ background: 'var(--primary)' }}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    </div>
  )
}
