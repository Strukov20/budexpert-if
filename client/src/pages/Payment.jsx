import React, { useEffect } from 'react'

export default function Payment(){
  useEffect(()=>{
    document.title = 'Оплата — БудЕксперт'
    const metaDesc = document.querySelector('meta[name="description"]') || (()=>{ const m=document.createElement('meta'); m.setAttribute('name','description'); document.head.appendChild(m); return m })()
    metaDesc.setAttribute('content','Умови оплати в БудЕксперт: оплата в магазині або при отриманні замовлення. Безкоштовна доставка від 5000 грн у межах міста.')
  },[])

  return (
    <div className='max-w-5xl mx-auto px-3 md:px-6 py-8'>
      <h1 className='text-3xl font-semibold'>Оплата</h1>

      <div className='mt-6 grid gap-4'>
        <div className='rounded-2xl border bg-white shadow-sm p-5'>
          <div className='text-lg font-semibold'>Як можна оплатити</div>
          <ul className='mt-3 space-y-2 text-sm text-gray-700'>
            <li>Оплата в нашому фізичному магазині.</li>
            <li>Оплата при отриманні товару при доставці.</li>
          </ul>
          <div className='mt-3 text-sm text-gray-700'>
            Онлайн-оплата на сайті наразі недоступна — ми працюємо над цим.
          </div>
        </div>

        <div className='rounded-2xl border bg-white shadow-sm p-5'>
          <div className='text-lg font-semibold'>Доставка</div>
          <div className='mt-3 text-sm text-gray-700'>
            Безкоштовна доставка у межах міста при замовленні від <span className='font-semibold'>5000 грн</span>.
          </div>
        </div>

        <div className='rounded-2xl border bg-white shadow-sm p-5'>
          <div className='text-lg font-semibold'>Потрібна консультація?</div>
          <div className='mt-3 text-sm text-gray-700'>
            Якщо маєте питання щодо оплати або доставки — зателефонуйте нам або залиште заявку на дзвінок у хедері.
          </div>
        </div>
      </div>
    </div>
  )
}
