import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createOrder, getIfStreetSuggestions, getPostCities, getPostOffices } from '../api'
import { useNavigate } from 'react-router-dom'

export default function Checkout(){
  const [cart, setCart] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [showThanks, setShowThanks] = useState(false)
  const [barWidth, setBarWidth] = useState('100%')

  // Поля як у DeliveryLeadForm
  const [name, setName] = useState('')
  const [phoneRaw, setPhoneRaw] = useState('')
  const [city, setCity] = useState('')
  const [street, setStreet] = useState('')
  const [streetSuggestions, setStreetSuggestions] = useState([])
  const [streetLoading, setStreetLoading] = useState(false)
  const [streetOpen, setStreetOpen] = useState(false)
  const skipNextStreetSuggestRef = useRef(false)
  const [house, setHouse] = useState('')
  const [touched, setTouched] = useState({})
  const [dtDate, setDtDate] = useState('')
  const [dtTime, setDtTime] = useState('')
  const [method, setMethod] = useState('delivery') // delivery | pickup | post
  const [npCities, setNpCities] = useState([])
  const [npOffices, setNpOffices] = useState([])
  const [npCityRef, setNpCityRef] = useState('')
  const [npCityName, setNpCityName] = useState('')
  const [npOfficeRef, setNpOfficeRef] = useState('')
  const [npOfficeName, setNpOfficeName] = useState('')
  const [npLoadingCities, setNpLoadingCities] = useState(false)
  const [npLoadingOffices, setNpLoadingOffices] = useState(false)
  const [npTouched, setNpTouched] = useState(false)
  const [npCityQuery, setNpCityQuery] = useState('')
  const [npOfficeQuery, setNpOfficeQuery] = useState('')
  const [npShowCityList, setNpShowCityList] = useState(false)
  const [npShowOfficeList, setNpShowOfficeList] = useState(false)
  const navigate = useNavigate()

  useEffect(()=>{ const stored = JSON.parse(localStorage.getItem('cart')||'[]'); setCart(stored); },[])

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0), [cart])
  const moneyFmt = useMemo(() => new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), [])

  const deliveryCities = useMemo(()=>[
    'Івано-Франківськ',
    'Калуш',
    'Коломия',
    'Надвірна',
    'Долина',
    'Бурштин',
    'Яремче',
    'Косів',
    'Верховина',
    'Богородчани',
    'Тисмениця',
    'Снятин',
    'Городенка',
    'Рогатин'
  ], [])

  // Валідатори (як у DeliveryLeadForm)
  const ukNameRegex = useMemo(()=> /^[А-ЩЬЮЯІЇЄҐа-щьюяіїєґ'’\- ]{2,}$/u, [])
  const uaMobileOperatorCodes = useMemo(() => new Set([
    '39','50','63','66','67','68','73','89','91','92','93','94','95','96','97','98','99'
  ]), [])
  const normalizeUaPhone = (v) => {
    const digits = (v || '').replace(/\D/g, '')
    let local = ''
    if (digits.startsWith('380')) local = digits.slice(3, 12)
    else if (digits.startsWith('0')) local = digits.slice(1, 10)
    else local = digits.slice(-9)
    return '+380' + (local ? local : '')
  }
  const isUaMobilePhoneValid = (v) => {
    if (!/^\+380\d{9}$/.test(v)) return false
    const code = v.slice(4, 6)
    return uaMobileOperatorCodes.has(code)
  }
  const phone = useMemo(()=> normalizeUaPhone(phoneRaw), [phoneRaw])
  const formatUaPhone = (p) => {
    const local = (p || '').replace(/^\+?380/, '')
    const g1 = local.slice(0, 2), g2 = local.slice(2, 5), g3 = local.slice(5, 7), g4 = local.slice(7, 9)
    let out = '+380'; if (g1) out += ' ' + g1; if (g2) out += ' ' + g2; if (g3) out += ' ' + g3; if (g4) out += ' ' + g4; return out
  }
  const formattedPhone = useMemo(()=> formatUaPhone(phone), [phone])

  const nameError = useMemo(()=>{
    if (!touched.name) return ''
    if (!name || name.trim().length < 2) return 'Мінімум 2 символи'
    if (!ukNameRegex.test(name.trim())) return 'Тільки українські літери, пробіли, апостроф'
    return ''
  }, [name, touched.name, ukNameRegex])
  const phoneError = useMemo(()=>{
    if (!touched.phone) return ''
    if (!isUaMobilePhoneValid(phone)) return 'Некоректний телефон (формат +380 та код оператора України)'
    return ''
  }, [phone, touched.phone, isUaMobilePhoneValid])
  const cityError = useMemo(()=>{
    if (!touched.city) return ''
    if (!city || city.trim().length < 2) return 'Вкажіть місто'
    if (!/^[А-ЩЬЮЯІЇЄҐа-щьюяіїєґ'’\- ]+$/u.test(city.trim())) return 'Лише українські літери'
    return ''
  }, [city, touched.city, method, deliveryCities])
  const streetError = useMemo(()=>{
    if (!touched.street) return ''
    if (!street || street.trim().length < 3) return 'Вкажіть вулицю (мін. 3 символи)'
    if (!/^(вул\.|просп\.|пров\.|пл\.|узвіз|майдан)?\s*[А-ЩЬЮЯІЇЄҐа-щьюяіїєґ0-9'’\- .]+$/u.test(street.trim())) return 'Недопустимі символи у вулиці'
    return ''
  }, [street, touched.street])
  const houseError = useMemo(()=>{
    if (!touched.house) return ''
    if (!house || house.trim().length < 1) return 'Будинок/кв. обов’язково'
    if (!/^(?=.*\d)[0-9А-ЩЬЮЯІЇЄҐа-щьюяіїєґ'’\-/ ]+$/u.test(house.trim())) return 'Вкажіть номер будинку/кв.'
    return ''
  }, [house, touched.house])

  const dtStr = useMemo(()=> (dtDate && dtTime) ? `${dtDate}T${dtTime}` : '', [dtDate, dtTime])
  const dtError = useMemo(()=>{
    if (!touched.dt) return ''
    if (!dtStr) return 'Оберіть дату і час'
    const when = new Date(dtStr)
    const now = new Date()
    if (isNaN(when.getTime())) return 'Некоректна дата'
    if (when.getTime() < now.getTime() - 5*60*1000) return 'Дата має бути в майбутньому'
    const mins = when.getMinutes()
    if ((mins % 15) !== 0) return 'Час має бути з кроком 15 хв (00, 15, 30, 45)'
    const hour = when.getHours()
    if (hour < 8 || hour > 20) return 'Доставка з 08:00 до 20:00'
    return ''
  }, [dtStr, touched.dt])

  useEffect(() => {
    if (method !== 'delivery') {
      setStreetSuggestions([])
      setStreetLoading(false)
      return
    }
    const q = (street || '').trim()
    if (skipNextStreetSuggestRef.current) {
      skipNextStreetSuggestRef.current = false
      return
    }
    if (q.length < 4) {
      setStreetSuggestions([])
      setStreetLoading(false)
      return
    }

    setStreetOpen(true)
    setStreetLoading(true)

    const controller = new AbortController()
    const t = setTimeout(async () => {
      try {
        const items = await getIfStreetSuggestions({ q }, { signal: controller.signal })
        setStreetSuggestions(Array.isArray(items) ? items : [])
      } catch {
        setStreetSuggestions([])
      } finally {
        setStreetLoading(false)
      }
    }, 200)

    return () => {
      controller.abort()
      clearTimeout(t)
    }
  }, [street, method])

  const handleSubmit = async e => {
    e.preventDefault();
    if(cart.length===0) return setStatus('Кошик порожній');
    const isDelivery = method === 'delivery'
    const isPickup = method === 'pickup'
    const isPost = method === 'post'

    // Увімкнути торкнуті поля відповідно до методу
    if (isDelivery) {
      setTouched({ name:true, phone:true, city:true, street:true, house:true, dt:true })
    } else {
      setTouched({ name:true, phone:true })
    }
    if (isPost) setNpTouched(true)

    const baseErrors = !!(nameError || phoneError)
    const deliveryErrors = isDelivery && !!(cityError || streetError || houseError || dtError)
    const postErrors = isPost && (!npCityRef || !npOfficeRef)
    const hasErrors = baseErrors || deliveryErrors || postErrors
    if (hasErrors) return

    let address = ''
    if (isDelivery) {
      address = ([city.trim(), street.trim(), house.trim()].filter(Boolean).join(', ') + (dtStr ? `, бажано: ${new Date(dtStr).toLocaleString('uk-UA')}` : ''))
    } else if (isPost) {
      address = `Нова пошта, ${npCityName || ''}, ${npOfficeName || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '')
    } else {
      address = 'Самовивіз'
    }
    const payload = {
      customerName: name.trim(),
      phone: phone.replace(/\s+/g,'') ,
      address,
      items: cart.map(c=>({ productId: c._id, quantity: c.quantity })),
      total: cartTotal
    }
    try{
      setLoading(true)
      await createOrder(payload);

      try {
        const orderId = `local_${Date.now()}`
        const items = (cart || []).map((c, idx) => ({
          item_id: c?._id ? String(c._id) : undefined,
          item_name: c?.name ? String(c.name) : undefined,
          item_variant: c?.sku ? String(c.sku) : undefined,
          index: idx,
          quantity: Number(c?.quantity || 1) || 1,
          price: Number(c?.price || 0) || 0,
        }))
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({ ecommerce: null })
        window.dataLayer.push({
          event: 'purchase',
          ecommerce: {
            transaction_id: orderId,
            currency: 'UAH',
            value: Number(cartTotal || 0) || 0,
            items,
          },
        })
      } catch (e) {
        console.error(e)
      }

      // Очистити кошик, оновити хедер, показати модалку
      localStorage.removeItem('cart');
      setCart([]);
      const ev = new Event('cart-updated');
      window.dispatchEvent(ev);
      setShowThanks(true)
    }catch(err){ console.error(err); setStatus('Помилка'); }
    finally{ setLoading(false) }
  }

  useEffect(()=>{
    if (!showThanks) return;
    const id = setTimeout(()=> { setShowThanks(false); navigate('/', { replace:true }) }, 5000);
    setBarWidth('100%');
    requestAnimationFrame(()=> setBarWidth('0%'));
    return ()=> clearTimeout(id);
  }, [showThanks])

  return (
    <div className='container py-6 max-w-md mx-auto px-4 md:max-w-none md:px-0' data-testid='checkout-page'>
      <div className='relative overflow-hidden rounded-2xl border shadow-lg bg-gradient-to-br from-white to-red-50'>
        <div className='absolute -top-16 -right-16 w-56 h-56 rounded-full bg-red-100 blur-2xl opacity-70 pointer-events-none'></div>
        <div className='relative p-5 md:p-6'>
          <h2 className='text-2xl font-semibold mb-3'>Оформлення замовлення</h2>

          {/* Прогрес-бар кроків: Кошик -> Дані та доставка -> Підтвердження */}
          <div className='mb-4 md:mb-5 flex justify-center'>
            <div className='w-full max-w-xs md:max-w-md'>
              <ol className='flex items-center justify-between text-[11px] md:text-xs text-gray-700'>
                <li className='flex flex-col items-center gap-1 flex-1'>
                  <div className='flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-black text-white text-sm md:text-base font-semibold shrink-0 transition-colors'>1</div>
                  <span className='hidden sm:inline whitespace-nowrap'>Кошик</span>
                </li>
                <li className='flex flex-col items-center gap-1 flex-1'>
                  <div className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full text-sm md:text-base font-semibold shrink-0 transition-colors ${showThanks ? 'bg-black text-white' : 'bg-red-600 text-white'}`}>
                    2
                  </div>
                  <span className='hidden sm:inline whitespace-nowrap'>Дані та доставка</span>
                </li>
                <li className='flex flex-col items-center gap-1 flex-1'>
                  <div className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full text-sm md:text-base font-semibold shrink-0 transition-colors ${showThanks ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}>
                    3
                  </div>
                  <span className='hidden sm:inline whitespace-nowrap'>Підтвердження</span>
                </li>
              </ol>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='grid grid-cols-1 md:grid-cols-2 gap-3' data-testid='checkout-form'>
        <div className='md:col-span-2 mb-2'>
          <div className='flex flex-col sm:flex-row gap-2 sm:gap-0 rounded-2xl sm:rounded-full bg-gray-50/70 sm:bg-gray-100 p-2 sm:p-1 ring-1 ring-gray-200/80 sm:ring-0 shadow-sm sm:shadow-none text-xs md:text-sm font-medium' data-testid='checkout-method'>
            <label
              className={`flex-1 inline-flex items-center justify-center text-center cursor-pointer select-none transition px-3 py-2.5 sm:py-1.5 rounded-xl sm:rounded-full ring-1 sm:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 active:scale-[0.99] sm:active:scale-100
                ${method==='delivery' ? 'bg-black text-white ring-black/20 shadow-md' : 'bg-white text-gray-900 ring-gray-200 shadow-sm'}
                sm:${method==='delivery' ? 'bg-black text-white shadow-sm' : 'bg-transparent text-gray-800 hover:bg-white/60'}`}
              title='Доставка по місту'
              data-testid='checkout-method-delivery'
            >
              <input type='radio' name='method' value='delivery' checked={method==='delivery'} onChange={()=> setMethod('delivery')} className='hidden' />
              <span className='inline-flex items-center justify-center gap-2 w-full'>
                <span className='sm:hidden text-base leading-none' aria-hidden='true'>🚚</span>
                <span className='text-center'>Доставка по місту</span>
              </span>
            </label>
            <label
              className={`flex-1 inline-flex items-center justify-center text-center cursor-pointer select-none transition px-3 py-2.5 sm:py-1.5 rounded-xl sm:rounded-full ring-1 sm:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 active:scale-[0.99] sm:active:scale-100
                ${method==='post' ? 'bg-black text-white ring-black/20 shadow-md' : 'bg-white text-gray-900 ring-gray-200 shadow-sm'}
                sm:${method==='post' ? 'bg-black text-white shadow-sm' : 'bg-transparent text-gray-800 hover:bg-white/60'}`}
              title='Доставка на пошту'
              data-testid='checkout-method-post'
            >
              <input type='radio' name='method' value='post' checked={method==='post'} onChange={()=> setMethod('post')} className='hidden' />
              <span className='inline-flex items-center justify-center gap-2 w-full'>
                <span className='sm:hidden text-base leading-none' aria-hidden='true'>📦</span>
                <span className='text-center'>Доставка на пошту</span>
              </span>
            </label>
            <label
              className={`flex-1 inline-flex items-center justify-center text-center cursor-pointer select-none transition px-3 py-2.5 sm:py-1.5 rounded-xl sm:rounded-full ring-1 sm:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 active:scale-[0.99] sm:active:scale-100
                ${method==='pickup' ? 'bg-black text-white ring-black/20 shadow-md' : 'bg-white text-gray-900 ring-gray-200 shadow-sm'}
                sm:${method==='pickup' ? 'bg-black text-white shadow-sm' : 'bg-transparent text-gray-800 hover:bg-white/60'}`}
              title='Самовивіз'
              data-testid='checkout-method-pickup'
            >
              <input type='radio' name='method' value='pickup' checked={method==='pickup'} onChange={()=> setMethod('pickup')} className='hidden' />
              <span className='inline-flex items-center justify-center gap-2 w-full'>
                <span className='sm:hidden text-base leading-none' aria-hidden='true'>🏬</span>
                <span className='text-center'>Самовивіз</span>
              </span>
            </label>
          </div>
        </div>
        <div>
          <label className='text-sm text-gray-700 mb-1 block'>Ваше ім’я</label>
          <div className={`relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3 transition hover:bg-red-50/40 hover:ring-red-200 ${nameError ? 'ring-red-300' : ''}`}>
            <input
              className='h-11 text-base w-full appearance-none bg-transparent border-0 focus:ring-0 focus:outline-none px-0'
              placeholder='Ваше ім’я'
              value={name}
              onChange={e=> setName(e.target.value)}
              onBlur={()=> setTouched(t=> ({...t, name:true}))}
              required
              autoComplete='name'
              data-testid='checkout-name'
            />
          </div>
          {nameError && <div className='text-xs text-red-600 mt-1'>{nameError}</div>}
        </div>
        <div>
          <label className='text-sm text-gray-700 mb-1 block'>Телефон</label>
          <div className={`relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3 transition hover:bg-red-50/40 hover:ring-red-200 ${phoneError ? 'ring-red-300' : ''}`}>
            <input
              className='h-11 text-base w-full appearance-none bg-transparent border-0 focus:ring-0 focus:outline-none px-0'
              placeholder='Телефон'
              inputMode='tel'
              value={formattedPhone}
              onChange={e=> setPhoneRaw(e.target.value)}
              onBlur={()=> setTouched(t=> ({...t, phone:true}))}
              required
              autoComplete='tel'
              data-testid='checkout-phone'
            />
          </div>
          {phoneError && <div className='text-xs text-red-600 mt-1'>{phoneError}</div>}
        </div>
        {method!=='pickup' && (
        <div>
          <label className='text-sm text-gray-700 mb-1 block'>Місто</label>
          <div className={`relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3 transition hover:bg-red-50/40 hover:ring-red-200 ${method==='delivery' && cityError ? 'ring-red-300' : ''}`}>
            {method === 'post' ? (
              <>
                <div className='relative'>
                  <input
                    className='h-11 text-base w-full appearance-none bg-transparent border-0 focus:outline-none pr-7'
                    placeholder='Пошук міста (мін. 2 символи)'
                    value={npCityQuery}
                    data-testid='checkout-np-city-input'
                    onFocus={async () => {
                    if (!npShowCityList) {
                      if (!npCities.length && npCityQuery.trim().length >= 2) {
                        try {
                          setNpLoadingCities(true)
                          const data = await getPostCities({ q: npCityQuery.trim() })
                          setNpCities(Array.isArray(data) ? data : [])
                        } catch {
                          setNpCities([])
                        } finally {
                          setNpLoadingCities(false)
                        }
                      }
                      setNpShowCityList(true)
                    }
                    }}
                    onChange={async e => {
                      const v = e.target.value
                      setNpCityQuery(v)
                      setNpCityRef('')
                      setNpCityName('')
                      setNpOfficeRef('')
                      setNpOfficeName('')
                      setNpOfficeQuery('')
                      setNpShowCityList(true)
                      if (!v || v.trim().length < 2) {
                        setNpCities([])
                        return
                      }
                      try {
                        setNpLoadingCities(true)
                        const data = await getPostCities({ q: v.trim() })
                        setNpCities(Array.isArray(data) ? data : [])
                      } catch {
                        setNpCities([])
                      } finally {
                        setNpLoadingCities(false)
                      }
                    }}
                  />
                  {npCityQuery && (
                    <button
                      type='button'
                      className='absolute inset-y-0 right-0 px-2 text-gray-400 hover:text-gray-600 text-sm'
                      onClick={() => {
                        setNpCityQuery('')
                        setNpCityRef('')
                        setNpCityName('')
                        setNpOfficeRef('')
                        setNpOfficeName('')
                        setNpOfficeQuery('')
                        setNpCities([])
                        setNpShowCityList(false)
                        setNpShowOfficeList(false)
                      }}
                      data-testid='checkout-np-city-clear'
                    >
                      ×
                    </button>
                  )}
                </div>
                {!npLoadingCities && npShowCityList && npCities.length > 0 && (
                  <div className='max-h-40 overflow-y-auto -mx-1 mt-1' data-testid='checkout-np-city-list'>
                    {npCities.map(c => (
                      <button
                        type='button'
                        key={c.ref}
                        className={`w-full text-left px-1 py-1 text-[13px] rounded cursor-pointer transition hover:bg-red-50 ${npCityRef === c.ref ? 'bg-red-50 font-medium' : ''}`}
                        onClick={() => {
                          const ref = c.ref
                          setNpCityRef(ref)
                          setNpCityName(c.name)
                          setNpCityQuery(c.name)
                          setNpOfficeRef('')
                          setNpOfficeName('')
                          setNpOfficeQuery('')
                          setNpShowCityList(false)
                          setNpShowOfficeList(true)
                          setNpLoadingOffices(true)
                          getPostOffices({ cityRef: ref })
                            .then(data => setNpOffices(Array.isArray(data) ? data : []))
                            .catch(()=> setNpOffices([]))
                            .finally(()=> setNpLoadingOffices(false))
                        }}
                        data-testid={`checkout-np-city-${c.ref}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <input
                className='h-11 text-base w-full appearance-none bg-transparent border-0 focus:ring-0 focus:outline-none px-0'
                placeholder='Місто'
                value={city}
                onChange={e=> setCity(e.target.value)}
                onBlur={()=> setTouched(t=> ({...t, city:true}))}
                required
                list={method === 'delivery' ? 'delivery-cities' : undefined}
                autoComplete='address-level2'
                data-testid='checkout-city'
              />
            )}
          </div>
          {method==='delivery' && cityError && <div className='text-xs text-red-600 mt-1'>{cityError}</div>}
          {method==='post' && npTouched && !npCityRef && <div className='text-xs text-red-600 mt-1'>Оберіть місто Нової пошти</div>}
        </div>
        )}
        {method==='delivery' && (
          <datalist id='delivery-cities'>
            {deliveryCities.map(c=> <option key={c} value={c} />)}
          </datalist>
        )}
        {method==='post' && (
        <div>
          <label className='text-sm text-gray-700 mb-1 block'>Відділення Нової пошти</label>
          <div className='relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3 transition hover:bg-red-50/40 hover:ring-red-200'>
            <div className='relative'>
              <input
                className='h-11 text-base w-full appearance-none bg-transparent border-0 focus:outline-none pr-7'
                placeholder={!npCityRef ? 'Спочатку оберіть місто' : 'Пошук відділення'}
                disabled={!npCityRef || npLoadingOffices}
                value={npOfficeQuery}
                data-testid='checkout-np-office-input'
                onFocus={() => {
                  if (npCityRef && npOffices.length > 0) {
                    setNpShowOfficeList(true)
                  }
                }}
                onChange={e => {
                  setNpOfficeQuery(e.target.value)
                  if (!npShowOfficeList) setNpShowOfficeList(true)
                }}
              />
              {npCityRef && (
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 px-2 text-gray-400 hover:text-gray-600 text-sm'
                  onClick={() => {
                    setNpOfficeQuery('')
                    setNpOfficeRef('')
                    setNpOfficeName('')
                    if (npOffices.length > 0) setNpShowOfficeList(true)
                  }}
                  data-testid='checkout-np-office-clear'
                >
                  ×
                </button>
              )}
              {!npLoadingOffices && npShowOfficeList && npOffices.length > 0 && (
                <div className='max-h-40 overflow-y-auto -mx-1 mt-1' data-testid='checkout-np-office-list'>
                  {npOffices
                    .filter(o => {
                      const q = (npOfficeQuery || '').trim().toLowerCase()
                      if (!q) return true
                      const label = (o.name || o.shortAddress || '').toLowerCase()
                      return label.includes(q)
                    })
                    .map(o => (
                    <button
                      type='button'
                      key={o.ref}
                      className={`w-full text-left px-1 py-1 text-[13px] rounded cursor-pointer transition hover:bg-red-50 ${npOfficeRef === o.ref ? 'bg-red-50 font-medium' : ''}`}
                      onClick={() => {
                        setNpOfficeRef(o.ref)
                        const label = o.name || o.shortAddress || ''
                        setNpOfficeName(label)
                        setNpOfficeQuery(label)
                        setNpShowOfficeList(false)
                      }}
                      data-testid={`checkout-np-office-${o.ref}`}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {npTouched && !npOfficeRef && <div className='text-xs text-red-600 mt-1'>Оберіть відділення</div>}
        </div>
        )}
        {method==='delivery' && (
        <div>
          <label className='text-sm text-gray-700 mb-1 block'>Вулиця</label>
          <div className={`relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3 transition hover:bg-red-50/40 hover:ring-red-200 ${streetError ? 'ring-red-300' : ''}`}>
            <input
              className='h-11 text-base w-full appearance-none bg-transparent border-0 focus:ring-0 focus:outline-none px-0'
              placeholder='Вулиця'
              value={street}
              onChange={e=> setStreet(e.target.value)}
              onBlur={()=> setTouched(t=> ({...t, street:true}))}
              onFocus={()=> setStreetOpen(true)}
              required
              autoComplete='address-line1'
              data-testid='checkout-street'
            />
            {streetOpen && (streetLoading || streetSuggestions.length > 0) && (
              <div className='absolute left-0 right-0 top-full mt-1 bg-white rounded-xl ring-1 ring-gray-200 shadow-lg overflow-hidden z-20'>
                <div className='max-h-48 overflow-y-auto p-1'>
                  {streetLoading && (
                    <div className='px-2 py-2 text-sm text-gray-500'>Пошук...</div>
                  )}
                  {streetSuggestions.map(s => (
                    <button
                      key={s}
                      type='button'
                      className='w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-red-50'
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        skipNextStreetSuggestRef.current = true
                        setStreet(s)
                        setStreetOpen(false)
                        setStreetSuggestions([])
                        setStreetLoading(false)
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {streetError && <div className='text-xs text-red-600 mt-1'>{streetError}</div>}
        </div>
        )}
        {method==='delivery' && (
        <div>
          <label className='text-sm text-gray-700 mb-1 block'>Будинок / кв.</label>
          <div className={`relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3 transition hover:bg-red-50/40 hover:ring-red-200 ${houseError ? 'ring-red-300' : ''}`}>
            <input
              className='h-11 text-base w-full appearance-none bg-transparent border-0 focus:ring-0 focus:outline-none px-0'
              placeholder='Будинок / кв.'
              value={house}
              onChange={e=> setHouse(e.target.value)}
              onBlur={()=> setTouched(t=> ({...t, house:true}))}
              required
              autoComplete='address-line2'
              data-testid='checkout-house'
            />
          </div>
          {houseError && <div className='text-xs text-red-600 mt-1'>{houseError}</div>}
        </div>
        )}
        {method==='delivery' && (()=>{
          const minBase = new Date(Date.now()+30*60*1000)
          const minDateStr = minBase.toISOString().slice(0,10)
          const nextQMs = Math.ceil(minBase.getTime() / (15*60*1000)) * (15*60*1000)
          const nextQ = new Date(nextQMs)
          const minTimeStr = nextQ.toISOString().slice(11,16)
          const timeOptions = (()=>{
            const opts = []
            const start = (dtDate === minDateStr) ? minTimeStr : '00:00'
            const [sh,sm] = start.split(':').map(n=> parseInt(n||'0',10))
            const windowStart = 8*60
            const windowEnd = 20*60
            let minutes = Math.max(sh*60 + sm, windowStart)
            while(minutes <= windowEnd){
              const h = String(Math.floor(minutes/60)).padStart(2,'0')
              const m = String(minutes%60).padStart(2,'0')
              opts.push(`${h}:${m}`)
              minutes += 15
            }
            return opts
          })()
          return (
            <div>
              <label className='text-sm text-gray-700 mb-1 block'>Бажана дата та час доставки</label>
              <div className='flex gap-2'>
                <input
                  type='date'
                  className={`border rounded px-3 h-10 text-sm w-full ${dtError ? 'border-red-500' : ''}`}
                  value={dtDate}
                  onChange={(e)=> setDtDate(e.target.value)}
                  onBlur={()=> setTouched(t=> ({...t, dt:true}))}
                  aria-invalid={!!dtError}
                  min={minDateStr}
                  required
                  data-testid='checkout-delivery-date'
                />
                <div className='relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3 transition hover:bg-red-50/40 hover:ring-red-200 w-full'>
                  <select
                    className={`h-11 pr-8 text-base w-full appearance-none no-select-arrow bg-transparent border-0 focus:ring-0 focus:outline-none ${dtError ? 'text-red-700' : ''}`}
                    value={dtTime}
                    onChange={(e)=> setDtTime(e.target.value)}
                    onBlur={()=> setTouched(t=> ({...t, dt:true}))}
                    aria-invalid={!!dtError}
                    required
                    data-testid='checkout-delivery-time'
                  >
                    <option value='' disabled>Оберіть час</option>
                    {timeOptions.map(t=> <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500'>
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
                      <path fillRule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z' clipRule='evenodd' />
                    </svg>
                  </span>
                </div>
              </div>
              {dtError && <div className='text-xs text-red-600 mt-1'>{dtError}</div>}
            </div>
          )
        })()}
            <button
              type='submit'
              className='btn md:col-span-2 transition active:scale-95 disabled:opacity-60 inline-flex items-center justify-center gap-2'
              disabled={loading}
              aria-busy={loading ? 'true' : 'false'}
              data-testid='checkout-submit'
            >
              {loading && (
                <span className='inline-block w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin'></span>
              )}
              <span>{loading ? 'Відправляємо...' : 'Підтвердити замовлення'}</span>
            </button>
          </form>
          {status && <div className='mt-3 text-green-600' data-testid='checkout-status'>{status}</div>}
        </div>
      </div>

      {showThanks && (
        <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4' role='dialog' aria-modal='true' aria-labelledby='order-success-title' onClick={()=> { setShowThanks(false); navigate('/', { replace:true }) }} data-testid='checkout-success-overlay'>
          <div className='relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center' onClick={(e)=> e.stopPropagation()} data-testid='checkout-success'>
            <div className='absolute left-0 right-0 top-0'>
              <div className='h-1 bg-red-600' style={{ width: barWidth, transition: 'width 5s linear' }} />
            </div>
            <div className='mx-auto w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mb-3'>
              ✓
            </div>
            <h3 id='order-success-title' className='text-xl font-semibold'>Замовлення прийнято</h3>
            <p className='text-gray-700 mt-2'>Дякуємо! Ми невдовзі зв’яжемося з вами і з радістю доставимо замовлення.</p>
            <button className='mt-4 px-4 py-2 rounded-lg bg-black text-white hover:bg-red-600 transition active:scale-95' onClick={()=> { setShowThanks(false); navigate('/', { replace:true }) }} data-testid='checkout-success-close'>Добре</button>
          </div>
        </div>
      )}
    </div>
  )
}

