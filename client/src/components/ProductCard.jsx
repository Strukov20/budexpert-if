import React, { useEffect, useState } from 'react'
import { FiShoppingCart } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

export default function ProductCard({p, onAdd}){
  const [open, setOpen] = useState(false)
  const [qty, setQty] = useState(0)
  const fmt = new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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

  return (
    <>
      <div className="card group p-3 md:p-4 flex flex-col border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition">
        <div className="bg-gray-50 border rounded-lg shadow-sm p-2 cursor-zoom-in" onClick={()=>setOpen(true)}>
          <img
            src={cardSrc}
            onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=placeholderSm; }}
            className="w-full h-32 md:h-40 object-contain rounded-md mix-blend-multiply"
            alt={p.name}
          />
        </div>
        <h3 className="mt-2 md:mt-3 font-semibold text-sm md:text-base cursor-pointer" onClick={()=>setOpen(true)}>{p.name}</h3>
        <div
          className="text-xs md:text-sm text-gray-600 flex-1 mt-1 cursor-pointer prose prose-[0.85rem] md:prose-sm max-w-none"
          style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          title="Натисни, щоб побачити повний опис"
          onClick={()=>setOpen(true)}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {p.description || 'Без опису'}
          </ReactMarkdown>
        </div>
        <div className="mt-1 text-[11px] md:text-xs text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-black group-hover:underline decoration-dotted transition duration-200 select-none">
          Натисни, щоб побачити повний опис
        </div>
        <div className="mt-2 md:mt-3 flex items-center justify-between">
          <div className="font-bold text-base md:text-xl">{fmt.format(p.price)} ₴</div>
          {/* Мобільні: завжди кнопка "+" */}
          <button
            onClick={()=>onAdd(p)}
            className="btn transition active:scale-95 sm:hidden w-9 h-9 flex items-center justify-center p-0 text-xl font-bold"
            aria-label="Додати в кошик"
          >
            +
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
                +
              </button>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setOpen(false)}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden transition" onClick={e=>e.stopPropagation()}>
            <button
              aria-label="Закрити"
              onClick={()=> setOpen(false)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 border flex items-center justify-center shadow transition-colors cursor-pointer hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
            >
              ✕
            </button>
            <div className="flex-1 p-4 md:p-6 pb-0 overflow-auto">
              <div className="bg-gray-50 border rounded-xl shadow-sm p-2">
                <img
                  src={modalSrc}
                  onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=placeholderLg; }}
                  className="w-full max-h-[30vh] md:max-h-[34vh] object-contain rounded-md"
                  alt={p.name}
                />
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-left">{p.name}</h3>
              <div className="mt-3 prose prose-sm md:prose-base max-w-none text-left">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {p.description || 'Без опису'}
                </ReactMarkdown>
              </div>
            </div>
            <div className="mt-4 md:mt-0 border-t bg-gray-50 px-4 md:px-6 py-3 flex items-center justify-between">
              <div className="font-bold text-2xl md:text-3xl">{fmt.format(p.price)} ₴</div>
              <div className="flex items-center gap-2">
                {qty > 0 ? (
                  <div className="flex items-center gap-2">
                    <button onClick={dec} className="w-8 h-8 border rounded flex items-center justify-center transition active:scale-95">−</button>
                    <span className="w-6 text-center">{qty}</span>
                    <button onClick={inc} className="w-8 h-8 border rounded flex items-center justify-center transition active:scale-95">+</button>
                  </div>
                ) : (
                  <button onClick={()=>{ onAdd(p); }} className="btn transition active:scale-95 text-2xl font-bold">+</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
