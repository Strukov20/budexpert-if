import React, { useEffect, useMemo, useState } from 'react'
import { createOrder } from '../api'
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
  const [house, setHouse] = useState('')
  const [touched, setTouched] = useState({})
  const [dtDate, setDtDate] = useState('')
  const [dtTime, setDtTime] = useState('')
  const [method, setMethod] = useState('delivery') // delivery | pickup
  const navigate = useNavigate()

  useEffect(()=>{ const stored = JSON.parse(localStorage.getItem('cart')||'[]'); setCart(stored); },[])

  // Валідатори (як у DeliveryLeadForm)
  const ukNameRegex = useMemo(()=> /^[А-ЩЬЮЯІЇЄҐа-щьюяіїєґ'’\- ]{2,}$/u, [])
  const normalizeUaPhone = (v) => {
    const digits = (v || '').replace(/\D/g, '')
    let local = ''
    if (digits.startsWith('380')) local = digits.slice(3, 12)
    else if (digits.startsWith('0')) local = digits.slice(1, 10)
    else local = digits.slice(-9)
    return '+380' + (local ? local : '')
  }
  const isUaPhoneValid = (v) => /^\+380\d{9}$/.test(v)
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
    if (!isUaPhoneValid(phone)) return 'Телефон у форматі +380XXXXXXXXX'
    return ''
  }, [phone, touched.phone])
  const cityError = useMemo(()=>{
    if (!touched.city) return ''
    if (!city || city.trim().length < 2) return 'Вкажіть місто'
    if (!/^[А-ЩЬЮЯІЇЄҐа-щьюяіїєґ'’\- ]+$/u.test(city.trim())) return 'Лише українські літери'
    return ''
  }, [city, touched.city])
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

  const handleSubmit = async e => {
    e.preventDefault();
    if(cart.length===0) return setStatus('Кошик порожній');
    // Увімкнути торкнуті поля відповідно до методу
    if (method==='delivery') {
      setTouched({ name:true, phone:true, city:true, street:true, house:true, dt:true })
    } else {
      setTouched({ name:true, phone:true })
    }
    const deliveryErrors = !!(nameError || phoneError || cityError || streetError || houseError || dtError)
    const pickupErrors = !!(nameError || phoneError)
    const hasErrors = method==='delivery' ? deliveryErrors : pickupErrors
    if (hasErrors) return

    const address = method==='delivery'
      ? ([city.trim(), street.trim(), house.trim()].filter(Boolean).join(', ') + (dtStr ? `, бажано: ${new Date(dtStr).toLocaleString('uk-UA')}` : ''))
      : 'Самовивіз'
    const payload = {
      customerName: name.trim(),
      phone: phone.replace(/\s+/g,'') ,
      address,
      items: cart.map(c=>({ productId: c._id, quantity: c.quantity })),
      total: cart.reduce((s,i)=>s+i.price*i.quantity,0)
    }
    try{
      setLoading(true)
      await createOrder(payload);
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
    <div className='container py-6 max-w-md mx-auto px-4 md:max-w-none md:px-0'>
      <div className='relative overflow-hidden rounded-2xl border shadow-lg bg-gradient-to-br from-white to-red-50'>
        <div className='absolute -top-16 -right-16 w-56 h-56 rounded-full bg-red-100 blur-2xl opacity-70 pointer-events-none'></div>
        <div className='relative p-5 md:p-6'>
          <h2 className='text-2xl font-semibold mb-3'>Оформлення замовлення</h2>
          <form onSubmit={handleSubmit} className='grid grid-cols-1 md:grid-cols-2 gap-3'>
        <div className='md:col-span-2 flex items-center gap-2 mb-1'>
          <label
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm cursor-pointer select-none transition active:scale-95
              ${method==='delivery' ? 'bg-black text-white border-black shadow-sm' : 'bg-white text-gray-800 hover:bg-gray-50 border-gray-300'}`}
            title='Доставка'
          >
            <input type='radio' name='method' value='delivery' checked={method==='delivery'} onChange={()=> setMethod('delivery')} className='hidden' />
            <span>Доставка</span>
          </label>
          <label
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm cursor-pointer select-none transition active:scale-95
              ${method==='pickup' ? 'bg-black text-white border-black shadow-sm' : 'bg-white text-gray-800 hover:bg-gray-50 border-gray-300'}`}
            title='Самовивіз'
          >
            <input type='radio' name='method' value='pickup' checked={method==='pickup'} onChange={()=> setMethod('pickup')} className='hidden' />
            <span>Самовивіз</span>
          </label>
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
            />
          </div>
          {phoneError && <div className='text-xs text-red-600 mt-1'>{phoneError}</div>}
        </div>
        {method==='delivery' && (
        <div>
          <label className='text-sm text-gray-700 mb-1 block'>Місто</label>
          <div className={`relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3 transition hover:bg-red-50/40 hover:ring-red-200 ${cityError ? 'ring-red-300' : ''}`}>
            <input
              className='h-11 text-base w-full appearance-none bg-transparent border-0 focus:ring-0 focus:outline-none px-0'
              placeholder='Місто'
              value={city}
              onChange={e=> setCity(e.target.value)}
              onBlur={()=> setTouched(t=> ({...t, city:true}))}
              required
            />
          </div>
          {cityError && <div className='text-xs text-red-600 mt-1'>{cityError}</div>}
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
              required
            />
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
                />
                <div className='relative bg-white rounded-xl ring-1 ring-gray-200 shadow px-3 transition hover:bg-red-50/40 hover:ring-red-200 w-full'>
                  <select
                    className={`h-11 pr-8 text-base w-full appearance-none no-select-arrow bg-transparent border-0 focus:ring-0 focus:outline-none ${dtError ? 'text-red-700' : ''}`}
                    value={dtTime}
                    onChange={(e)=> setDtTime(e.target.value)}
                    onBlur={()=> setTouched(t=> ({...t, dt:true}))}
                    aria-invalid={!!dtError}
                    required
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
            <button className='btn md:col-span-2 transition active:scale-95 disabled:opacity-60' disabled={loading}> {loading ? 'Відправляємо...' : 'Підтвердити замовлення'} </button>
          </form>
          {status && <div className='mt-3 text-green-600'>{status}</div>}
        </div>
      </div>

      {showThanks && (
        <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4' role='dialog' aria-modal='true' aria-labelledby='order-success-title' onClick={()=> { setShowThanks(false); navigate('/', { replace:true }) }}>
          <div className='relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center' onClick={(e)=> e.stopPropagation()}>
            <div className='absolute left-0 right-0 top-0'>
              <div className='h-1 bg-red-600' style={{ width: barWidth, transition: 'width 5s linear' }} />
            </div>
            <div className='mx-auto w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mb-3'>
              ✓
            </div>
            <h3 id='order-success-title' className='text-xl font-semibold'>Замовлення прийнято</h3>
            <p className='text-gray-700 mt-2'>Дякуємо! Ми невдовзі зв’яжемося з вами і з радістю доставимо замовлення.</p>
            <button className='mt-4 px-4 py-2 rounded-lg bg-black text-white hover:bg-red-600 transition active:scale-95' onClick={()=> { setShowThanks(false); navigate('/', { replace:true }) }}>Добре</button>
          </div>
        </div>
      )}
    </div>
  )
}

