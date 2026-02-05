import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getProducts, getCategories, getProductCounts } from '../api'
import ProductCard from '../components/ProductCard'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import DeliveryLeadForm from '../components/DeliveryLeadForm'
import HomeBanner from '../components/HomeBanner'

export default function Home(){
  const navigate = useNavigate()
  const location = useLocation()
  const { parentSlug, childSlug } = useParams()
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
  const sentinelRef = useRef(null)
  const productsTopRef = useRef(null)
  const didMountScrollRef = useRef(false)

  const legacyToSlug = useMemo(()=> (name)=> {
    const raw = (name || '').toString().trim()
    const compact = raw
      .replace(/\s+/g, '')
      .replace(/[^0-9A-Za-zА-Яа-яІЇЄҐієїґ\-]/g, '')
    return encodeURIComponent(compact)
  }, [])

  const toSlug = useMemo(()=> (name)=> {
    const raw = (name || '').toString().trim().toLowerCase()
    const map = {
      'а':'a','б':'b','в':'v','г':'h','ґ':'g','д':'d','е':'e','є':'ye','ж':'zh','з':'z','и':'y','і':'i','ї':'yi','й':'y',
      'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch',
      'ш':'sh','щ':'shch','ю':'yu','я':'ya','ь':'',"'":'', '’':'', 'ʼ':'', '`':'',
    }

    const translit = raw
      .split('')
      .map(ch => (Object.prototype.hasOwnProperty.call(map, ch) ? map[ch] : ch))
      .join('')

    const slug = translit
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/^-+|-+$/g, '')

    return encodeURIComponent(slug)
  }, [])

  const slugEq = useMemo(()=> (name, slug)=> {
    if (!slug) return false
    try {
      const dec = decodeURIComponent(slug)
      const normalized = encodeURIComponent(dec).toLowerCase()
      return (
        String(toSlug(name)).toLowerCase() === normalized ||
        String(legacyToSlug(name)).toLowerCase() === normalized
      )
    } catch {
      const normalized = String(slug).toLowerCase()
      return (
        String(toSlug(name)).toLowerCase() === normalized ||
        String(legacyToSlug(name)).toLowerCase() === normalized
      )
    }
  }, [toSlug, legacyToSlug])

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

  useEffect(()=>{
    if (!productsTopRef.current) return
    if (!didMountScrollRef.current) {
      didMountScrollRef.current = true
      return
    }
    requestAnimationFrame(()=>{
      const el = productsTopRef.current
      const top = (el.getBoundingClientRect?.().top || 0) + window.scrollY - 150
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    })
  }, [page])

  function loadProducts(){
    // request server with optional params: category, q, page, perPage
    setLoadingProducts(true)
    getProducts({ category: cat, subcategory: subcat, type, q: search })
      .then(d=>{
        const items = Array.isArray(d?.items) ? d.items : d
        const noFilters = !cat && !subcat && !type && !String(search || '').trim()
        setProducts(noFilters ? shuffle(items) : items)
      })
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

  const mainCategories = useMemo(
    ()=> categories.filter(c=> !getParentId(c)),
    [categories]
  )
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

  const effectiveCat = hoverCat || cat
  const effectiveSub = hoverSub || subcat
  const hoveredSubs = effectiveCat ? subcategoriesByParent(effectiveCat) : []
  const hoveredTypes = effectiveSub ? typesBySubcategory(effectiveSub) : []
  const showSubsPanel = Boolean(effectiveCat)
  const showTypesPanel = Boolean(effectiveSub)
  const colsCount = showTypesPanel ? 3 : (showSubsPanel ? 2 : 1)
  const menuDesiredWidthPx = (colsCount * 360) + ((colsCount - 1) * 12) + 24

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

  const applyingUrlToStateRef = useRef(false)
  const lastUrlKeyRef = useRef('')

  useEffect(()=>{
    if (!categories.length) return

    const urlKey = `${parentSlug || ''}/${childSlug || ''}`
    if (lastUrlKeyRef.current === urlKey) return
    lastUrlKeyRef.current = urlKey

    if (!parentSlug) {
      applyingUrlToStateRef.current = true
      setCat(prev => (prev ? '' : prev))
      setSubcat(prev => (prev ? '' : prev))
      setType(prev => (prev ? '' : prev))
      return
    }

    const parent = mainCategories.find(c=> slugEq(c?.name, parentSlug))
    if (!parent?._id) {
      applyingUrlToStateRef.current = true
      setCat(prev => (prev ? '' : prev))
      setSubcat(prev => (prev ? '' : prev))
      setType(prev => (prev ? '' : prev))
      return
    }

    if (!childSlug) {
      applyingUrlToStateRef.current = true
      setCat(prev => (String(prev) === String(parent._id) ? prev : parent._id))
      setSubcat(prev => (prev ? '' : prev))
      setType(prev => (prev ? '' : prev))
      return
    }

    const subs = subcategoriesByParent(parent._id)
    const child = subs.find(sc=> slugEq(sc?.name, childSlug))
    const nextCat = parent._id
    const nextSub = child?._id || ''
    applyingUrlToStateRef.current = true
    setCat(prev => (String(prev) === String(nextCat) ? prev : nextCat))
    setSubcat(prev => (String(prev) === String(nextSub) ? prev : nextSub))
    setType(prev => (prev ? '' : prev))
  }, [categories, parentSlug, childSlug, mainCategories, slugEq])

  const lastNavKeyRef = useRef('')
  useEffect(()=>{
    if (!categories.length) return

    if (applyingUrlToStateRef.current) {
      applyingUrlToStateRef.current = false
      return
    }

    const catObjLocal = categories.find(x=> String(x._id) === String(cat))
    const subObjLocal = categories.find(x=> String(x._id) === String(subcat))
    const desiredPath = !catObjLocal
      ? '/'
      : (subObjLocal ? `/${toSlug(catObjLocal.name)}/${toSlug(subObjLocal.name)}` : `/${toSlug(catObjLocal.name)}`)

    const desiredKey = desiredPath
    if (lastNavKeyRef.current === desiredKey) return
    if (location.pathname === desiredPath) {
      lastNavKeyRef.current = desiredKey
      return
    }

    lastNavKeyRef.current = desiredKey
    navigate(desiredPath, { replace: true })
  }, [cat, subcat, categories, toSlug, navigate, location.pathname])

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
    <div className='container pt-2 pb-6 max-w-md mx-auto px-4 md:max-w-none md:px-0'>
      <HomeBanner />
      <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 mb-4'>
        <div className='w-full'>
          <div className='flex flex-col sm:flex-row gap-2'>
            <div className='relative z-30 h-11 rounded-xl bg-red-50 text-red-700 border border-red-100 shadow-md ring-2 ring-red-200 flex items-center transition hover:bg-red-100 hover:text-red-800 hover:ring-red-300'>
              <div className='w-full sm:w-[220px] flex-shrink-0 h-full'>
                {isMobile ? (
                  <div className='relative h-full px-3'>
                    <select
                      className='h-11 px-8 text-[17px] w-full appearance-none no-select-arrow bg-transparent border-0 focus:ring-0 focus:outline-none text-red-700 font-semibold text-center'
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
                    <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-red-700'>
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
                      className='relative w-full h-11 px-3 bg-transparent flex items-center justify-center transition font-semibold'
                    >
                      <span className='text-[17px] truncate text-center w-full'>
                        Всі категорії
                      </span>
                      <span className='absolute right-3 text-red-700'>▾</span>
                    </button>

                    {menuOpen && (
                      <div
                        className='absolute mt-2 left-0 z-40 bg-white border rounded-2xl shadow-2xl overflow-hidden p-3 h-[70vh] min-h-[360px]'
                        style={{ width: `min(${menuDesiredWidthPx}px, calc(100vw - 2rem))` }}
                      >
                        <div
                          className={`grid min-h-0 h-full min-w-0 gap-3 bg-white overflow-hidden ${showTypesPanel ? 'grid-cols-3' : (showSubsPanel ? 'grid-cols-2' : 'grid-cols-1')}`}
                          onMouseEnter={cancelHoverCloseTimers}
                          onMouseLeave={scheduleCloseAllHover}
                        >
                          <div className='bg-white w-full min-w-0 rounded-xl border border-gray-200 overflow-hidden flex flex-col'>
                            <div className='px-4 py-2 text-xs uppercase tracking-wide text-gray-700 border-b bg-gray-50 text-center font-semibold flex-shrink-0'>
                              Категорії
                            </div>
                            <div
                              className='min-h-0 flex-1 overflow-y-auto overscroll-contain p-2'
                              style={{ scrollbarGutter: 'stable' }}
                              onMouseEnter={cancelHoverCloseTimers}
                              onWheel={(e)=>{ e.preventDefault(); e.stopPropagation(); e.currentTarget.scrollTop += e.deltaY }}
                            >
                              <button
                                type='button'
                                className={`w-full text-left px-4 py-2.5 text-base rounded-lg border border-transparent transition ${(!cat && !subcat && !type) ? 'bg-red-50 text-red-800 font-semibold border-red-200' : 'hover:bg-red-50 hover:text-red-800 hover:border-red-200'}`}
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
                                    className={`w-full text-left px-4 py-2.5 text-base rounded-lg border border-transparent transition ${active ? 'bg-red-50 text-red-800 font-semibold border-red-200' : 'hover:bg-red-50 hover:text-red-800 hover:border-red-200'}`}
                                    onMouseEnter={()=> { setHoverCat(c._id); setHoverSub('') }}
                                    onFocus={()=> { setHoverCat(c._id); setHoverSub('') }}
                                    onClick={()=> pickCategory(c._id)}
                                  >
                                    <div className='flex items-center justify-between gap-3 min-w-0'>
                                      <span className='truncate flex-1 min-w-0'>{c.name}</span>
                                      {n > 0 && (
                                        <span className='ml-3 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5'>
                                          {n}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {showSubsPanel && (
                            <div className='bg-white w-full min-w-0 overflow-x-hidden rounded-xl border border-gray-200 overflow-hidden flex flex-col'>
                              <div className='px-4 py-2 text-xs uppercase tracking-wide text-gray-700 border-b bg-gray-50 text-center font-semibold flex-shrink-0'>
                                Підкатегорії
                              </div>
                              <div
                                className='min-h-0 flex-1 overflow-y-auto overscroll-contain overflow-x-hidden p-2'
                                style={{ scrollbarGutter: 'stable' }}
                                onMouseEnter={cancelHoverCloseTimers}
                                onWheel={(e)=>{ e.preventDefault(); e.stopPropagation(); e.currentTarget.scrollTop += e.deltaY }}
                              >
                                  {(() => {
                                    const targetCat = effectiveCat
                                    const subs = targetCat ? hoveredSubs : []
                                    if (!subs.length) {
                                      return (
                                        <div className='min-h-full flex items-center justify-center text-sm text-gray-400'>
                                          Немає підкатегорій
                                        </div>
                                      )
                                    }
                                    return subs.map(sc=> {
                                      const n = countFor(sc._id, counts.bySubcategory)
                                      return (
                                        <button
                                          key={sc._id}
                                          type='button'
                                          className={`group w-full text-left px-4 py-2.5 transition rounded-lg border border-transparent ${String(subcat)===String(sc._id) && !type ? 'bg-red-50 text-red-800 font-semibold border-red-200' : 'hover:bg-red-50 hover:text-red-800 hover:border-red-200'} `}
                                          onMouseEnter={()=> setHoverSub(sc._id)}
                                          onFocus={()=> setHoverSub(sc._id)}
                                          onClick={()=> pickSubcategory(targetCat, sc._id)}
                                        >
                                          <div className='flex items-center gap-3 min-w-0'>
                                            <span className={`h-5 w-1 rounded-full ${String(subcat)===String(sc._id) && !type ? 'bg-red-500' : 'bg-transparent group-hover:bg-red-300'}`} />
                                            <div className='text-[15px] leading-snug text-gray-900 truncate flex-1'>{sc.name}</div>
                                            {n > 0 && (
                                              <span className='ml-2 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 flex-shrink-0'>
                                                {n}
                                              </span>
                                            )}
                                          </div>
                                        </button>
                                      )
                                    })
                                  })()}
                              </div>
                            </div>
                          )}

                          {showTypesPanel && (
                            <div className='bg-white w-full min-w-0 overflow-x-hidden rounded-xl border border-gray-200 overflow-hidden flex flex-col'>
                              <div className='px-4 py-2 text-xs uppercase tracking-wide text-gray-700 border-b bg-gray-50 text-center font-semibold flex-shrink-0'>
                                Типи
                              </div>
                              <div
                                className='min-h-0 flex-1 overflow-y-auto overscroll-contain overflow-x-hidden p-2'
                                style={{ scrollbarGutter: 'stable' }}
                                onWheel={(e)=>{ e.preventDefault(); e.stopPropagation(); e.currentTarget.scrollTop += e.deltaY }}
                              >
                                  {(() => {
                                    const targetCat = effectiveCat
                                    const targetSub = effectiveSub
                                    const types = targetSub ? hoveredTypes : []
                                    if (!types.length) {
                                      return (
                                        <div className='min-h-full flex items-center justify-center text-sm text-gray-400'>
                                          Немає типів
                                        </div>
                                      )
                                    }
                                    return types.map(t=> {
                                      const n = countFor(t._id, counts.byType)
                                      return (
                                        <button
                                          key={t._id}
                                          type='button'
                                          className={`group w-full text-left px-4 py-2.5 transition rounded-lg border border-transparent ${String(type)===String(t._id) ? 'bg-red-50 text-red-800 font-semibold border-red-200' : 'hover:bg-red-50 hover:text-red-800 hover:border-red-200'} `}
                                          onClick={()=> pickType(targetCat, targetSub, t._id)}
                                        >
                                          <div className='flex items-center gap-3 min-w-0'>
                                            <span className={`h-5 w-1 rounded-full ${String(type)===String(t._id) ? 'bg-red-500' : 'bg-transparent group-hover:bg-red-300'}`} />
                                            <div className='text-[15px] leading-snug text-gray-900 truncate flex-1'>{t.name}</div>
                                            {n > 0 && (
                                              <span className='ml-2 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 flex-shrink-0'>
                                                {n}
                                              </span>
                                            )}
                                          </div>
                                        </button>
                                      )
                                    })
                                  })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className='hidden sm:flex h-11 rounded-xl ring-1 ring-gray-200 shadow bg-white items-center min-w-0 flex-1 px-2'>
              {(cat || subcat || type) ? (
                <div className='h-full flex items-center justify-center overflow-x-auto w-full'>
                  <div className='flex flex-nowrap items-center text-sm sm:text-base whitespace-nowrap mx-auto'>
                    {cat && (
                      <button
                        type='button'
                        className={`px-1.5 py-1 rounded-md transition font-medium truncate max-w-[260px] ${cat && !subcat && !type ? 'text-primary font-semibold' : 'text-gray-700 hover:text-gray-900 hover:underline'}`}
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
                            <path fillRule='evenodd' d='M7.21 14.77a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z' clipRule='evenodd' />
                          </svg>
                        </span>
                        <button
                          type='button'
                          className={`px-1.5 py-1 rounded-md transition font-medium truncate max-w-[260px] ${subcat && !type ? 'text-primary font-semibold' : 'text-gray-700 hover:text-gray-900 hover:underline'}`}
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
                            <path fillRule='evenodd' d='M7.21 14.77a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z' clipRule='evenodd' />
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
                <div className='h-full w-full' />
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

      <div ref={productsTopRef} />

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
