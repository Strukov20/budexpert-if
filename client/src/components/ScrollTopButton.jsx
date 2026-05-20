import React, { useEffect, useState } from 'react'
import { FiArrowUp } from 'react-icons/fi'

export default function ScrollTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Вгору"
      className="fixed bottom-6 right-4 z-[9998] w-11 h-11 rounded-xl shadow-lg flex items-center justify-center transition-all duration-300"
      style={{
        background: 'var(--primary)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(1.5rem)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <FiArrowUp className="text-white" size={20} strokeWidth={2.5} />
    </button>
  )
}
