import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProduct } from '../api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

export default function ProductPage(){
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [p, setP] = useState(null)
  const [err, setErr] = useState('')
  const [activeTab, setActiveTab] = useState('description')
  const [isDescExpanded, setIsDescExpanded] = useState(false)
  const [canExpandDesc, setCanExpandDesc] = useState(false)
  const descRef = useRef(null)

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

  useEffect(()=>{
    setIsDescExpanded(false)
  }, [id])

  useLayoutEffect(()=>{
    const el = descRef.current
    if (!el) return
    if (activeTab !== 'description') {
      setCanExpandDesc(false)
      return
    }
    const check = ()=>{
      const node = descRef.current
      if (!node) return
      if (isDescExpanded) return
      setCanExpandDesc(node.scrollHeight > node.clientHeight + 1)
    }
    const raf = requestAnimationFrame(check)
    window.addEventListener('resize', check)
    return ()=>{
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', check)
    }
  }, [activeTab, p?._id, p?.description, isDescExpanded])

  if (loading) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-10' data-testid='product-page-loading'>
        <div className='text-gray-600'>Завантаження…</div>
      </div>
    )
  }

  if (err) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-10' data-testid='product-page-error'>
        <div className='text-red-700 mb-4'>{err}</div>
        <Link className='underline' to='/' data-testid='product-page-back-home'>На головну</Link>
      </div>
    )
  }

  if (!p) return null

  const img0 = (Array.isArray(p?.images) && p.images[0] && p.images[0].url) ? p.images[0].url : (p.image || '')
  const imageUrl = resolveImageUrl(img0)

  const getSpecsEntries = ()=>{
    const s = p?.specs
    if (!s) return []
    try {
      if (s instanceof Map) return Array.from(s.entries())
    } catch {}
    if (typeof s === 'object') return Object.entries(s)
    return []
  }

  const hasDescription = Boolean((p?.description || '').toString().trim())
  const specsEntries = getSpecsEntries()

  return (
    <div className='max-w-5xl mx-auto px-4 py-8' data-testid='product-page'>
      <div className='mb-4 text-sm text-gray-500'>
        <Link className='hover:underline' to='/' data-testid='product-page-breadcrumb-home'>Головна</Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-800' data-testid='product-page-breadcrumb-name'>{p.name}</span>
      </div>

      <div className='bg-white border rounded-2xl shadow-sm overflow-hidden max-w-4xl mx-auto' data-testid={`product-page-card-${p?._id || ''}`}>
        <div className='p-4 md:p-6'>
          <div className='w-full bg-gray-50 rounded-xl border flex items-center justify-center overflow-hidden'>
            <div className='w-full aspect-[16/9] flex items-center justify-center'>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={p.name}
                  className='w-full h-full object-contain'
                  referrerPolicy='no-referrer'
                  data-testid='product-page-image'
                />
              ) : (
                <div className='text-gray-400'>No image</div>
              )}
            </div>
          </div>

          <h1 className='mt-4 text-2xl font-semibold tracking-tight' data-testid='product-page-title'>{p.name}</h1>
          {p.sku ? (
            <div className='text-sm text-gray-500 mb-1' data-testid='product-page-sku'>Артикул: {p.sku}</div>
          ) : null}

          <div className='mt-4'>
            <div className='inline-flex items-center gap-2 border rounded-xl p-1 bg-gray-50'>
              <button
                type='button'
                onClick={()=> setActiveTab('description')}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab==='description' ? 'bg-white shadow border border-gray-200' : 'text-gray-600 hover:text-black'}`}
                data-testid='product-page-tab-description'
              >
                Опис
              </button>
              <button
                type='button'
                onClick={()=> setActiveTab('specs')}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab==='specs' ? 'bg-white shadow border border-gray-200' : 'text-gray-600 hover:text-black'}`}
                data-testid='product-page-tab-specs'
              >
                Характеристики
              </button>
            </div>

            {activeTab === 'description' ? (
              <div className='mt-3'>
                {hasDescription ? (
                  <div>
                    <div
                      ref={descRef}
                      className='prose prose-sm md:prose-base max-w-none'
                      data-testid='product-page-description'
                      style={
                        isDescExpanded
                          ? undefined
                          : {
                              overflow: 'hidden',
                              lineHeight: 1.5,
                              maxHeight: 'calc(1.5em * 5)'
                            }
                      }
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                        {p.description}
                      </ReactMarkdown>
                    </div>
                    {(isDescExpanded || canExpandDesc) ? (
                      <button
                        type='button'
                        className='mt-3 text-sm font-semibold underline decoration-dotted hover:text-black'
                        onClick={()=> setIsDescExpanded((v)=> !v)}
                        data-testid='product-page-description-toggle'
                      >
                        {isDescExpanded ? 'Згорнути' : 'Показати повністю'}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className='rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-700 text-center'>
                    <div className='text-gray-700'>Опис в процесі добавлення, незабаром все буде!</div>
                    <div className='text-gray-700'>Дякуємо за розуміння!</div>
                  </div>
                )}
              </div>
            ) : (
              <div className='mt-3'>
                {specsEntries.length > 0 ? (
                  <div className='border rounded-lg overflow-hidden'>
                    <table className='w-full text-sm' data-testid='product-page-specs'>
                      <tbody>
                        {specsEntries.map(([k, v]) => (
                          <tr key={String(k)} className='border-t first:border-t-0 odd:bg-gray-50/60'>
                            <td className='px-3 py-2 text-gray-600 w-1/2 align-top'>{String(k)}</td>
                            <td className='px-3 py-2 text-gray-900 align-top'>{String(v ?? '')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className='rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-700 text-center'>
                    <div className='text-gray-700'>Характеристики в процесі добавлення, незабаром все буде!</div>
                    <div className='text-gray-700'>Дякуємо за розуміння!</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className='border-t bg-gray-50 px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div className='flex flex-col items-start'>
            {p.discount ? (
              <>
                <div className='text-sm md:text-base text-gray-400 line-through'>{(Number(p.price||0)||0).toFixed(2)} ₴</div>
                <div className='font-bold text-2xl md:text-3xl text-red-600'>{finalPrice.toFixed(2)} ₴</div>
              </>
            ) : (
              <div className='font-bold text-2xl md:text-3xl'>{finalPrice.toFixed(2)} ₴</div>
            )}
            <div className='text-sm text-gray-600 mt-1'>Наявність: {Number(p.stock ?? 0) > 0 ? 'в наявності' : 'немає'}</div>
          </div>

          <div className='flex gap-2'>
            <button
              type='button'
              onClick={()=> addToCart(p)}
              className='px-4 py-2.5 rounded-lg bg-black text-white hover:bg-red-600 transition'
              data-testid='product-page-add-to-cart'
            >
              Додати в кошик
            </button>
            <Link to='/cart' className='px-4 py-2.5 rounded-lg border hover:bg-gray-50 transition' data-testid='product-page-go-to-cart'>
              Перейти в кошик
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
