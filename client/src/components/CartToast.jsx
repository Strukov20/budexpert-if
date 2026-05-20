import React, { useEffect, useRef, useState } from 'react'
import { FiCheck, FiMinus } from 'react-icons/fi'

export default function CartToast() {
  const [toast, setToast] = useState(null) // { product, type: 'add' | 'remove' }
  const [visible, setVisible] = useState(false)
  const hideTimer = useRef(null)
  const removeTimer = useRef(null)

  useEffect(() => {
    const show = (product, type) => {
      if (!product) return
      clearTimeout(hideTimer.current)
      clearTimeout(removeTimer.current)
      setToast({ product, type })
      setVisible(true)
      hideTimer.current = setTimeout(() => setVisible(false), 2500)
      removeTimer.current = setTimeout(() => setToast(null), 2800)
    }

    const onAdd = (e) => show(e.detail, 'add')
    const onRemove = (e) => show(e.detail, 'remove')

    window.addEventListener('add-to-cart', onAdd)
    window.addEventListener('remove-from-cart', onRemove)
    return () => {
      window.removeEventListener('add-to-cart', onAdd)
      window.removeEventListener('remove-from-cart', onRemove)
      clearTimeout(hideTimer.current)
      clearTimeout(removeTimer.current)
    }
  }, [])

  if (!toast) return null

  const isAdd = toast.type === 'add'

  return (
    <div
      className="fixed top-6 right-4 z-[9999] pointer-events-none"
      style={{
        transform: visible ? 'translateX(0)' : 'translateX(calc(100% + 1rem))',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 pl-3 pr-5 py-3 min-w-[220px] max-w-[300px]">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: isAdd ? 'var(--primary)' : '#6b7280' }}
        >
          {isAdd
            ? <FiCheck className="text-white" size={18} strokeWidth={3} />
            : <FiMinus className="text-white" size={18} strokeWidth={3} />
          }
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] text-gray-400 leading-none mb-0.5">
            {isAdd ? 'Додано в кошик' : 'Прибрано з кошика'}
          </span>
          <span className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
            {toast.product.name}
          </span>
        </div>
      </div>
    </div>
  )
}
