import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CheckoutForm from './Checkout'
import { FiTruck, FiShoppingCart } from 'react-icons/fi'
import DeliveryLeadForm from '../components/DeliveryLeadForm'
import { FiX, FiTrash2 } from 'react-icons/fi'

// Локальні плейсхолдери (без зовнішніх запитів)
const NO_IMG_80 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="10">No%20image</text></svg>'
const NO_IMG_LARGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="24">No%20image</text></svg>'

// Уніфікований резолвер URL для зображень, як у ProductCard
const resolveSrc = (raw) => {
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

export default function CartPage(){
  const navigate = useNavigate()
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart')||'[]')
    } catch {
      return []
    }
  })
  const [selected, setSelected] = useState(null)
  useEffect(()=>{
    const handler = e=> setCart(prev=> {
      const p = e.detail;
      const found = prev.find(x=>x._id===p._id);
      if(found) return prev.map(x=> x._id===p._id ? {...x, quantity: x.quantity+1} : x);
      return [...prev, {...p, quantity:1}];
    });
    window.addEventListener('add-to-cart', handler);
    return ()=> window.removeEventListener('add-to-cart', handler);
  },[]);

  useEffect(()=> {
    localStorage.setItem('cart', JSON.stringify(cart));
    const ev = new Event('cart-updated');
    window.dispatchEvent(ev);
  }, [cart])

  const remove = id => setCart(c=> c.filter(x=> x._id!==id))
  const clear = ()=> setCart([])

  const inc = id => setCart(c=> c.map(x=> x._id===id ? { ...x, quantity: (x.quantity||1)+1 } : x))
  const dec = id => setCart(c=> c.flatMap(x=> {
    if(x._id!==id) return [x];
    const q = (x.quantity||1) - 1;
    return q > 0 ? [{ ...x, quantity: q }] : [];
  }))

  const total = cart.reduce((s,i)=> s + i.price * i.quantity, 0)
  const fmt = new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className='container py-6'>
      <div className='md:hidden mb-3'>
        <button
          type='button'
          onClick={()=> navigate('/')}
          className='inline-flex items-center justify-center w-full h-11 rounded-xl ring-1 ring-gray-200 bg-white text-gray-900 font-semibold uppercase tracking-wide hover:bg-red-50 hover:ring-red-200 hover:text-red-700 transition'
        >
          В каталог
        </button>
      </div>
      <h2 className='text-2xl font-semibold mb-4'>Кошик</h2>
      {cart.length===0 ? <p className='text-gray-600'>Кошик порожній</p> : (
        <div className='grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mx-auto max-w-md md:max-w-none md:mx-0'>
          <div className='space-y-2 md:col-span-1 lg:col-span-2'>
            <div className={`${cart.length>7 ? 'max-h-[60vh] md:max-h-[520px] overflow-y-auto pr-1 space-y-2' : 'space-y-2'}`}>
              {cart.map(i=> (
                <div key={i._id} className='p-3 bg-white rounded shadow flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap sm:items-center justify-between gap-3'>
                  <div className='flex items-center gap-3 min-w-0 flex-1 cursor-pointer pr-1 sm:pr-3 md:pr-4' onClick={()=> setSelected(i)}>
                    <img src={resolveSrc(i.image) || NO_IMG_80} alt={i.name} className='w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 object-cover rounded' />
                    <div className='flex flex-col min-w-0'>
                      <div className='font-medium truncate'>{i.name}</div>
                      {i.sku && (
                        <div className='text-[11px] text-gray-500'>Артикул: {i.sku}</div>
                      )}
                      <div
                        className='text-xs md:text-sm text-gray-600 whitespace-normal break-words pr-1'
                        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        title='Натисни, щоб побачити повний опис'
                      >
                        {i.description || ''}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-3 sm:gap-5 shrink-0 sm:mt-0 w-full sm:w-auto sm:min-w-[260px] justify-between sm:justify-end'>
                    <div className='font-medium whitespace-nowrap text-right text-sm md:text-base'>{(i.price * i.quantity).toFixed(2)} ₴</div>
                    <div className='flex items-center gap-1.5 md:gap-2'>
                      <button onClick={()=>dec(i._id)} className='w-7 h-7 md:w-8 md:h-8 border rounded flex items-center justify-center text-sm transition active:scale-95'>−</button>
                      <span className='w-8 md:w-10 text-center text-sm md:text-base'>{i.quantity}</span>
                      <button onClick={()=>inc(i._id)} className='w-7 h-7 md:w-8 md:h-8 border rounded flex items-center justify-center text-sm transition active:scale-95'>+</button>
                    </div>
                    <button onClick={()=>remove(i._id)} className='text-red-600 transition active:scale-95 text-base md:text-lg' title='Видалити' aria-label='Видалити'>✖</button>
                  </div>
                </div>
              ))}
            </div>
            <div className='mt-2 md:mt-3 p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-md flex flex-row items-center justify-between gap-2 md:gap-3'>
              <div className='text-base md:text-lg font-bold'>Всього: {fmt.format(total)} ₴</div>
              <div className='flex gap-2 w-auto items-center justify-end md:justify-center'>
                {/* Mobile: іконка кошика замість тексту */}
                <a href='/checkout' aria-label='Оформити замовлення' className='btn btn--sm transition active:scale-95 w-10 h-10 flex items-center justify-center md:hidden'>
                  <FiShoppingCart className='w-5 h-5' />
                </a>
                {/* iPad/desktop: текстова кнопка */}
                <a href='/checkout' className='hidden md:inline-flex btn btn--sm transition active:scale-95 justify-center'>Замовити</a>
                <button onClick={clear} className='px-2 py-2 md:px-3 md:py-2 border rounded transition active:scale-95 w-10 h-10 md:w-auto md:h-auto flex items-center justify-center text-sm md:text-base' title='Очистити кошик' aria-label='Очистити кошик'>
                  <FiTrash2 className='w-4 h-4 md:w-5 md:h-5' />
                </button>
              </div>
            </div>
          </div>
          <div className='w-full max-w-md mx-auto md:max-w-none md:mx-0'>
            <DeliveryLeadForm variant='stack' />
          </div>
        </div>
      )}

      {/* Modal опису товару (стиль як у каталозі) */}
      {selected && (()=>{
        const live = cart.find(x=> x._id === selected._id) || selected;
        return (
          <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4' onClick={()=> setSelected(null)}>
            <div className='relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden transition' onClick={e=>e.stopPropagation()}>
              <button
                aria-label='Закрити'
                onClick={()=> setSelected(null)}
                className='absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 border flex items-center justify-center shadow transition-colors cursor-pointer hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40'
              >
                <FiX className='w-5 h-5' />
              </button>
              <div className='p-4 md:p-6'>
                <div className='bg-gray-50 border rounded-xl shadow-sm p-2'>
                  <img src={resolveSrc(live.image) || NO_IMG_LARGE} className='mx-auto w-full md:w-4/5 max-h-[32vh] md:max-h-[38vh] object-contain rounded-md' alt={live.name} />
                </div>
                <h3 className='mt-4 text-2xl font-semibold tracking-tight text-center'>{live.name}</h3>
                {live.sku && (
                  <div className='mt-1 text-sm text-gray-500 text-center'>Артикул: {live.sku}</div>
                )}
                <div className='mt-3 text-gray-700 whitespace-pre-wrap max-h-[28vh] overflow-auto pr-1 text-center'>
                  {live.description || 'Без опису'}
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
