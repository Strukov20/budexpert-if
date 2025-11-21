import React, { useEffect, useRef, useState } from 'react'
import { getProducts, getCategories } from '../api'
import ProductCard from '../components/ProductCard'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import DeliveryLeadForm from '../components/DeliveryLeadForm'

export default function Home(){
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cat, setCat] = useState('')
  const [search, setSearch] = useState('')
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
    getCategories().then(d=>setCategories(d)).catch(()=>{})
    loadProducts()
  },[])

  useEffect(()=> {
    setPage(1)
    setVisibleCount(perPage)
  }, [cat, search])

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
    getProducts({ category: cat, q: search }).then(d=>setProducts(d)).catch(()=>{})
  }

  useEffect(()=>{ loadProducts() }, [cat, search])

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

      <div className='grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-2 mb-4'>
        <div className='w-full'>
          <div className='relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3 transition hover:bg-red-50/40 hover:ring-red-200'>
            <select className='h-11 pr-8 text-base w-full appearance-none no-select-arrow bg-transparent border-0 focus:ring-0 focus:outline-none' value={cat} onChange={e=>setCat(e.target.value)}>
              <option value=''>Всі категорії</option>
              {categories.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500'>
              <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
                <path fillRule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z' clipRule='evenodd' />
              </svg>
            </span>
          </div>
        </div>
        <div className='flex items-center justify-start sm:justify-end'>
          <div className='w-full sm:w-56 md:w-64'>
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
        {itemsToRender.map(p=> <ProductCard key={p._id} p={p} onAdd={addToCart} />)}
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
