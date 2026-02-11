import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProduct } from '../api'

export default function ProductPage(){
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [p, setP] = useState(null)
  const [err, setErr] = useState('')

  const resolveImageUrl = useMemo(()=> (u)=>{
    const v = (u || '').toString().trim()
    if (!v) return ''
    if (v.startsWith('http://') || v.startsWith('https://')) return v
    if (v.startsWith('/uploads/')) {
      try {
        const api = import.meta.env.VITE_API_URL || ''
        if (api) return new URL(api).origin + v
      } catch {}
    }
    return v
  }, [])

  const finalPrice = useMemo(()=>{
    const price = Number(p?.price || 0) || 0
    const discount = Math.max(0, Math.min(100, Number(p?.discount || 0) || 0))
    if (!discount) return price
    return price * (1 - discount/100)
  }, [p])

  const addToCart = (prod)=>{
    try {
      const stored = JSON.parse(localStorage.getItem('cart')||'[]')
      const idx = stored.findIndex(x=> x._id === prod._id)
      if(idx>=0){
        stored[idx].quantity = (stored[idx].quantity||1) + 1
      } else {
        stored.push({ ...prod, quantity: 1 })
      }
      localStorage.setItem('cart', JSON.stringify(stored))
      window.dispatchEvent(new Event('cart-updated'))
    } catch {}
  }

  useEffect(()=>{
    if (!id) return
    let alive = true
    setLoading(true)
    setErr('')
    getProduct(id)
      .then((d)=>{ if(alive) setP(d) })
      .catch(()=>{ if(alive) setErr('Товар не знайдено') })
      .finally(()=>{ if(alive) setLoading(false) })
    return ()=>{ alive = false }
  }, [id])

  if (loading) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-10'>
        <div className='text-gray-600'>Завантаження…</div>
      </div>
    )
  }

  if (err) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-10'>
        <div className='text-red-700 mb-4'>{err}</div>
        <Link className='underline' to='/'>На головну</Link>
      </div>
    )
  }

  if (!p) return null

  const img0 = (Array.isArray(p?.images) && p.images[0] && p.images[0].url) ? p.images[0].url : (p.image || '')
  const imageUrl = resolveImageUrl(img0)

  return (
    <div className='max-w-5xl mx-auto px-4 py-8'>
      <div className='mb-4 text-sm text-gray-500'>
        <Link className='hover:underline' to='/'>Головна</Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-800'>{p.name}</span>
      </div>

      <div className='grid md:grid-cols-2 gap-6'>
        <div className='bg-white border rounded-2xl p-4 flex items-center justify-center min-h-[280px]'>
          {imageUrl ? (
            <img src={imageUrl} alt={p.name} className='max-h-[420px] w-full object-contain' referrerPolicy='no-referrer' />
          ) : (
            <div className='text-gray-400'>No image</div>
          )}
        </div>

        <div className='bg-white border rounded-2xl p-5'>
          <h1 className='text-2xl font-semibold mb-3'>{p.name}</h1>

          <div className='flex items-baseline gap-3 mb-4'>
            <div className='text-2xl font-bold'>{finalPrice.toFixed(2)} ₴</div>
            {p.discount ? (
              <div className='text-sm text-gray-500 line-through'>{(Number(p.price||0)||0).toFixed(2)} ₴</div>
            ) : null}
          </div>

          <div className='text-sm text-gray-600 mb-4'>
            Наявність: {Number(p.stock ?? 0) > 0 ? 'в наявності' : 'немає'}
          </div>

          <div className='flex gap-2'>
            <button
              type='button'
              onClick={()=> addToCart(p)}
              className='px-4 py-2.5 rounded-lg bg-black text-white hover:bg-red-600 transition'
            >
              Додати в кошик
            </button>
            <Link to='/cart' className='px-4 py-2.5 rounded-lg border hover:bg-gray-50 transition'>
              Перейти в кошик
            </Link>
          </div>

          {p.description ? (
            <div className='mt-6'>
              <div className='font-semibold mb-2'>Опис</div>
              <div className='text-gray-700 whitespace-pre-wrap'>{p.description}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
