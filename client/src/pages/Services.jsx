import React, { useEffect, useRef, useState } from 'react'
import { FiPhoneCall, FiCheckCircle, FiPackage, FiTruck } from 'react-icons/fi'
import DeliveryLeadForm from '../components/DeliveryLeadForm'

export default function Services(){
  useEffect(()=>{
    document.title = 'Безкоштовна доставка матеріалів — БудЕксперт'
    const metaDesc = document.querySelector('meta[name="description"]') || (()=>{ const m=document.createElement('meta'); m.setAttribute('name','description'); document.head.appendChild(m); return m })()
    metaDesc.setAttribute('content','Безкоштовна доставка будматеріалів у межах міста від 5000 ₴ за 2–4 години. Якісні матеріали від перевірених брендів. Замовляйте швидко і зручно.')

    const jsonLd = {
      '@context':'https://schema.org',
      '@type':'DeliveryService',
      name:'БудЕксперт — Доставка будматеріалів',
      areaServed:'Івано-Франківськ та приміські райони',
      provider:{ '@type':'LocalBusiness', name:'Буд Експерт' },
      offers:{ '@type':'Offer', price:'0', priceCurrency:'UAH', description:'Безкоштовна доставка в межах міста при замовленні від 5000 ₴' }
    }
    const faqLd = {
      '@context':'https://schema.org', '@type':'FAQPage', mainEntity:[
        { '@type':'Question', name:'Скільки коштує доставка?', acceptedAnswer:{ '@type':'Answer', text:'У межах міста доставка безкоштовна. За місто — за узгодженим тарифом за кілометр.' }},
        { '@type':'Question', name:'За який час довозите?', acceptedAnswer:{ '@type':'Answer', text:'Типово 2–4 години з моменту підтвердження замовлення. Терміново — за домовленістю.' }},
        { '@type':'Question', name:'Які матеріали доставляєте?', acceptedAnswer:{ '@type':'Answer', text:'Усі популярні будматеріали: суміші, утеплювачі, фарби, плитка, інструмент — усе, що є в наявності.' }}
      ]}
    const el = document.createElement('script'); el.type='application/ld+json'; el.text = JSON.stringify(jsonLd)
    const el2 = document.createElement('script'); el2.type='application/ld+json'; el2.text = JSON.stringify(faqLd)
    document.head.appendChild(el); document.head.appendChild(el2)
    return ()=>{ el.remove(); el2.remove(); }
  },[])

  const brands = [
    { name:'Bosch', logo:'/bosch_logo.png', note:'Інструмент' },
    { name:'DeWALT', logo:'/DeWALT_logo.png', note:'Інструмент' },
    { name:'Makita', logo:'/makita_logo.webp', note:'Інструмент' },
    { name:'Stanley', logo:'/stanley_logo.webp', note:'Інструмент' },
    { name:'Knauf', logo:'/knauf_logo.jpg', note:'Сухі суміші, системи' },
    { name:'Sika', logo:'/sika_logo.png', note:'Гідроізоляція, хімія' },
    { name:'Tikkurila', logo:'/tikurila_logo.jpeg', note:'Фарби' },
    { name:'Atlas', logo:'/atlas_logo.webp', note:'Суміші' },
  ]

  const brandsRef = useRef(null)
  const [brandIndex, setBrandIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const slides = [
    { before: 'Будівельний маркет', after: ' — все для ремонту та будівництва', subtitle: 'Швидка доставка, гарантія якості та широкий асортимент.' },
    { before: 'Профінструменти та витратні матеріали від', after: '', subtitle: 'Знижки для постійних клієнтів і майстрів.' },
    { before: 'Офіційна гарантія і підтримка від', after: '', subtitle: 'Тільки перевірені бренди та сервіси.' },
    { before: 'Доставка по всій Україні з', after: '', subtitle: 'Нова пошта, Укрпошта, кур’єр — як зручно вам.' },
  ]
  const [slide, setSlide] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const timerRef = useRef(null)

  const visibleMd = 3
  const logoFallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%239ca3af">logo</text></svg>'

  const scrollToIndex = (i)=>{
    const el = brandsRef.current; if(!el) return;
    const kids = el.children; if(!kids || kids.length===0) return;
    const clamped = Math.max(0, Math.min(i, Math.max(0, kids.length - visibleMd)))
    const target = kids[clamped]; if(!target) return;
    el.scrollTo({ left: target.offsetLeft, behavior: 'smooth' })
  }

  const nextBrand = ()=>{
    const el = brandsRef.current; if(!el) return;
    const kids = el.children; const max = Math.max(0, kids.length - visibleMd)
    const next = brandIndex >= max ? 0 : brandIndex + 1
    setBrandIndex(next)
    scrollToIndex(next)
  }
  const prevBrand = ()=>{
    const el = brandsRef.current; if(!el) return;
    const kids = el.children; const max = Math.max(0, kids.length - visibleMd)
    const prev = brandIndex <= 0 ? max : brandIndex - 1
    setBrandIndex(prev)
    scrollToIndex(prev)
  }

  useEffect(()=>{
    const id = setInterval(()=>{ if(!paused) nextBrand() }, 5000)
    return ()=> clearInterval(id)
  }, [paused, brandIndex])

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

  // Фіксована ширина елемента = (контейнер - gaps)/3, щоб рівно 3 були у фокусі
  useEffect(()=>{
    const resize = ()=>{
      const el = brandsRef.current; if(!el) return;
      const gap = 24; // px між картками
      const w = Math.max(200, Math.floor((el.clientWidth - gap * (visibleMd - 1)) / visibleMd));
      const kids = Array.from(el.children);
      kids.forEach((ch, idx)=>{ ch.style.width = w + 'px'; ch.style.marginRight = (idx === kids.length - 1 ? 0 : gap) + 'px'; })
      // після ресайзу зберегти позицію
      scrollToIndex(brandIndex)
    }
    resize();
    window.addEventListener('resize', resize)
    return ()=> window.removeEventListener('resize', resize)
  }, [brandIndex])

  const testimonials = [
    { name:'Ігор, Івано-Франківськ', photo:'https://i.pravatar.cc/100?img=12', text:'Утеплили будинок за 8 днів, акуратно, ціна = кошторис.' },
    { name:'Марія, Калуш', photo:'https://i.pravatar.cc/100?img=32', text:'Зробили відкоси та декоративну штукатурку — виглядає супер.' },
    { name:'Олег, Коломия', photo:'https://i.pravatar.cc/100?img=55', text:'Чіткі строки, привезли матеріали самі, підписали договір.' },
  ]

  // (партнери/сертифікати приховані на цій версії сторінки)

  return (
    <div className='container py-8 px-4 space-y-10 max-w-md mx-auto md:max-w-none md:px-0'>
      <header className='text-center'>
        <h1 className='text-3xl md:text-4xl font-bold'>Безкоштовна доставка будматеріалів у межах міста від 5000 ₴</h1>
        <p className='text-gray-600 mt-2'>Швидко (2–4 години), зручно та надійно. Якісні матеріали від перевірених брендів.</p>
      </header>

      <div className='hidden xl:block'>
        <div className={`relative overflow-hidden rounded-lg bg-neutral-900 text-white p-8 h-[200px] border border-white/5 transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
          {/* Detached logo on the right, nearly full height */}
          <div className='absolute right-4 top-4 bottom-4 w-[280px] flex items-center justify-center pointer-events-none'>
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

      {/* УТП/переваги доставки */}
      <section id='delivery-usps' className='grid md:grid-cols-3 gap-4'>
        <div className='p-4 rounded-xl border bg-white shadow-sm'>
          <div className='text-xl font-semibold'>Безкоштовно в межах міста</div>
          <p className='text-sm text-gray-600 mt-1'>Доставка 0 ₴ у межах міста. За місто — прозорий тариф за кілометр.</p>
        </div>
        <div className='p-4 rounded-xl border bg-white shadow-sm'>
          <div className='text-xl font-semibold'>Швидко: 2–4 години</div>
          <p className='text-sm text-gray-600 mt-1'>Встигаємо в той самий день. Є опція термінової доставки.</p>
        </div>
        <div className='p-4 rounded-xl border bg-white shadow-sm'>
          <div className='text-xl font-semibold'>Якісні матеріали</div>
          <p className='text-sm text-gray-600 mt-1'>Працюємо лише з перевіреними брендами та сертифікованою продукцією.</p>
        </div>
      </section>

      {/* Бренди (якість матеріалів) */}
      <section id='brands' className='space-y-4'>
        <h2 className='text-2xl font-semibold'>Перевірені бренди</h2>
        {/* Мобайл/планшет: сітка 1 (xs/sm) і 2 (md) в ряд */}
        <div className='lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4'>
          {brands.map(b=> (
            <div key={b.name} className='w-full h-full p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition flex items-center gap-3'>
              <div className='w-14 h-14 flex items-center justify-center rounded-lg bg-white ring-1 ring-gray-200 overflow-hidden'>
                <img src={b.logo} alt={b.name} className='max-w-full max-h-full object-contain'
                     onError={(e)=>{ e.currentTarget.src = logoFallback; }} />
              </div>
              <div className='min-w-0'>
                <div className='font-medium truncate'>{b.name}</div>
                <div className='text-sm text-gray-600 truncate'>{b.note}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Десктоп: карусель як було */}
        <div className='hidden lg:block relative md:px-16'>
          {/* стрілки поза треком */}
          <button aria-label='Left' onClick={prevBrand} className='absolute -left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white shadow ring-1 ring-gray-200 items-center justify-center hover:bg-red-50 hover:text-red-600'>‹</button>
          <div
            ref={brandsRef}
            className='relative flex overflow-hidden'
            onMouseEnter={()=>setPaused(true)}
            onMouseLeave={()=>setPaused(false)}
          >
            {brands.map(b=> (
              <div key={b.name} className='shrink-0'>
                <div className='w-full h-full p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition flex items-center gap-3'>
                  <div className='w-14 h-14 flex items-center justify-center rounded-lg bg-white ring-1 ring-gray-200 overflow-hidden'>
                    <img src={b.logo} alt={b.name} className='max-w-full max-h-full object-contain'
                         onError={(e)=>{ e.currentTarget.src = logoFallback; }} />
                  </div>
                  <div className='min-w-0'>
                    <div className='font-medium truncate'>{b.name}</div>
                    <div className='text-sm text-gray-600 truncate'>{b.note}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button aria-label='Right' onClick={nextBrand} className='absolute -right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white shadow ring-1 ring-gray-200 items-center justify-center hover:bg-red-50 hover:text-red-600'>›</button>
        </div>
      </section>

      {/* Як це працює */}
      <section id='how-it-works' className='space-y-6'>
        <h2 className='text-2xl font-semibold'>Як це працює</h2>
        <div className='relative'>
          {/* Лінія з'єднання для десктопа */}
          <div className='hidden md:block absolute left-0 right-0 top-12 h-0.5 bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200'></div>

          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='relative bg-white border rounded-xl shadow-sm p-5 flex flex-col items-center text-center'>
              <div className='absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-white text-xs flex items-center justify-center font-semibold'>1</div>
              <div className='w-12 h-12 mt-2 rounded-xl bg-red-600 text-white flex items-center justify-center shadow ring-1 ring-red-600/20'>
                <FiPhoneCall className='w-5 h-5' />
              </div>
              <div className='mt-3 font-medium'>Заявка або дзвінок</div>
              <p className='mt-1 text-sm text-gray-600'>Залишаєте контакти чи телефонуєте — уточнюємо номенклатуру.</p>
            </div>

            <div className='relative bg-white border rounded-xl shadow-sm p-5 flex flex-col items-center text-center'>
              <div className='absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-white text-xs flex items-center justify-center font-semibold'>2</div>
              <div className='w-12 h-12 mt-2 rounded-xl bg-red-600 text-white flex items-center justify-center shadow ring-1 ring-red-600/20'>
                <FiCheckCircle className='w-5 h-5' />
              </div>
              <div className='mt-3 font-medium'>Підтвердження</div>
              <p className='mt-1 text-sm text-gray-600'>Перевіряємо наявність і погоджуємо зручний час доставки.</p>
            </div>

            <div className='relative bg-white border rounded-xl shadow-sm p-5 flex flex-col items-center text-center'>
              <div className='absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-white text-xs flex items-center justify-center font-semibold'>3</div>
              <div className='w-12 h-12 mt-2 rounded-xl bg-red-600 text-white flex items-center justify-center shadow ring-1 ring-red-600/20'>
                <FiPackage className='w-5 h-5' />
              </div>
              <div className='mt-3 font-medium'>Комплектація</div>
              <p className='mt-1 text-sm text-gray-600'>Формуємо замовлення, вантажимо матеріали та готуємось до виїзду.</p>
            </div>

            <div className='relative bg-white border rounded-xl shadow-sm p-5 flex flex-col items-center text-center'>
              <div className='absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-white text-xs flex items-center justify-center font-semibold'>4</div>
              <div className='w-12 h-12 mt-2 rounded-xl bg-red-600 text-white flex items-center justify-center shadow ring-1 ring-red-600/20'>
                <FiTruck className='w-5 h-5' />
              </div>
              <div className='mt-3 font-medium'>Доставка 2–4 години</div>
              <p className='mt-1 text-sm text-gray-600'>Привозимо вчасно, допомагаємо з розвантаженням за домовленістю.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Лід-форма (перенесено під "Як це працює") */}
      <section id='lead' className='space-y-3'>
        <DeliveryLeadForm />
      </section>

      {/* Довіра: відгуки */}
      <section id='trust' className='space-y-6'>
        <h2 className='text-2xl font-semibold'>Відгуки</h2>
        <div className='grid md:grid-cols-3 gap-4'>
          {testimonials.map((t, i)=> (
            <div key={i} className='p-4 rounded-xl border bg-white shadow-sm text-center'>
              <img src={t.photo} alt={t.name} className='w-16 h-16 rounded-full mx-auto' />
              <div className='mt-2 font-semibold'>{t.name}</div>
              <div className='text-sm text-gray-700 mt-1'>{t.text}</div>
            </div>
          ))}
        </div>
        
      </section>

      {/* FAQ */}
      <section id='faq' className='space-y-4'>
        <h2 className='text-2xl font-semibold'>FAQ</h2>
        <details className='p-4 rounded-lg border bg-white'>
          <summary className='font-medium cursor-pointer'>Коли замовлення можуть привезти?</summary>
          <p className='text-sm text-gray-700 mt-2'>Зазвичай у проміжку 2–4 години після підтвердження. Узгодимо зручний для вас час.</p>
        </details>
        <details className='p-4 rounded-lg border bg-white'>
          <summary className='font-medium cursor-pointer'>Скільки коштує доставка за місто?</summary>
          <p className='text-sm text-gray-700 mt-2'>Розрахунок за кілометр від межі міста. Повідомимо тариф при оформленні.</p>
        </details>
        <details className='p-4 rounded-lg border bg-white'>
          <summary className='font-medium cursor-pointer'>Чи можна оплатити при отриманні?</summary>
          <p className='text-sm text-gray-700 mt-2'>Так, доступна оплата при отриманні або безготівковий розрахунок.</p>
        </details>
      </section>

      
    </div>
  )
}
