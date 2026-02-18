import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiShoppingCart, FiGrid, FiMapPin, FiPhoneCall } from 'react-icons/fi';
import { FaInstagram, FaTelegramPlane, FaTiktok } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import SearchBar from './SearchBar'
import { createLead } from '../api'

// Локальний плейсхолдер (56x56) для міні‑кошика
const NO_IMG_56 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="9">No%20image</text></svg>'

// Уніфікований резолвер URL для зображень у міні‑кошiku (аналогічно ProductCard/Cart)
const resolveThumbSrc = (raw) => {
  let s = (raw || '').toString().trim();
  if (!s || s === 'null' || s === 'undefined') return '';
  try {
    // Автоматичне оновлення http -> https для API‑хосту, щоб уникнути mixed content
    if (s.startsWith('http://')) {
      const api = import.meta.env.VITE_API_URL || '';
      if (api) {
        const apiOrigin = new URL(api).origin.replace('http://', 'https://');
        const url = new URL(s);
        if (url.host === new URL(apiOrigin).host) {
          url.protocol = 'https:';
          s = url.toString();
        }
      }
    }
  } catch {}

  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/uploads/')) {
    try {
      const api = import.meta.env.VITE_API_URL || '';
      if (api && (api.startsWith('http://') || api.startsWith('https://'))) {
        const origin = new URL(api).origin;
        return origin + s;
      }
      return window.location.origin + s;
    } catch {
      return s;
    }
  }
  if (s.startsWith('/')) return s;
  return '';
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [miniOpen, setMiniOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const mapOpenTimerRef = useRef(null)
  const mapCloseTimerRef = useRef(null)
  const [callOpen, setCallOpen] = useState(false);
  const [callName, setCallName] = useState('');
  const [callPhoneRaw, setCallPhoneRaw] = useState('');
  const [callTouched, setCallTouched] = useState({});
  const [callSuccessOpen, setCallSuccessOpen] = useState(false);
  const [search, setSearch] = useState('');
  const isCartPage = location.pathname === '/cart';
  const isServicesPage = location.pathname === '/services';
  const isLgUp = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
  const fmt = new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const SHOP_PHONE = '+380980095577'
  const SHOP_ADDRESS = 'вул. Білозіра 8'

  const readQueryQ = (s) => {
    try {
      const params = new URLSearchParams(s || '')
      return (params.get('q') || '').toString()
    } catch {
      return ''
    }
  }

  useEffect(()=>{
    const next = readQueryQ(location.search)
    setSearch(prev => (prev === next ? prev : next))
  }, [location.search])

  useEffect(()=>{
    let navType = ''
    try {
      const nav = performance.getEntriesByType?.('navigation')
      navType = (nav && nav[0] && nav[0].type) ? String(nav[0].type) : ''
    } catch {}

    if (navType !== 'reload') return

    const currentQ = readQueryQ(location.search)
    if (!currentQ) return

    let params
    try { params = new URLSearchParams(location.search || '') } catch { params = new URLSearchParams() }
    params.delete('q')
    const qs = params.toString()
    const target = location.pathname + (qs ? `?${qs}` : '')
    setSearch('')
    navigate(target, { replace: true })
  }, [])

  const qNavTimerRef = useRef(null)

  const navigateToSearchResults = (next) => {
    const v = (next || '').toString().trim()
    if (!v) return
    setSearch(v)
    const qs = new URLSearchParams({ q: v }).toString()
    navigate(`/products?${qs}`)
  }

  const setQueryQ = (value) => {
    const next = (value || '').toString()
    setSearch(next)
  }

  useEffect(()=>{
    return ()=>{
      if (qNavTimerRef.current) {
        clearTimeout(qNavTimerRef.current)
        qNavTimerRef.current = null
      }
    }
  }, [])

  const normalizeUaPhone = (v) => {
    const digits = (v || '').replace(/\D/g, '')
    let local = ''
    if (digits.startsWith('380')) local = digits.slice(3, 12)
    else if (digits.startsWith('0')) local = digits.slice(1, 10)
    else local = digits.slice(-9)
    return '+380' + (local ? local : '')
  }
  const isUaPhoneValid = (v) => /^\+380\d{9}$/.test(v)
  const ukNameRegex = useMemo(()=> /^[А-ЩЬЮЯІЇЄҐа-щьюяіїєґ'’\- ]{2,}$/u, [])
  const callPhone = useMemo(()=> normalizeUaPhone(callPhoneRaw), [callPhoneRaw])
  const formatUaPhone = (p) => {
    const local = (p || '').replace(/^\+?380/, '')
    const g1 = local.slice(0, 2)
    const g2 = local.slice(2, 5)
    const g3 = local.slice(5, 7)
    const g4 = local.slice(7, 9)
    let out = '+380'
    if (g1) out += ' ' + g1
    if (g2) out += ' ' + g2
    if (g3) out += ' ' + g3
    if (g4) out += ' ' + g4
    return out
  }
  const callPhoneFormatted = useMemo(()=> formatUaPhone(callPhone), [callPhone])
  const callNameError = useMemo(()=>{
    if (!callTouched.name) return ''
    if (!callName || callName.trim().length < 2) return 'Мінімум 2 символи'
    if (!ukNameRegex.test(callName.trim())) return 'Тільки українські літери, пробіли, апостроф'
    return ''
  }, [callName, callTouched.name, ukNameRegex])
  const callPhoneError = useMemo(()=>{
    if (!callTouched.phone) return ''
    if (!isUaPhoneValid(callPhone)) return 'Телефон у форматі +380XXXXXXXXX'
    return ''
  }, [callPhone, callTouched.phone])
  const callHasErrors = !!(callNameError || callPhoneError)

  const syncFromStorage = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('cart') || '[]');
      const c = stored.reduce((s, i) => s + (i.quantity || 1), 0);
      setCount(c);
      setItems(stored);
    } catch {
      setCount(0);
      setItems([]);
    }
  }

  const incItem = (id) => {
    try {
      const stored = JSON.parse(localStorage.getItem('cart') || '[]');
      const next = stored.map(x => x._id === id ? { ...x, quantity: (x.quantity||1) + 1 } : x);
      localStorage.setItem('cart', JSON.stringify(next));
      const ev = new Event('cart-updated');
      window.dispatchEvent(ev);
      syncFromStorage();
    } catch {}
  }

  const decItem = (id) => {
    try {
      const stored = JSON.parse(localStorage.getItem('cart') || '[]');
      const next = stored.flatMap(x => {
        if (x._id !== id) return [x];
        const q = (x.quantity||1) - 1;
        return q > 0 ? [{ ...x, quantity: q }] : [];
      });
      localStorage.setItem('cart', JSON.stringify(next));
      const ev = new Event('cart-updated');
      window.dispatchEvent(ev);
      syncFromStorage();
    } catch {}
  }

  useEffect(() => {
    syncFromStorage();
    const onAdd = () => syncFromStorage();
    const onUpdated = () => syncFromStorage();
    const onStorage = (e) => { if (e.key === 'cart') syncFromStorage(); };
    window.addEventListener('add-to-cart', onAdd);
    window.addEventListener('cart-updated', onUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('add-to-cart', onAdd);
      window.removeEventListener('cart-updated', onUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Закривати міні-корзину та блокувати її на сторінці кошика
  useEffect(() => {
    if (isCartPage && miniOpen) setMiniOpen(false);
  }, [isCartPage]);
  const mapsUrl = 'https://maps.app.goo.gl/V6mLeSS4EXGmaSe56';
  const mapsEmbedUrl = useMemo(() => {
    const q = `Івано-Франківськ, ${SHOP_ADDRESS}`
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
  }, [SHOP_ADDRESS])

  useEffect(()=>{
    if (!callOpen) return
    setCallSuccessOpen(false)
  }, [callOpen])

  const submitCallLead = async (e) => {
    e.preventDefault()
    setCallTouched({ name: true, phone: true })
    if (callHasErrors) return
    try {
      await createLead({
        type: 'call',
        name: callName.trim(),
        phone: callPhone.replace(/\s+/g, ''),
      })
      setCallSuccessOpen(true)
      setCallName('')
      setCallPhoneRaw('')
      setCallTouched({})
      setCallOpen(false)
    } catch {
      alert('Сталася помилка при відправці. Спробуйте ще раз, будь ласка.')
    }
  }

  const navLinks = useMemo(() => ([
    { label: 'Доставка', to: '/services' },
    { label: 'Оплата', to: '/payment' },
    { label: 'Повернення', to: '/returns' },
    { label: 'Про магазин', to: '/about' },
    { label: 'Контакти', to: '/contacts' },
  ]), [])

  const openMapPreview = () => {
    if (mapCloseTimerRef.current) {
      clearTimeout(mapCloseTimerRef.current)
      mapCloseTimerRef.current = null
    }
    if (mapOpen) return
    if (mapOpenTimerRef.current) return
    mapOpenTimerRef.current = setTimeout(() => {
      mapOpenTimerRef.current = null
      setMapOpen(true)
    }, 150)
  }

  const closeMapPreview = () => {
    if (mapOpenTimerRef.current) {
      clearTimeout(mapOpenTimerRef.current)
      mapOpenTimerRef.current = null
    }
    if (!mapOpen) return
    if (mapCloseTimerRef.current) return
    mapCloseTimerRef.current = setTimeout(() => {
      mapCloseTimerRef.current = null
      setMapOpen(false)
    }, 200)
  }

  useEffect(() => {
    return () => {
      if (mapOpenTimerRef.current) clearTimeout(mapOpenTimerRef.current)
      if (mapCloseTimerRef.current) clearTimeout(mapCloseTimerRef.current)
    }
  }, [])

  return (
    <header className="bg-white border-b" data-testid='header'>
      <div className="bg-red-600 text-white" data-testid='header-top-info'>
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-1.5 flex items-center justify-center relative text-[11px] md:text-xs">
          <span className="text-center truncate">
            Інтернет-магазин знаходиться на стадії наповнення товару. Уточнюйте усю інформацію у наших менеджерів.
          </span>
        </div>
      </div>

      <div className="bg-gray-50 border-t border-gray-100 hidden md:block" data-testid='header-nav-row'>
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-2 flex items-center justify-between gap-6">
          <nav className="flex-1 flex items-center justify-center gap-5 text-[12px] uppercase tracking-wide text-gray-600" data-testid='header-nav'>
            {navLinks.map((l)=>(
              <button
                key={l.label}
                type="button"
                className="hover:text-black transition"
                onClick={()=> navigate(l.to)}
                data-testid={`header-nav-${l.label}`}
              >
                {l.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-3" data-testid='header-main-row'>
        <div className="hidden md:grid grid-cols-[auto_auto_1fr_auto_auto] grid-rows-2 gap-x-4 gap-y-2 items-center">
          <div className="row-span-2 flex items-center cursor-pointer p-0 m-0" onClick={() => navigate("/") } data-testid='header-logo'>
            <img src="/logo.png" alt="БудЕксперт" className="block shrink-0 h-[86px] lg:h-[100px] w-auto object-contain" />
          </div>

          <div className="col-start-2 row-start-1 flex items-center justify-center">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition whitespace-nowrap"
              onClick={() => navigate("/products")}
              data-testid='header-catalog'
            >
              <FiGrid className="w-4 h-4" />
              <span>Каталог товарів</span>
            </button>
          </div>

          <div className="col-start-2 row-start-2 flex items-center justify-center gap-2">
            <a
              href="https://www.instagram.com/budexpert_if/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg ring-1 ring-gray-200 text-gray-700 hover:text-red-600 hover:ring-red-200 hover:bg-red-50 transition shrink-0"
              data-testid='header-social-instagram'
            >
              <FaInstagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.tiktok.com/@budexpert_"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg ring-1 ring-gray-200 text-gray-700 hover:text-red-600 hover:ring-red-200 hover:bg-red-50 transition shrink-0"
              data-testid='header-social-tiktok'
            >
              <FaTiktok className="w-4 h-4" />
            </a>
            <a
              href="https://t.me/budexpert_if"
              target="_blank"
              rel="noreferrer"
              aria-label="Telegram"
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg ring-1 ring-gray-200 text-gray-700 hover:text-red-600 hover:ring-red-200 hover:bg-red-50 transition shrink-0"
              data-testid='header-social-telegram'
            >
              <FaTelegramPlane className="w-4 h-4" />
            </a>
          </div>

          <div className="col-start-3 row-start-1 min-w-0">
            <SearchBar value={search} onChange={setQueryQ} onSelect={navigateToSearchResults} />
          </div>

          <div
            className="col-start-3 row-start-2 relative text-sm lg:text-base text-gray-600 flex justify-center"
            onMouseEnter={openMapPreview}
            onMouseLeave={closeMapPreview}
            data-testid='header-address'
          >
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 hover:text-red-600 transition"
              onClick={() => window.open(mapsUrl, '_blank')}
              data-testid='header-address-link'
            >
              <span className="font-semibold">Наша адреса:</span>
              <span className="underline decoration-dotted">Івано-Франківськ, {SHOP_ADDRESS}</span>
            </button>

            <div
              className={
                "hidden md:block absolute left-0 top-full mt-2 w-[380px] h-[240px] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-200 bg-white z-50 origin-top-left transition duration-200 " +
                (mapOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-[0.98] pointer-events-none')
              }
              onMouseEnter={openMapPreview}
              onMouseLeave={closeMapPreview}
              data-testid='header-address-map'
            >
              <iframe
                title="map"
                src={mapsEmbedUrl}
                className="w-full h-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="col-start-4 row-start-1 flex items-center justify-center">
            <button
              type="button"
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition whitespace-nowrap"
              onClick={()=> setCallOpen(true)}
              data-testid='header-call-me-open'
            >
              Зв’яжіться зі мною
            </button>
          </div>

          <div className="col-start-4 row-start-2 flex items-center justify-center">
            <a
              href={`tel:${SHOP_PHONE}`}
              onClick={() => {
                try {
                  window.dataLayer = window.dataLayer || []
                  window.dataLayer.push({ event: 'click_phone', phone_number: SHOP_PHONE, location: 'header_desktop' })
                } catch {}
              }}
              className="text-base lg:text-lg text-gray-900 hover:text-red-600 transition font-extrabold whitespace-nowrap"
              data-testid='header-phone-link'
            >
              {SHOP_PHONE}
            </a>
          </div>

          <div
            className="row-span-2 relative shrink-0"
            onMouseEnter={()=>{ if (!isCartPage && isLgUp()) setMiniOpen(true) }}
            onMouseLeave={()=>{ if (!isCartPage && isLgUp()) setMiniOpen(false) }}
          >
            <button
              aria-label="Кошик"
              className={`w-[74px] h-[74px] p-0 inline-flex flex-col items-center justify-center rounded-xl transition active:scale-95 ${count > 0 ? 'text-red-600' : 'text-gray-700 hover:text-red-600'}`}
              onClick={() => { setMiniOpen(false); navigate("/cart") } }
              data-testid='header-cart'
            >
              <div className="relative w-8 h-8 flex items-center justify-center">
                <FiShoppingCart className="w-8 h-8" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center" data-testid='header-cart-count'>
                    {count}
                  </span>
                )}
              </div>
              <div className="mt-2.5 text-[11px] leading-none text-gray-700 text-center w-full">{fmt.format(items.reduce((s,i)=>s+i.price*(i.quantity||1),0))} грн</div>
            </button>
            {miniOpen && !isCartPage && (
              <div
                className="hidden md:block md:absolute right-0 md:mt-2 w-96 bg-white rounded-xl shadow-2xl ring-1 ring-gray-200 z-50 overflow-hidden"
                onClick={(e)=> e.stopPropagation()}
                data-testid='header-mini-cart'
              >
                <div className="p-4">
                  <div className="font-semibold mb-3 text-gray-800">Мій кошик</div>
                  {items.length === 0 ? (
                    <div className="text-sm text-gray-600">Кошик порожній</div>
                  ) : (
                    <div className="divide-y max-h-64 overflow-auto">
                      {items.slice(0,5).map(i => (
                        <div key={i._id} className="py-2 flex items-center gap-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <img src={resolveThumbSrc(i.image) || NO_IMG_56} alt={i.name} className="w-12 h-12 object-cover rounded" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium break-words">{i.name}</div>
                              <div className="text-xs text-gray-600">
                                {i.quantity || 1} × {fmt.format(i.price)} ₴/шт
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {items.length > 0 && (
                    <div className="mt-3 flex items-center justify-between text-sm text-gray-700">
                      <span className="text-xs text-gray-500">Всього:</span>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-600 text-white text-base font-semibold tracking-wide shadow">
                        {fmt.format(items.reduce((s,i)=>s+i.price*(i.quantity||1),0))} ₴
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="md:hidden">
          <div className="grid grid-cols-2 gap-3 items-center">
            <div className="flex flex-col items-center justify-center gap-1 min-w-0">
              <a
                href={`tel:${SHOP_PHONE}`}
                  onClick={() => {
                    try {
                      window.dataLayer = window.dataLayer || []
                      window.dataLayer.push({ event: 'click_phone', phone_number: SHOP_PHONE, location: 'header_mobile' })
                    } catch {}
                  }}
                  className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-red-600 transition whitespace-nowrap"
                >
                  <FiPhoneCall className="w-4 h-4" />
                  <span>{SHOP_PHONE}</span>
                </a>
                <button
                  type="button"
                  onClick={() => window.open(mapsUrl, '_blank')}
                  className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-900 hover:text-red-600 transition max-w-full"
                >
                  <FiMapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">ІФ, Білозіра 8</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 min-w-0">
                <button
                  type="button"
                  className={`inline-flex items-center justify-center h-10 px-3 rounded-xl font-semibold text-[11px] tracking-wide shadow-md transition whitespace-nowrap ${isServicesPage ? 'border border-gray-200 bg-white text-gray-900 hover:shadow-lg hover:bg-red-50 hover:border-red-200 hover:text-red-700' : 'bg-red-600 text-white hover:shadow-lg hover:bg-red-700'}`}
                  onClick={() => navigate(isServicesPage ? '/' : '/services')}
                  data-testid='header-mobile-blog-toggle'
                >
                  {isServicesPage ? 'Каталог' : 'Блог'}
                </button>

                <button
                  aria-label="Кошик"
                  className={`relative p-2 rounded-lg transition active:scale-95 ${count > 0 ? 'bg-red-50 text-red-600' : 'hover:bg-red-50 hover:text-red-600'}`}
                  onClick={() => { setMiniOpen(false); navigate("/cart") } }
                  data-testid='header-mobile-cart'
                >
                  <FiShoppingCart className="w-6 h-6" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center" data-testid='header-mobile-cart-count'>
                      {count}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {callOpen && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4" onClick={()=> setCallOpen(false)} data-testid='call-modal-overlay'>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e)=> e.stopPropagation()} data-testid='call-modal'>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold">Замовити дзвінок</div>
                  <button
                    aria-label="Закрити"
                    onClick={()=> setCallOpen(false)}
                    className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-50 active:scale-95"
                    data-testid='call-modal-close'
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-1 text-sm text-gray-600">Залиште контакти — ми передзвонимо.</div>

                <form className="mt-4 flex flex-col gap-3" onSubmit={submitCallLead} noValidate data-testid='call-modal-form'>
                  <div>
                    <label className='text-sm text-gray-700 mb-1 block'>Ваше ім’я</label>
                    <div className={`relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3 transition hover:bg-red-50/40 hover:ring-red-200 ${callNameError ? 'ring-red-300' : ''}`}>
                      <input
                        className='h-11 text-base w-full appearance-none bg-transparent border-0 focus:ring-0 focus:outline-none px-0'
                        placeholder='Ваше ім’я'
                        value={callName}
                        onChange={(e)=> setCallName(e.target.value)}
                        onBlur={()=> setCallTouched(t=> ({...t, name:true}))}
                        aria-invalid={!!callNameError}
                        autoComplete='name'
                        required
                        data-testid='call-modal-name'
                      />
                    </div>
                    {callNameError && <div className='mt-1 text-xs text-red-600'>{callNameError}</div>}
                  </div>

                  <div>
                    <label className='text-sm text-gray-700 mb-1 block'>Телефон</label>
                    <div className={`relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3 transition hover:bg-red-50/40 hover:ring-red-200 ${callPhoneError ? 'ring-red-300' : ''}`}>
                      <input
                        className='h-11 text-base w-full appearance-none bg-transparent border-0 focus:ring-0 focus:outline-none px-0'
                        placeholder='Телефон'
                        inputMode='tel'
                        value={callPhoneFormatted}
                        onChange={(e)=> setCallPhoneRaw(e.target.value)}
                        onBlur={()=> setCallTouched(t=> ({...t, phone:true}))}
                        aria-invalid={!!callPhoneError}
                        autoComplete='tel'
                        required
                        data-testid='call-modal-phone'
                      />
                    </div>
                    {callPhoneError && <div className='mt-1 text-xs text-red-600'>{callPhoneError}</div>}
                  </div>

                  <button
                    type="submit"
                    className="btn w-full h-11 rounded-xl font-semibold active:scale-95"
                    data-testid='call-modal-submit'
                  >
                    Надіслати
                  </button>

                  {callSuccessOpen && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm text-center">
                      Дякуємо! Ми скоро зателефонуємо.
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}

