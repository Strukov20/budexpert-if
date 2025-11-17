import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiShoppingCart, FiGrid, FiMapPin } from 'react-icons/fi';

// Локальний плейсхолдер (56x56) для міні‑кошика
const NO_IMG_56 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="9">No%20image</text></svg>'

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [miniOpen, setMiniOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const isCartPage = location.pathname === '/cart';
  const isLgUp = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
  const fmt = new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    // Закривати мобільне меню при переході
    setMobileOpen(false);
  }, [isCartPage]);
  const mapsUrl = 'https://maps.app.goo.gl/V6mLeSS4EXGmaSe56';

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="w-screen bg-red-600 text-white text-xs md:text-sm">
        <div className="py-1.5 md:py-2 px-2 md:px-4 flex items-center justify-center gap-2 text-center">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-white/30 mr-1 cursor-pointer select-none"
          >
            🚚
          </span>{' '}
          Безкоштовна доставка від 5000 ₴
        </div>
      </div>
      <div className="w-full mx-auto py-2 px-2 md:py-3 md:px-4 relative">
        <div className="flex items-center justify-between bg-white/90 rounded-xl ring-1 ring-gray-200 shadow-md px-4 py-3">
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => navigate("/") }>
          <img src="/logo.png" alt="БудЕксперт" className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-lg" />
          <span className="brand-text text-lg md:text-xl font-bold whitespace-nowrap">
            <span className="text-red-600">БУД</span>{' '}
            <span className="text-black">ЕКСПЕРТ</span>
          </span>
        </div>

        {/* Десктоп/планшет меню */}
        <nav className="hidden lg:flex items-center gap-2 md:gap-4">
          <button
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-100 shadow-sm hover:bg-red-100 hover:text-red-800 hover:-translate-y-0.5 transition"
            onClick={() => navigate("/")}
          >
            <FiGrid className="w-4 h-4" />
            <span>Каталог</span>
          </button>
          <button className="text-sm px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition" onClick={() => navigate("/services")}>
            Послуги
          </button>
          <div
            className="relative"
            onMouseEnter={()=> setMapOpen(true)}
            onMouseLeave={()=> setMapOpen(false)}
          >
            <button
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition"
              onClick={() => window.open(mapsUrl, '_blank')}
            >
              <FiMapPin className="w-4 h-4" />
              <span>Де ми знаходимось?</span>
            </button>
            {mapOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl ring-1 ring-gray-200 z-50 p-4 text-left">
                <div className="text-sm font-semibold mb-1">Наш магазин</div>
                <div className="text-xs text-gray-600 mb-2">
                  <div>Івано-Франківськ</div>
                  <div>вул. Білозіра 8</div>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(mapsUrl, '_blank')}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-black text-white hover:bg-red-600 transition active:scale-95"
                >
                  Відкрити маршрут на карті
                </button>
              </div>
            )}
          </div>
          <div className="relative"
               onMouseEnter={()=>{ if (!isCartPage && isLgUp()) setMiniOpen(true) }}
               onMouseLeave={()=>{ if (!isCartPage && isLgUp()) setMiniOpen(false) }}>
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
               <div className="hidden md:block md:absolute right-0 md:mt-2 w-96 bg-white rounded-xl shadow-2xl ring-1 ring-gray-200 z-50 overflow-hidden"
                   onClick={(e)=> e.stopPropagation()}>
                <div className="p-4">
                  <div className="font-semibold mb-3 text-gray-800">Мій кошик</div>
                  {items.length === 0 ? (
                    <div className="text-sm text-gray-600">Кошик порожній</div>
                  ) : (
                    <div className="divide-y max-h-64 overflow-auto">
                      {items.slice(0,5).map(i => (
                        <div key={i._id} className="py-2 flex items-center gap-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <img src={i.image || NO_IMG_56} alt={i.name} className="w-12 h-12 object-cover rounded" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium break-words">{i.name}</div>
                              <div className="text-xs text-gray-600">{fmt.format(i.price)} ₴/шт</div>
                            </div>
                          </div>
                          <div className="text-sm font-semibold whitespace-nowrap">{fmt.format(i.price * (i.quantity||1))} ₴</div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <button onClick={()=>decItem(i._id)} className="w-6 h-6 border rounded flex items-center justify-center text-sm transition active:scale-95">−</button>
                            <span className="w-5 text-center text-sm">{i.quantity}</span>
                            <button onClick={()=>incItem(i._id)} className="w-6 h-6 border rounded flex items-center justify-center text-sm transition active:scale-95">+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {items.length > 0 && (
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <div className="text-sm text-gray-600">Всього</div>
                      <div className="font-semibold">{fmt.format(items.reduce((s,i)=>s+i.price*(i.quantity||1),0))} ₴</div>
                    </div>
                  )}
                  <div className="mt-3">
                    <button
                      onClick={()=>{ setMiniOpen(false); navigate('/checkout') }}
                      className="btn w-full transition active:scale-95"
                    >
                      Оформити замовлення
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          { /* Адмін посилання прибране з меню */ }
        </nav>

        {/* Мобільні/iPad кнопки: кошик окремо + бургер */}
        <div className="lg:hidden flex items-center gap-1">
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
          <button aria-label="Меню" className="p-2 rounded-lg hover:bg-red-50 active:scale-95" onClick={()=> setMobileOpen(v=>!v)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        </div>
        {/* Overlay для кліку поза меню */}
        {mobileOpen && <div className="fixed inset-0 z-40" onClick={()=> setMobileOpen(false)} />}
        {/* Дропдаун бургер‑меню */}
        <div className={`lg:hidden absolute left-4 right-4 top-full z-50 ${mobileOpen ? 'opacity-100 translate-y-2 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'} transition-all duration-200 ease-out`}>
          <div className="bg-white rounded-xl ring-1 ring-gray-200 shadow-xl overflow-hidden">
            <div className="flex flex-col">
              <button className="px-4 py-3 text-left hover:bg-red-50" onClick={()=>{ setMobileOpen(false); navigate('/') }}>Каталог</button>
              <button className="px-4 py-3 text-left hover:bg-red-50" onClick={()=>{ setMobileOpen(false); navigate('/services') }}>Послуги</button>
              <button className="px-4 py-3 text-left hover:bg-red-50" onClick={()=>{ setMobileOpen(false); window.open(mapsUrl, '_blank') }}>Де ми знаходимось?</button>
              { /* Адмін пункт приховано в мобільному меню */ }
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

