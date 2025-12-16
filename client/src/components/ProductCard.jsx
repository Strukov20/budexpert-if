import React, { useEffect, useState } from 'react'
import { FiShoppingCart } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

export default function ProductCard({p, onAdd}){
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [qty, setQty] = useState(0)
  const fmt = new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const hasDescription = Boolean((p?.description || '').toString().trim())
  const descriptionPreviewFallback = 'Опис в процесі добавлення...'
  const descriptionModalFallbackLine1 = 'Опис в процесі добавлення, незабаром все буде!'
  const descriptionModalFallbackLine2 = 'Дякуємо за розуміння!'

  const getSpecsEntries = ()=>{
    const s = p?.specs
    if (!s) return []
    try {
      if (s instanceof Map) return Array.from(s.entries())
    } catch {}
    if (typeof s === 'object') {
      return Object.entries(s)
    }
    return []
  }

  useEffect(() => {
    const compute = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('cart')||'[]');
        const found = stored.find(x=> x._id === p._id);
        setQty(found ? (found.quantity||1) : 0);
      } catch { setQty(0); }
    }
    compute();
    const onAddEv = () => compute();
    const onUpdated = () => compute();
    const onStorage = (e) => { if (e.key === 'cart') compute(); };
    window.addEventListener('add-to-cart', onAddEv);
    window.addEventListener('cart-updated', onUpdated);
    window.addEventListener('storage', onStorage);
    return ()=>{
      window.removeEventListener('add-to-cart', onAddEv);
      window.removeEventListener('cart-updated', onUpdated);
      window.removeEventListener('storage', onStorage);
    }
  }, [p._id])

  const inc = () => {
    onAdd(p); // існуюча логіка додавання оновить localStorage та події
  }
  const dec = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('cart')||'[]');
      const idx = stored.findIndex(x=> x._id === p._id);
      if (idx === -1) return;
      const cur = stored[idx];
      const nextQ = (cur.quantity||1) - 1;
      if (nextQ > 0) stored[idx] = { ...cur, quantity: nextQ };
      else stored.splice(idx, 1);
      localStorage.setItem('cart', JSON.stringify(stored));
      const ev = new Event('cart-updated');
      window.dispatchEvent(ev);
    } catch {}
  }
  const resolveSrc = (raw)=>{
    let s = (raw || '').toString().trim();
    if (!s || s === 'null' || s === 'undefined') return '';
    // Автоматично оновлюємо http -> https для API‑хосту, щоб уникнути mixed content
    try {
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
    if (s.startsWith('/uploads/')){
      try{
        const api = import.meta.env.VITE_API_URL || '';
        if (api && (api.startsWith('http://') || api.startsWith('https://'))){
          const origin = new URL(api).origin;
          return origin + s;
        }
        return window.location.origin + s;
      }catch{ return s; }
    }
    if (s.startsWith('/')) return s;
    return '';
  }
  const makePlaceholder = (w,h)=>{
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='16' fill='#9ca3af'>No image</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  const placeholderSm = makePlaceholder(400,240);
  const placeholderLg = makePlaceholder(800,480);
  const cardSrc = resolveSrc(p.image) || placeholderSm;
  const modalSrc = resolveSrc(p.image) || placeholderLg;
  const isOutOfStock = typeof p.stock === 'number' ? p.stock <= 0 : false;
  const inCart = qty > 0;

  const rawDiscount = typeof p.discount === 'number'
    ? p.discount
    : Number(((p.discount ?? '') + '').replace('%', '').trim() || 0) || 0;
  const discount = Math.min(100, Math.max(0, rawDiscount));
  const hasDiscount = discount > 0;
  const finalPrice = hasDiscount ? (p.price * (100 - discount)) / 100 : p.price;

  return (
    <>
      <div className="card group p-3 md:p-4 flex flex-col border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition">
        <div className="relative bg-gray-50 border rounded-lg shadow-sm p-2 cursor-zoom-in" onClick={()=>setOpen(true)}>
          <img
            src={cardSrc}
            onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=placeholderSm; }}
            className="w-full h-32 md:h-40 object-contain rounded-md mix-blend-multiply"
            alt={p.name}
          />
          {(hasDiscount || isOutOfStock) && (
            <div className="absolute top-1 left-1 flex flex-col gap-1">
              {hasDiscount && (
                <div className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] md:text-xs font-semibold shadow">
                  АКЦІЯ -{discount}%
                </div>
              )}
              {isOutOfStock && (
                <div className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] md:text-xs font-semibold shadow">
                  Немає в наявності
                </div>
              )}
            </div>
          )}
        </div>
        <h3 className="mt-2 md:mt-3 font-semibold text-sm md:text-base cursor-pointer" onClick={()=>setOpen(true)}>{p.name}</h3>
        {p.sku && (
          <div className="mt-0.5 text-[11px] md:text-xs text-gray-500">Артикул: {p.sku}</div>
        )}
        <div
          className="text-xs md:text-sm text-gray-600 flex-1 mt-1 cursor-pointer prose prose-[0.85rem] md:prose-sm max-w-none"
          style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          title="Натисни, щоб побачити повний опис"
          onClick={()=>setOpen(true)}
        >
          {hasDescription ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {p.description}
            </ReactMarkdown>
          ) : (
            <span>{descriptionPreviewFallback}</span>
          )}
        </div>
        <div className="mt-1 text-[11px] md:text-xs text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-black group-hover:underline decoration-dotted transition duration-200 select-none">
          Натисни, щоб побачити повний опис
        </div>
        <div className="mt-2 md:mt-3 flex items-center justify-between">
          <div className="flex flex-col items-start">
            {hasDiscount ? (
              <>
                <div className="text-xs md:text-sm text-gray-400 line-through">
                  {fmt.format(p.price)} ₴
                </div>
                <div className="font-bold text-base md:text-xl text-red-600">
                  {fmt.format(finalPrice)} ₴
                </div>
              </>
            ) : (
              <div className="font-bold text-base md:text-xl">{fmt.format(p.price)} ₴</div>
            )}
          </div>
          {/* Мобільні: кнопка "+", яка стає галочкою, якщо товар вже в кошику */}
          <button
            onClick={()=>onAdd(p)}
            className="btn transition active:scale-95 sm:hidden w-9 h-9 flex items-center justify-center p-0 text-xl font-bold"
            aria-label="Додати в кошик"
          >
            {inCart ? '✓' : '+'}
          </button>
          {/* Планшет/десктоп: лічильник, якщо товар вже в кошику; інакше кнопка "+" */}
          <div className="hidden sm:block">
            {qty > 0 ? (
              <div className="flex items-center gap-2">
                <button onClick={dec} className="w-8 h-8 border rounded flex items-center justify-center transition active:scale-95">−</button>
                <span className="w-6 text-center">{qty}</span>
                <button onClick={inc} className="w-8 h-8 border rounded flex items-center justify-center transition active:scale-95">+</button>
              </div>
            ) : (
              <button
                onClick={()=>onAdd(p)}
                className="btn transition active:scale-95 w-9 h-9 flex items-center justify-center p-0 text-xl font-bold"
                aria-label="Додати в кошик"
              >
                {inCart ? '✓' : '+'}
              </button>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setOpen(false)}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden transition" onClick={e=>e.stopPropagation()}>
            <button
              aria-label="Закрити"
              onClick={()=> setOpen(false)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 border flex items-center justify-center shadow transition-colors cursor-pointer hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40 z-20"
            >
              ✕
            </button>
            <div className="flex-1 p-4 md:p-6 pb-0 overflow-auto">
              <div className="relative bg-gray-50 border rounded-xl shadow-sm p-2">
                <img
                  src={modalSrc}
                  onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=placeholderLg; }}
                  className="w-full max-h-[30vh] md:max-h-[34vh] object-contain rounded-md"
                  alt={p.name}
                />
                {(hasDiscount || isOutOfStock) && (
                  <div className="absolute top-2 left-2 flex flex-col gap-2">
                    {hasDiscount && (
                      <div className="px-3 py-1 rounded-full bg-red-600 text-white text-sm md:text-base font-bold shadow">
                        АКЦІЯ -{discount}%
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[11px] md:text-xs font-semibold shadow">
                        Немає в наявності
                      </div>
                    )}
                  </div>
                )}
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-left">{p.name}</h3>
              {p.sku && (
                <div className="text-sm text-gray-500 mb-1">Артикул: {p.sku}</div>
              )}

              <div className="mt-4">
                <div className="inline-flex items-center gap-2 border rounded-xl p-1 bg-gray-50">
                  <button
                    type="button"
                    onClick={()=> setActiveTab('description')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab==='description' ? 'bg-white shadow border border-gray-200' : 'text-gray-600 hover:text-black'}`}
                  >
                    Опис
                  </button>
                  <button
                    type="button"
                    onClick={()=> setActiveTab('specs')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab==='specs' ? 'bg-white shadow border border-gray-200' : 'text-gray-600 hover:text-black'}`}
                  >
                    Характеристики
                  </button>
                </div>

                {activeTab === 'description' ? (
                  <div className="mt-3">
                    {hasDescription ? (
                      <div className="prose prose-sm md:prose-base max-w-none text-left">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                          {p.description}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-700 text-center">
                        <div className="text-gray-700">{descriptionModalFallbackLine1}</div>
                        <div className="text-gray-700">{descriptionModalFallbackLine2}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    {getSpecsEntries().length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <tbody>
                            {getSpecsEntries().map(([k, v]) => (
                              <tr key={String(k)} className="border-t first:border-t-0 odd:bg-gray-50/60">
                                <td className="px-3 py-2 text-gray-600 w-1/2 align-top">{String(k)}</td>
                                <td className="px-3 py-2 text-gray-900 align-top">{String(v ?? '')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-700 text-center">
                        <div className="text-gray-700">Характеристики в процесі добавлення, незабаром все буде!</div>
                        <div className="text-gray-700">Дякуємо за розуміння!</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 md:mt-0 border-t bg-gray-50 px-4 md:px-6 py-3 flex items-center justify-between">
              <div className="flex flex-col items-start">
                {hasDiscount ? (
                  <>
                    <div className="text-sm md:text-base text-gray-400 line-through">
                      {fmt.format(p.price)} ₴
                    </div>
                    <div className="font-bold text-2xl md:text-3xl text-red-600">
                      {fmt.format(finalPrice)} ₴
                    </div>
                  </>
                ) : (
                  <div className="font-bold text-2xl md:text-3xl">{fmt.format(p.price)} ₴</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {qty > 0 ? (
                  <div className="flex items-center gap-2">
                    <button onClick={dec} className="w-8 h-8 border rounded flex items-center justify-center transition active:scale-95">−</button>
                    <span className="w-6 text-center">{qty}</span>
                    <button onClick={inc} className="w-8 h-8 border rounded flex items-center justify-center transition active:scale-95">+</button>
                  </div>
                ) : (
                  <button onClick={()=>{ onAdd(p); }} className="btn transition active:scale-95 text-2xl font-bold">
                    {inCart ? '✓' : '+'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
