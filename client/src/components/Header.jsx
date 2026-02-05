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

  const navigateWithQImmediate = (next) => {
    const v = (next || '').toString()
    setSearch(v)

    if (qNavTimerRef.current) {
      clearTimeout(qNavTimerRef.current)
      qNavTimerRef.current = null
    }

    let params
    try { params = new URLSearchParams(location.search || '') } catch { params = new URLSearchParams() }

    if (v) params.set('q', v)
    else params.delete('q')

    const qs = params.toString()
    const target = (location.pathname === '/' ? '/' : '/') + (qs ? `?${qs}` : '')
    navigate(target, { replace: location.pathname === '/' })
  }

  const setQueryQ = (value) => {
    const next = (value || '').toString()
    setSearch(next)

    if (qNavTimerRef.current) {
      clearTimeout(qNavTimerRef.current)
      qNavTimerRef.current = null
    }

    qNavTimerRef.current = setTimeout(()=>{
      const currentQ = readQueryQ(location.search)
      if (String(currentQ) === String(next)) return

      let params
      try { params = new URLSearchParams(location.search || '') } catch { params = new URLSearchParams() }

      if (next) params.set('q', next)
      else params.delete('q')

      const qs = params.toString()
      const target = (location.pathname === '/' ? '/' : '/') + (qs ? `?${qs}` : '')
      navigate(target, { replace: location.pathname === '/' })
    }, 700)
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

  return (
    <header className="bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="max-w-7xl mx-auto py-1 px-2 md:py-1.5 md:px-4 relative">
          <div className="bg-white/95 rounded-2xl ring-1 ring-gray-200 shadow-md overflow-hidden">
          <div className="px-3 md:px-4 py-1 text-xs md:text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white">
            <button
              type="button"
              aria-label="Адмін логін"
              className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-white/30 select-none shrink-0 hover:bg-white/10 active:scale-95 transition"
              onClick={() => navigate('/admin/login')}
            >
              🚚
            </button>
            <span className="truncate">Безкоштовна доставка від 5000 грн по Франківську</span>
          </div>

          <div className="hidden md:grid grid-cols-[auto_1fr] grid-rows-2 gap-x-6 gap-y-1.5 px-3 md:px-5 py-2.5 items-center">
            <div className="row-span-2 flex items-center gap-2 md:gap-3 cursor-pointer shrink-0 -ml-2 md:-ml-3 -my-1 md:-my-2" onClick={() => navigate("/") }>
              <img src="/logo.png" alt="БудЕксперт" className="w-24 h-24 md:w-32 md:h-32 object-contain rounded-lg" />
            </div>

            <div className="col-start-2 row-start-1 w-full min-w-0">
              <div className="grid grid-cols-2 gap-4 items-center min-w-0">
                <div className="min-w-0 grid grid-cols-[65%_35%] gap-3 items-center">
                  <div className="min-w-0 flex flex-col gap-2 items-stretch">
                    <div className="w-44 lg:w-48 flex justify-center">
                      <a
                        href={`tel:${SHOP_PHONE}`}
                        onClick={() => {
                          try {
                            window.dataLayer = window.dataLayer || []
                            window.dataLayer.push({ event: 'click_phone', phone_number: SHOP_PHONE, location: 'header_desktop' })
                          } catch {}
                        }}
                        className="inline-flex items-center gap-2 text-sm lg:text-base text-gray-800 hover:text-red-600 transition whitespace-nowrap"
                      >
                        <FiPhoneCall className="w-4 h-4" />
                        <span className="font-semibold">{SHOP_PHONE}</span>
                      </a>
                    </div>

                    <button
                      type="button"
                      className="w-44 lg:w-48 inline-flex items-center justify-center gap-2 text-[10px] lg:text-[11px] px-2.5 py-1 lg:px-4 lg:py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black transition font-semibold whitespace-nowrap"
                      onClick={()=> setCallOpen(true)}
                    >
                      <FiPhoneCall className="w-4 h-4 shrink-0" />
                      <span>Зателефонувати мені</span>
                    </button>
                  </div>

                  <div className="inline-flex items-center justify-end gap-1.5 lg:gap-2">
                    <a
                      href="https://www.instagram.com/budexpert_if/"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                      className="w-7 h-7 lg:w-9 lg:h-9 inline-flex items-center justify-center rounded-lg ring-1 ring-gray-200 text-gray-700 hover:text-red-600 hover:ring-red-200 hover:bg-red-50 transition shrink-0"
                    >
                      <FaInstagram className="w-4 h-4" />
                    </a>
                    <a
                      href="https://www.tiktok.com/@budexpert_"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="TikTok"
                      className="w-7 h-7 lg:w-9 lg:h-9 inline-flex items-center justify-center rounded-lg ring-1 ring-gray-200 text-gray-700 hover:text-red-600 hover:ring-red-200 hover:bg-red-50 transition shrink-0"
                    >
                      <FaTiktok className="w-4 h-4" />
                    </a>
                    <a
                      href="https://t.me/budexpert_if"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Telegram"
                      className="w-7 h-7 lg:w-9 lg:h-9 inline-flex items-center justify-center rounded-lg ring-1 ring-gray-200 text-gray-700 hover:text-red-600 hover:ring-red-200 hover:bg-red-50 transition shrink-0"
                    >
                      <FaTelegramPlane className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 text-[11px] lg:text-[12px] font-semibold uppercase tracking-wide text-gray-900 hover:text-red-600 whitespace-nowrap max-w-full text-center p-1.5 rounded-xl hover:ring-1 hover:ring-red-200 transition"
                  onClick={() => window.open(mapsUrl, '_blank')}
                >
                  <FiMapPin className="w-5 h-5" />
                  <span className="truncate">Івано-Франківськ, вул.Білозіра 8</span>
                </button>
              </div>
            </div>

            <div className="col-start-2 row-start-2 w-full flex items-center gap-4 min-w-0">
              <button
                className="w-44 lg:w-48 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-red-600 text-white border border-red-600 shadow-sm hover:bg-red-700 hover:border-red-700 hover:-translate-y-0.5 transition whitespace-nowrap font-semibold text-sm lg:text-sm"
                onClick={() => navigate("/")}
              >
                <FiGrid className="w-5 h-5" />
                <span>Каталог товарів</span>
              </button>

              <div className="flex-1 min-w-0">
                <SearchBar value={search} onChange={setQueryQ} onSelect={navigateWithQImmediate} />
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center h-11 px-4 lg:px-5 rounded-xl bg-red-600 text-white font-semibold text-[12px] lg:text-sm tracking-wide shadow-md hover:shadow-lg hover:bg-red-700 transition whitespace-nowrap"
                onClick={() => navigate('/services')}
              >
                Блог
              </button>

              <div
                className="relative shrink-0"
                onMouseEnter={()=>{ if (!isCartPage && isLgUp()) setMiniOpen(true) }}
                onMouseLeave={()=>{ if (!isCartPage && isLgUp()) setMiniOpen(false) }}
              >
                <button
                  aria-label="Кошик"
                  className={`relative p-2 rounded-lg transition active:scale-95 ${count > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'hover:bg-red-50 hover:text-red-600'}`}
                  onClick={() => { setMiniOpen(false); navigate("/cart") } }
                >
                  <FiShoppingCart className="w-6 h-6" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center">
                      {count}
                    </span>
                  )}
                </button>
                {miniOpen && !isCartPage && (
                  <div
                    className="hidden md:block md:absolute right-0 md:mt-2 w-96 bg-white rounded-xl shadow-2xl ring-1 ring-gray-200 z-50 overflow-hidden"
                    onClick={(e)=> e.stopPropagation()}
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
          </div>

          <div className="md:hidden px-3 py-3">
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
                >
                  {isServicesPage ? 'Каталог' : 'Блог'}
                </button>

                <button
                  aria-label="Кошик"
                  className={`relative p-2 rounded-lg transition active:scale-95 ${count > 0 ? 'bg-red-50 text-red-600' : 'hover:bg-red-50 hover:text-red-600'}`}
                  onClick={() => { setMiniOpen(false); navigate("/cart") } }
                >
                  <FiShoppingCart className="w-6 h-6" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center">
                      {count}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {callOpen && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4" onClick={()=> setCallOpen(false)}>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e)=> e.stopPropagation()}>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold">Замовити дзвінок</div>
                  <button
                    aria-label="Закрити"
                    onClick={()=> setCallOpen(false)}
                    className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-50 active:scale-95"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-1 text-sm text-gray-600">Залиште контакти — ми передзвонимо.</div>

                <form className="mt-4 flex flex-col gap-3" onSubmit={submitCallLead} noValidate>
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
                      />
                    </div>
                    {callPhoneError && <div className='mt-1 text-xs text-red-600'>{callPhoneError}</div>}
                  </div>

                  <button
                    type="submit"
                    className="btn w-full h-11 rounded-xl font-semibold active:scale-95"
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
      </div>
    </header>
  );
}

