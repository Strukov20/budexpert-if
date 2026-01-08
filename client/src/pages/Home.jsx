import React, { useEffect, useRef, useState } from 'react'
import { getProducts, getCategories, getProductCounts } from '../api'
import ProductCard from '../components/ProductCard'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import DeliveryLeadForm from '../components/DeliveryLeadForm'

export default function Home(){
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [cat, setCat] = useState('')
  const [subcat, setSubcat] = useState('')
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')
  const [counts, setCounts] = useState({ byCategory: {}, bySubcategory: {}, byType: {} })
  const [page, setPage] = useState(1)
  const perPage = 12
  const [visibleCount, setVisibleCount] = useState(perPage)
  const [isMobile, setIsMobile] = useState(false)
  const slides = [
    { before: 'Будівельний маркет', after: ' — все для ремонту та будівництва', subtitle: 'Швидка доставка, гарантія якості та широкий асортимент.' },
    { before: 'Профінструменти та витратні матеріали від', after: '', subtitle: 'Знижки для постійних клієнтів і майстрів.' },
    { before: 'Офіційна гарантія і підтримка від', after: '', subtitle: 'Тільки перевірені бренди та сервіси.' },
    { before: 'Доставка по всій Україні з', after: '', subtitle: 'Нова пошта, Укрпошта, кур’єр — як зручно вам.' },
  ]
  const [slide, setSlide] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const timerRef = useRef(null)
  const sentinelRef = useRef(null)

  // SEO: title, description, LocalBusiness structured data
  useEffect(()=>{
    document.title = 'БудЕксперт — будівельний маркет в Івано-Франківську'

    const metaDesc = document.querySelector('meta[name="description"]') || (()=>{
      const m = document.createElement('meta');
      m.setAttribute('name','description');
      document.head.appendChild(m);
      return m
    })()
    metaDesc.setAttribute('content','БудЕксперт — будівельний маркет в Івано-Франківську. Все для ремонту та будівництва з доставкою по місту та області.')

    const jsonLd = {
      '@context':'https://schema.org',
      '@type':'LocalBusiness',
      name:'БудЕксперт',
      image:'/logo.png',
      address:{
        '@type':'PostalAddress',
        streetAddress:'вул. Білозіра 8',
        addressLocality:'Івано-Франківськ',
        addressCountry:'UA'
      },
      telephone:'+380980095577',
      url: window.location.origin,
      openingHoursSpecification:[
        { '@type':'OpeningHoursSpecification', dayOfWeek:['Monday','Tuesday','Wednesday','Thursday','Friday'], opens:'09:00', closes:'18:00' },
        { '@type':'OpeningHoursSpecification', dayOfWeek:['Saturday'], opens:'09:00', closes:'15:00' }
      ]
    }

    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.text = JSON.stringify(jsonLd);
    document.head.appendChild(el);

    return () => {
      if (el && el.parentNode) el.parentNode.removeChild(el)
    }
  },[])

  useEffect(()=>{
    setLoadingCategories(true)
    getCategories()
      .then(d=>setCategories(d))
      .catch(()=>{})
      .finally(()=> setLoadingCategories(false))
    loadProducts()
  },[])

  useEffect(()=> {
    setPage(1)
    setVisibleCount(perPage)
  }, [cat, subcat, type, search])

  // Визначення мобільного режиму
  useEffect(()=>{
    const checkMobile = () => {
      if (typeof window === 'undefined') return
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  },[])

  function startTimer(){
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(()=>{
      setIsFading(true)
      setTimeout(()=>{
        setSlide(s => (s + 1) % slides.length)
        setIsFading(false)
      }, 500)
    }, 15000)
  }

  useEffect(()=>{ startTimer(); return ()=> timerRef.current && clearInterval(timerRef.current) },[])

  const goToSlide = (i) => {
    setIsFading(true)
    setTimeout(()=>{
      setSlide(i)
      setIsFading(false)
    }, 300)
    startTimer()
  }

  function loadProducts(){
    // request server with optional params: category, q, page, perPage
    setLoadingProducts(true)
    getProducts({ category: cat, subcategory: subcat, type, q: search })
      .then(d=>setProducts(d))
      .catch(()=>{})
      .finally(()=> setLoadingProducts(false))
  }

  function loadCounts(){
    getProductCounts({ q: search })
      .then(d=> setCounts(d || { byCategory: {}, bySubcategory: {}, byType: {} }))
      .catch(()=> setCounts({ byCategory: {}, bySubcategory: {}, byType: {} }))
  }

  useEffect(()=>{ loadProducts() }, [cat, subcat, type, search])
  useEffect(()=>{ loadCounts() }, [search])

  const getParentId = (c)=>{
    const p = c?.parent
    if (!p) return ''
    if (typeof p === 'string') return p
    if (typeof p === 'object') return p?._id || p?.id || (typeof p?.toString === 'function' ? p.toString() : '')
    return ''
  }

  const mainCategories = categories.filter(c=> !getParentId(c))
  const subcategoriesByParent = (parentId)=> categories.filter(c=> {
    const pid = getParentId(c)
    return pid && String(pid) === String(parentId||'')
  })

  const typesBySubcategory = (subId)=> categories.filter(c=> {
    const pid = getParentId(c)
    return pid && String(pid) === String(subId||'')
  })

  const [menuOpen, setMenuOpen] = useState(false)
  const [hoverCat, setHoverCat] = useState('')
  const [hoverSub, setHoverSub] = useState('')
  const hoverCloseTimerRef = useRef(null)
  const hoverSubCloseTimerRef = useRef(null)

  const hoveredSubs = hoverCat ? subcategoriesByParent(hoverCat) : []
  const showSubsPanel = Boolean(hoverCat) && hoveredSubs.length > 0
  const hoveredTypes = hoverSub ? typesBySubcategory(hoverSub) : []
  const showTypesPanel = Boolean(hoverSub) && hoveredTypes.length > 0
  const menuCatWidth = 320
  const menuSubWidth = 360
  const menuTypeWidth = 360
  const menuWidth = menuCatWidth + (showSubsPanel ? menuSubWidth : 0) + (showTypesPanel ? menuTypeWidth : 0)

  useEffect(()=>{
    if (menuOpen) return
    if (!hoverCat && !hoverSub) return
    setHoverCat('')
    setHoverSub('')
  }, [menuOpen])

  const cancelHoverCloseTimers = ()=>{
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current)
      hoverCloseTimerRef.current = null
    }
    if (hoverSubCloseTimerRef.current) {
      clearTimeout(hoverSubCloseTimerRef.current)
      hoverSubCloseTimerRef.current = null
    }
  }

  const hoverCloseDelayMs = 380

  const scheduleCloseAllHover = ()=>{
    cancelHoverCloseTimers()
    hoverCloseTimerRef.current = setTimeout(()=>{
      setHoverCat('')
      setHoverSub('')
    }, hoverCloseDelayMs)
  }

  const scheduleCloseSubHover = ()=>{
    if (hoverSubCloseTimerRef.current) {
      clearTimeout(hoverSubCloseTimerRef.current)
      hoverSubCloseTimerRef.current = null
    }
    hoverSubCloseTimerRef.current = setTimeout(()=>{
      setHoverSub('')
    }, hoverCloseDelayMs)
  }

  const pickCategory = (id)=>{
    setCat(id)
    setSubcat('')
    setType('')
    setMenuOpen(false)
  }
  const pickSubcategory = (parentId, subId)=>{
    setCat(parentId)
    setSubcat(subId)
    setType('')
    setMenuOpen(false)
  }
  const pickType = (parentId, subId, typeId)=>{
    setCat(parentId)
    setSubcat(subId)
    setType(typeId)
    setMenuOpen(false)
  }

  const catObj = categories.find(x=> String(x._id) === String(cat))
  const subObj = categories.find(x=> String(x._id) === String(subcat))
  const typeObj = categories.find(x=> String(x._id) === String(type))

  const countFor = (id, map) => {
    if (!id) return 0
    return Number(map?.[String(id)] || 0)
  }

  const filtered = products.filter(p=> true) // server returns filtered, but keep for safety
  const pages = Math.max(1, Math.ceil(filtered.length / perPage))

  const canLoadMore = visibleCount < filtered.length
  const paginatedDesktop = filtered.slice((page-1)*perPage, page*perPage)
  const paginatedMobile = filtered.slice(0, visibleCount)
  const itemsToRender = isMobile ? paginatedMobile : paginatedDesktop

  // Lazy loading для мобільних через IntersectionObserver: тригер до футера
  useEffect(()=>{
    if (!isMobile) return
    if (!sentinelRef.current) return

    const el = sentinelRef.current
    const observer = new IntersectionObserver((entries)=>{
      const entry = entries[0]
      if (!entry.isIntersecting) return
      if (!canLoadMore) return
      setVisibleCount(prev => {
        const next = prev + perPage
        return next > filtered.length ? filtered.length : next
      })
    }, {
      root: null,
      rootMargin: '0px 0px 200px 0px',
      threshold: 0.1,
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [isMobile, canLoadMore, filtered.length, perPage])

  const addToCart = (p) => {
    // Persist to localStorage so it appears after navigation to /cart
    const stored = JSON.parse(localStorage.getItem('cart')||'[]');
    const idx = stored.findIndex(x=> x._id === p._id);
    if (idx >= 0) {
      stored[idx] = { ...stored[idx], quantity: (stored[idx].quantity||1) + 1 };
    } else {
      stored.push({ ...p, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(stored));

    // Fire event for live updates when Cart page is mounted
    const ev = new CustomEvent('add-to-cart', { detail: p });
    window.dispatchEvent(ev);
  }

  return (
    <div className='container py-6 max-w-md mx-auto px-4 md:max-w-none md:px-0'>
      <div className='hidden xl:block mb-6'>
        <div className={`relative overflow-hidden rounded-lg bg-neutral-900 text-white p-8 h-[200px] border border-white/5 transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
          {/* Detached logo on the right, nearly full height */}
          <div className='absolute inset-y-4 right-4 flex items-center justify-center pointer-events-none'>
            <img src='/logo.png' alt='BudExpert' className='h-[85%] w-auto max-h-full object-contain opacity-95 ring-1 ring-white/30 rounded-md' />
          </div>

          {/* Text content with padding-right to avoid overlap */}
          <div className='mt-2 pr-[18rem]'>
            <h1 className='text-4xl font-semibold'>
              {slides[slide].before}
              <span className='text-primary'> БудЕксперт</span>
              {slides[slide].after}
            </h1>
            <p className='text-gray-300 mt-3'>{slides[slide].subtitle}</p>
          </div>

          {/* Dots inside carousel */}
          <div className='absolute left-1/2 -translate-x-1/2 bottom-4 flex gap-2'>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={()=> goToSlide(i)}
                className={`h-2 w-2 rounded-full ${i===slide ? 'bg-primary' : 'bg-gray-500'}`}
                aria-label={`Слайд ${i+1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 mb-4'>
        <div className='w-full'>
          <div className='h-11 rounded-xl ring-1 ring-gray-200 shadow bg-white flex items-center transition hover:bg-red-50/30 hover:ring-red-200'>
            <div className='w-full sm:w-[220px] flex-shrink-0 h-full'>
              {isMobile ? (
                <div className='relative h-full px-3'>
                  <select
                    className='h-11 pr-8 text-base w-full appearance-none no-select-arrow bg-transparent border-0 focus:ring-0 focus:outline-none'
                    value={cat || ''}
                    disabled={loadingCategories}
                    onChange={e=>{
                      const v = e.target.value
                      if (!v) { setCat(''); setSubcat(''); setType(''); return }
                      pickCategory(v)
                    }}
                  >
                    <option value=''>Всі категорії</option>
                    {mainCategories.map(c=> (
                      <option key={c._id} value={c._id}>
                        {`${c.name}${countFor(c._id, counts.byCategory) ? ` (${countFor(c._id, counts.byCategory)})` : ''}`}
                      </option>
                    ))}
                  </select>
                  <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500'>
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
                      <path fillRule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z' clipRule='evenodd' />
                    </svg>
                  </span>
                </div>
              ) : (
                <div className='relative h-full'>
                  <button
                    type='button'
                    onClick={()=> setMenuOpen(v=>!v)}
                    disabled={loadingCategories}
                    className='w-full h-11 px-3 bg-transparent flex items-center justify-between hover:bg-white/0 transition'
                  >
                    <span className='text-base text-left truncate'>
                      Всі категорії
                    </span>
                    <span className='text-gray-500'>▾</span>
                  </button>

                  {menuOpen && (
                    <div
                      className='absolute mt-2 left-0 z-30 bg-white border rounded-2xl shadow-2xl overflow-hidden'
                      style={{ width: menuWidth, maxWidth: '94vw' }}
                    >
                      <div
                        className='flex min-h-[320px] max-h-[70vh] overflow-hidden min-w-0 gap-2 p-2 bg-white'
                        onMouseEnter={cancelHoverCloseTimers}
                        onMouseLeave={scheduleCloseAllHover}
                      >
                        <div className='bg-gray-50/60 w-[320px] flex-shrink-0 rounded-xl overflow-hidden'>
                          <div
                            className='max-h-[70vh] overflow-y-auto pr-2'
                            onMouseEnter={cancelHoverCloseTimers}
                          >
                            <button
                              type='button'
                              className={`w-full text-left px-4 py-3 text-base hover:bg-white transition ${(!cat && !subcat && !type) ? 'bg-white font-semibold' : ''}`}
                              onMouseEnter={()=> { setHoverCat(''); setHoverSub('') }}
                              onClick={()=>{ setCat(''); setSubcat(''); setType(''); setMenuOpen(false) }}
                            >
                              Всі категорії
                            </button>
                            {mainCategories.map(c=>{
                              const active = String(cat) === String(c._id) && !subcat && !type
                              const n = countFor(c._id, counts.byCategory)
                              return (
                                <button
                                  key={c._id}
                                  type='button'
                                  className={`w-full text-left px-4 py-3 text-base hover:bg-white transition ${active ? 'bg-white font-semibold' : ''}`}
                                  onMouseEnter={()=> { setHoverCat(c._id); setHoverSub('') }}
                                  onFocus={()=> { setHoverCat(c._id); setHoverSub('') }}
                                  onClick={()=> pickCategory(c._id)}
                                >
                                  <div className='flex items-center justify-between gap-3 min-w-0 pr-1'>
                                    <span className='truncate flex-1 min-w-0'>{c.name}</span>
                                    {n > 0 && (
                                      <span className='ml-3 text-xs font-semibold text-gray-600 bg-gray-100 ring-1 ring-gray-200 rounded-full px-2 py-0.5'>
                                        {n}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {(() => {
                          if (!showSubsPanel) return null
                          const targetCat = hoverCat
                          if (!targetCat) return null
                          const subs = hoveredSubs
                          if (!subs.length) return null
                          return (
                            <div className='bg-white w-[360px] flex-shrink-0 overflow-x-hidden rounded-xl overflow-hidden ring-1 ring-gray-100'>
                              <div
                                className='max-h-[70vh] overflow-y-auto overflow-x-hidden pr-2'
                                onMouseEnter={cancelHoverCloseTimers}
                              >
                                <div className='px-4 py-2 text-xs uppercase tracking-wide text-gray-700 border-b bg-gray-50 sticky top-0 text-center font-semibold'>
                                  Підкатегорії
                                </div>
                                <div className='py-2 px-2'>
                                  {subs.map(sc=> {
                                    const n = countFor(sc._id, counts.bySubcategory)
                                    return (
                                      <button
                                        key={sc._id}
                                        type='button'
                                        className={`group w-full text-left px-4 py-2.5 transition rounded-lg ${String(subcat)===String(sc._id) && !type ? 'bg-red-50 font-semibold ring-1 ring-red-200' : 'hover:bg-gray-50'} `}
                                        onMouseEnter={()=> setHoverSub(sc._id)}
                                        onFocus={()=> setHoverSub(sc._id)}
                                        onClick={()=> pickSubcategory(targetCat, sc._id)}
                                      >
                                        <div className='flex items-center gap-3 min-w-0 pr-1'>
                                          <span className={`h-5 w-1 rounded-full ${String(subcat)===String(sc._id) && !type ? 'bg-red-500' : 'bg-transparent group-hover:bg-gray-300'}`} />
                                          <div className='text-[15px] leading-snug text-gray-900 truncate flex-1'>{sc.name}</div>
                                          {n > 0 && (
                                            <span className='ml-2 text-xs font-semibold text-gray-600 bg-gray-100 ring-1 ring-gray-200 rounded-full px-2 py-0.5 flex-shrink-0'>
                                              {n}
                                            </span>
                                          )}
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )
                        })()}

                        {(() => {
                          if (!showTypesPanel) return null
                          const targetCat = hoverCat
                          if (!targetCat) return null
                          const targetSub = hoverSub
                          if (!targetSub) return null

                          const types = hoveredTypes
                          if (!types.length) return null

                          return (
                            <div className='bg-white w-[360px] flex-shrink-0 overflow-x-hidden rounded-xl overflow-hidden ring-1 ring-gray-100'>
                              <div
                                className='max-h-[70vh] overflow-y-auto overflow-x-hidden pr-2'
                                onMouseEnter={cancelHoverCloseTimers}
                              >
                                <div className='px-4 py-2 text-xs uppercase tracking-wide text-gray-700 border-b bg-gray-50 sticky top-0 text-center font-semibold'>
                                  Типи
                                </div>
                                <div className='py-2 px-2'>
                                  {types.map(t=> {
                                    const n = countFor(t._id, counts.byType)
                                    return (
                                      <button
                                        key={t._id}
                                        type='button'
                                        className={`group w-full text-left px-4 py-2.5 transition rounded-lg ${String(type)===String(t._id) ? 'bg-red-50 font-semibold ring-1 ring-red-200' : 'hover:bg-gray-50'} `}
                                        onClick={()=> pickType(targetCat, targetSub, t._id)}
                                      >
                                        <div className='flex items-center gap-3 min-w-0 pr-1'>
                                          <span className={`h-5 w-1 rounded-full ${String(type)===String(t._id) ? 'bg-red-500' : 'bg-transparent group-hover:bg-gray-300'}`} />
                                          <div className='text-[15px] leading-snug text-gray-900 truncate flex-1'>{t.name}</div>
                                          {n > 0 && (
                                            <span className='ml-2 text-xs font-semibold text-gray-600 bg-gray-100 ring-1 ring-gray-200 rounded-full px-2 py-0.5 flex-shrink-0'>
                                              {n}
                                            </span>
                                          )}
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className='min-w-0 flex-1 h-full hidden sm:block'>
              {(cat || subcat || type) ? (
                <div className='h-full flex items-center justify-center overflow-x-auto px-2'>
                  <div className='flex flex-nowrap items-center text-sm sm:text-base whitespace-nowrap mx-auto'>
                    {cat && (
                      <button
                        type='button'
                        className='px-1.5 py-1 rounded-md text-gray-700 hover:text-gray-900 hover:underline transition font-medium truncate max-w-[260px]'
                        onClick={()=> pickCategory(cat)}
                        title={catObj?.name || 'Категорія'}
                      >
                        {catObj?.name || 'Категорія'}
                      </button>
                    )}

                    {subcat && (
                      <>
                        <span className='px-1 text-gray-300 flex items-center' aria-hidden='true'>
                          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='h-4 w-4'>
                            <path fillRule='evenodd' d='M7.21 14.77a.75.75 0 01.02-1.06L10.94 10 7.23 6.29a.75.75 0 111.06-1.06l4.24 4.24a.75.75 0 010 1.06l-4.24 4.24a.75.75 0 01-1.08-.02z' clipRule='evenodd' />
                          </svg>
                        </span>
                        <button
                          type='button'
                          className='px-1.5 py-1 rounded-md text-gray-700 hover:text-gray-900 hover:underline transition font-medium truncate max-w-[260px]'
                          onClick={()=> pickSubcategory(cat, subcat)}
                          title={subObj?.name || 'Підкатегорія'}
                        >
                          {subObj?.name || 'Підкатегорія'}
                        </button>
                      </>
                    )}

                    {type && (
                      <>
                        <span className='px-1 text-gray-300 flex items-center' aria-hidden='true'>
                          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='h-4 w-4'>
                            <path fillRule='evenodd' d='M7.21 14.77a.75.75 0 01.02-1.06L10.94 10 7.23 6.29a.75.75 0 111.06-1.06l4.24 4.24a.75.75 0 010 1.06l-4.24 4.24a.75.75 0 01-1.08-.02z' clipRule='evenodd' />
                          </svg>
                        </span>
                        <span
                          className='px-1.5 py-1 rounded-md text-primary font-semibold truncate max-w-[280px]'
                          title={typeObj?.name || 'Тип'}
                        >
                          {typeObj?.name || 'Тип'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className='h-full' />
              )}
            </div>
          </div>
        </div>

        <div className='flex items-center justify-start sm:justify-end'>
          <div className='w-full sm:w-56 md:w-64'>
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
        {loadingProducts && itemsToRender.length === 0 ? (
          <div className='col-span-full flex items-center justify-center py-10 text-gray-700'>
            <div className='flex items-center gap-3'>
              <span className='w-6 h-6 rounded-full border-2 border-gray-300 border-t-black animate-spin' />
              <span>Завантаження товарів…</span>
            </div>
          </div>
        ) : (
          itemsToRender.map(p=> <ProductCard key={p._id} p={p} onAdd={addToCart} />)
        )}
      </div>

      {/* Sentinel для lazy loading на мобільних: розташований одразу після товарів, до форми та футера */}
      <div ref={sentinelRef} className='h-4 w-full'></div>

      <div className='mt-6 hidden md:block'>
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>

      <div className='mt-8'>
        <DeliveryLeadForm />
      </div>
    </div>
  )
}
