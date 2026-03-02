import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCategories, getProducts } from '../api'
import ProductCard from '../components/ProductCard'

export default function ProductsSearch(){
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 20
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef(null)
  const abortRef = useRef(null)
  const reqIdRef = useRef(0)
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const topRef = useRef(null)

  const q = useMemo(()=>{
    try {
      const params = new URLSearchParams(location.search || '')
      return (params.get('q') || '').toString().trim()
    } catch {
      return ''
    }
  }, [location.search])

  const shuffle = (arr)=>{
    const a = Array.isArray(arr) ? arr.slice() : []
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = a[i]
      a[i] = a[j]
      a[j] = tmp
    }
    return a
  }

  const mergeUniqueById = (prev, next)=>{
    const out = []
    const seen = new Set()
    const add = (p)=>{
      const id = (p?._id || '').toString()
      if (!id) return
      if (seen.has(id)) return
      seen.add(id)
      out.push(p)
    }
    ;(Array.isArray(prev) ? prev : []).forEach(add)
    ;(Array.isArray(next) ? next : []).forEach(add)
    return out
  }

  const category = useMemo(()=>{
    try {
      const params = new URLSearchParams(location.search || '')
      return (params.get('cat') || '').toString().trim()
    } catch {
      return ''
    }
  }, [location.search])

  const subcategory = useMemo(()=>{
    try {
      const params = new URLSearchParams(location.search || '')
      return (params.get('sub') || '').toString().trim()
    } catch {
      return ''
    }
  }, [location.search])

  useEffect(()=>{
    let alive = true
    setLoadingCategories(true)
    getCategories()
      .then((d)=>{ if (alive) setCategories(Array.isArray(d) ? d : []) })
      .catch(()=>{ if (alive) setCategories([]) })
      .finally(()=>{ if (alive) setLoadingCategories(false) })
    return ()=>{ alive = false }
  }, [])

  const getParentId = (c)=>{
    const p = c?.parent
    if (!p) return ''
    if (typeof p === 'string') return p
    if (typeof p === 'object') return p?._id || p?.id || (typeof p?.toString === 'function' ? p.toString() : '')
    return ''
  }

  const mainCategories = useMemo(
    ()=> (Array.isArray(categories) ? categories : []).filter(c=> !getParentId(c)),
    [categories]
  )

  const subcategoriesByParent = (parentId)=> (Array.isArray(categories) ? categories : []).filter(c=> {
    const pid = getParentId(c)
    return pid && String(pid) === String(parentId || '')
  })

  const subcategoryOptions = useMemo(()=> (category ? subcategoriesByParent(category) : []), [category, categories])

  useEffect(()=>{
    setItems([])
    setPage(1)
    setHasMore(true)
  }, [q, category, subcategory])

  useEffect(()=>{
    if (!hasMore) return

    const isFirstPage = page === 1
    const reqId = ++reqIdRef.current

    if (abortRef.current) {
      try { abortRef.current.abort() } catch {}
      abortRef.current = null
    }

    const controller = new AbortController()
    abortRef.current = controller
    if (isFirstPage) setLoading(true)
    else setLoadingMore(true)

    getProducts({
      q: q || undefined,
      category: category || undefined,
      subcategory: subcategory || undefined,
      page,
      limit: perPage,
    }, { signal: controller.signal })
      .then((d)=>{
        if (controller.signal.aborted) return
        if (reqIdRef.current !== reqId) return
        const rawArr = Array.isArray(d?.items) ? d.items : (Array.isArray(d) ? d : [])
        const arr = hasFilters ? rawArr : shuffle(rawArr)
        setItems(prev => (page === 1 ? mergeUniqueById([], arr) : mergeUniqueById(prev, arr)))

        const totalPages = Number(d?.totalPages ?? 0) || 0
        if (totalPages) {
          setHasMore(page < totalPages)
        } else {
          setHasMore(arr.length === perPage)
        }
      })
      .catch(()=>{
        if (controller.signal.aborted) return
        if (reqIdRef.current !== reqId) return
        if (page === 1) setItems([])
        setHasMore(false)
      })
      .finally(()=>{
        if (abortRef.current === controller) abortRef.current = null
        if (reqIdRef.current === reqId) {
          setLoading(false)
          setLoadingMore(false)
        }
      })

    return ()=>{
      try { controller.abort() } catch {}
    }
  }, [q, category, subcategory, page, hasMore])

  useEffect(()=>{
    const el = sentinelRef.current
    if (!el) return
    if (!hasMore) return

    const obs = new IntersectionObserver(
      (entries)=>{
        const first = entries && entries[0]
        if (!first?.isIntersecting) return
        if (loading || loadingMore) return
        setPage(p => p + 1)
      },
      { root: null, rootMargin: '600px 0px', threshold: 0 }
    )

    obs.observe(el)
    return ()=> obs.disconnect()
  }, [hasMore, loading, loadingMore])

  useEffect(()=>{
    if (!topRef.current) return
    requestAnimationFrame(()=>{
      const el = topRef.current
      const top = (el.getBoundingClientRect?.().top || 0) + window.scrollY - 140
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    })
  }, [q, category, subcategory])

  const reset = ()=>{
    navigate('/products')
  }

  const goHome = ()=>{
    navigate('/')
  }

  const hasFilters = Boolean(
    String(q || '').trim() ||
    String(category || '').trim() ||
    String(subcategory || '').trim()
  )

  const setCategory = (catId)=>{
    let params
    try { params = new URLSearchParams(location.search || '') } catch { params = new URLSearchParams() }
    const next = (catId || '').toString().trim()
    if (next) params.set('cat', next)
    else params.delete('cat')
    params.delete('sub')
    const qs = params.toString()
    navigate('/products' + (qs ? `?${qs}` : ''))
  }

  const setSubcategory = (subId)=>{
    let params
    try { params = new URLSearchParams(location.search || '') } catch { params = new URLSearchParams() }
    const next = (subId || '').toString().trim()
    if (next) params.set('sub', next)
    else params.delete('sub')
    const qs = params.toString()
    navigate('/products' + (qs ? `?${qs}` : ''))
  }

  return (
    <div className='max-w-7xl mx-auto px-3 md:px-6 py-8'>
      <div ref={topRef} />

      <div className='flex items-start justify-between gap-3 flex-wrap'>
        <div>
          <h1 className='text-2xl md:text-3xl font-semibold'>Товари</h1>
          {q ? (
            <div className='mt-1 text-sm text-gray-600'>Результати пошуку за запитом: <span className='font-semibold text-gray-900'>“{q}”</span></div>
          ) : (
            <div className='mt-1 text-sm text-gray-600'>Показані всі товари</div>
          )}
        </div>

        <div className='flex items-center gap-2 flex-wrap justify-end'>
          <div className='min-w-[220px] relative'>
            <select
              value={category}
              onChange={(e)=>{
                const v = e.target.value
                if (v === '__reset_cat') setCategory('')
                else setCategory(v)
              }}
              disabled={loadingCategories}
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', backgroundImage: 'none' }}
              className='h-10 w-full rounded-lg border bg-white pl-3 pr-14 text-sm hover:bg-gray-50 appearance-none'
              data-testid='products-category-select'
            >
              <option value=''>Всі категорії</option>
              <option value='__reset_cat'>Скинути категорію</option>
              {mainCategories.map((c)=> (
                <option key={c?._id || c?.name} value={c?._id || ''}>
                  {(c?.name || '').toString()}
                </option>
              ))}
            </select>

            <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-700' aria-hidden='true'>
              <svg xmlns='http://www.w3.org/2000/svg' className='h-[18px] w-[18px]' viewBox='0 0 20 20' fill='currentColor'>
                <path fillRule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z' clipRule='evenodd' />
              </svg>
            </span>

            {category && (
              <button
                type='button'
                aria-label='Очистити категорію'
                onClick={()=> setCategory('')}
                className='absolute inset-y-0 right-8 flex items-center text-gray-500 hover:text-black'
                data-testid='products-category-clear'
              >
                ✕
              </button>
            )}
          </div>

          <div className='min-w-[220px] relative'>
            <select
              value={subcategory}
              onChange={(e)=>{
                const v = e.target.value
                if (v === '__reset_sub') setSubcategory('')
                else setSubcategory(v)
              }}
              disabled={loadingCategories || !category}
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', backgroundImage: 'none' }}
              className='h-10 w-full rounded-lg border bg-white pl-3 pr-14 text-sm hover:bg-gray-50 disabled:opacity-50 appearance-none'
              data-testid='products-subcategory-select'
            >
              <option value=''>Всі підкатегорії</option>
              <option value='__reset_sub'>Скинути підкатегорію</option>
              {subcategoryOptions.map((c)=> (
                <option key={c?._id || c?.name} value={c?._id || ''}>
                  {(c?.name || '').toString()}
                </option>
              ))}
            </select>

            <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-700' aria-hidden='true'>
              <svg xmlns='http://www.w3.org/2000/svg' className='h-[18px] w-[18px]' viewBox='0 0 20 20' fill='currentColor'>
                <path fillRule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z' clipRule='evenodd' />
              </svg>
            </span>

            {!!subcategory && (
              <button
                type='button'
                aria-label='Очистити підкатегорію'
                onClick={()=> setSubcategory('')}
                className='absolute inset-y-0 right-8 flex items-center text-gray-500 hover:text-black'
                data-testid='products-subcategory-clear'
              >
                ✕
              </button>
            )}
          </div>

          <button
            type='button'
            className='h-10 px-4 rounded-lg border bg-white hover:bg-gray-50 active:scale-95 transition'
            onClick={goHome}
            data-testid='products-go-home'
          >
            На головну
          </button>

          <button
            type='button'
            disabled={!hasFilters}
            className={
              'h-10 px-4 rounded-lg border bg-white transition ' +
              (hasFilters ? 'hover:bg-gray-50 active:scale-95' : 'opacity-50 cursor-not-allowed')
            }
            onClick={()=>{ if (hasFilters) reset() }}
            data-testid='products-reset-filter'
          >
            Скинути фільтри
          </button>
        </div>
      </div>

      <div className='mt-6'>
        {loading ? (
          <div className='py-10 text-gray-600'>Завантаження…</div>
        ) : items.length === 0 ? (
          <div className='py-10 text-gray-600'>Нічого не знайдено.</div>
        ) : (
          <>
            <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4'>
              {items.map((p)=>(
                <ProductCard key={p._id} p={p} />
              ))}
            </div>

            <div ref={sentinelRef} className='h-10' />

            {loadingMore && (
              <div className='py-6 text-center text-sm text-gray-600'>Завантаження…</div>
            )}
            {!hasMore && items.length > 0 && (
              <div className='py-6 text-center text-sm text-gray-500'>Більше товарів немає.</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
