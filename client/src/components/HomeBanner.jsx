import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getBanner } from '../api'

export default function HomeBanner(){
  const [images, setImages] = useState([])
  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const timerRef = useRef(null)

  const hasImages = Array.isArray(images) && images.length > 0

  const resolveSrc = useMemo(() => (raw) => {
    let s = (raw || '').toString().trim()
    if (!s || s === 'null' || s === 'undefined') return ''
    if (s.startsWith('http://') || s.startsWith('https://')) return s
    if (s.startsWith('/uploads/')) {
      try {
        const api = import.meta.env.VITE_API_URL || ''
        if (api && (api.startsWith('http://') || api.startsWith('https://'))) {
          const origin = new URL(api).origin
          return origin + s
        }
      } catch {}
      return s
    }
    if (s.startsWith('/')) return s
    return ''
  }, [])

  useEffect(()=>{
    let mounted = true
    getBanner()
      .then((d)=>{
        if (!mounted) return
        const imgs = Array.isArray(d?.images) ? d.images : []
        setImages(imgs)
        setIdx(0)
      })
      .catch(()=>{})
    return ()=> { mounted = false }
  },[])

  const startTimer = ()=>{
    if (timerRef.current) clearInterval(timerRef.current)
    if (!hasImages || images.length <= 1) return
    timerRef.current = setInterval(()=>{
      setFading(true)
      setTimeout(()=>{
        setIdx((v)=> (v + 1) % images.length)
        setFading(false)
      }, 350)
    }, 6000)
  }

  useEffect(()=>{
    startTimer()
    return ()=> { if (timerRef.current) clearInterval(timerRef.current) }
  }, [hasImages, images.length])

  if (!hasImages) return null

  const active = images[idx] || {}
  const src = resolveSrc(active.url)
  if (!src) return null

  return (
    <div className='mb-6' data-testid='home-banner'>
      <div className={`relative overflow-hidden rounded-2xl bg-transparent border border-white/5 h-[22vh] md:h-[32vh] min-h-[145px] md:min-h-[176px] max-h-[420px] shadow transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`} data-testid='home-banner-frame'>
        <img
          src={src}
          alt='banner'
          className='absolute inset-0 w-full h-full object-contain'
          referrerPolicy='no-referrer'
          data-testid='home-banner-image'
        />

        {images.length > 1 && (
          <div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2' data-testid='home-banner-dots'>
            {images.map((_x, i)=>(
              <button
                key={i}
                type='button'
                aria-label={`Слайд ${i+1}`}
                onClick={()=>{ setFading(true); setTimeout(()=>{ setIdx(i); setFading(false) }, 200); startTimer() }}
                className={`h-2.5 w-2.5 rounded-full ring-1 transition ${i===idx ? 'bg-red-600 ring-red-600' : 'bg-red-200 ring-red-300 hover:bg-red-300 hover:ring-red-400'}`}
                data-testid={`home-banner-dot-${i}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
