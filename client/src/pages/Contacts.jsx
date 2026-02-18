import React, { useEffect, useMemo, useState } from 'react'
import { FiPhoneCall, FiCheckCircle, FiPackage, FiTruck, FiMapPin, FiClock, FiPhone } from 'react-icons/fi'
import { createLead } from '../api'

const MAPS_URL = 'https://maps.app.goo.gl/V6mLeSS4EXGmaSe56'
const MAPS_EMBED_URL = 'https://www.google.com/maps?q=%D0%86%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D1%96%D0%B2%D1%81%D1%8C%D0%BA,%20%D0%B2%D1%83%D0%BB.%20%D0%91%D1%96%D0%BB%D0%BE%D0%B7%D1%96%D1%80%D0%B0%208&output=embed'

export default function Contacts(){
  useEffect(()=>{
    document.title = 'Контакти — БудЕксперт'
    const metaDesc = document.querySelector('meta[name="description"]') || (()=>{ const m=document.createElement('meta'); m.setAttribute('name','description'); document.head.appendChild(m); return m })()
    metaDesc.setAttribute('content','Контакти БудЕксперт: телефон, адреса, карта, графік роботи та форма для зворотного зв’язку.')
  },[])

  const [callName, setCallName] = useState('')
  const [callPhone, setCallPhoneRaw] = useState('')
  const [callTouched, setCallTouched] = useState({})
  const [callSuccessOpen, setCallSuccessOpen] = useState(false)

  const formatUaPhone = (raw) => {
    const s = (raw || '').toString()
    const digits = s.replace(/\D+/g, '')
    if (!digits) return ''

    let d = digits
    if (d.startsWith('380')) d = d.slice(3)
    if (d.startsWith('0')) d = d.slice(1)
    d = d.slice(0, 9)

    let out = '+380'
    const p1 = d.slice(0, 2)
    const p2 = d.slice(2, 5)
    const p3 = d.slice(5, 7)
    const p4 = d.slice(7, 9)

    if (p1) out += ' ' + p1
    if (p2) out += ' ' + p2
    if (p3) out += '-' + p3
    if (p4) out += '-' + p4

    return out
  }

  const callPhoneFormatted = useMemo(()=> formatUaPhone(callPhone), [callPhone])

  const callNameError = useMemo(()=>{
    if (!callTouched.name) return ''
    const v = callName.trim()
    if (!v) return "Вкажіть ім’я"
    if (v.length < 2) return "Занадто коротке ім’я"
    return ''
  }, [callName, callTouched.name])

  const callPhoneError = useMemo(()=>{
    if (!callTouched.phone) return ''
    const d = (callPhone || '').toString().replace(/\D+/g,'')
    if (!d) return 'Вкажіть телефон'
    if (d.length < 10) return 'Некоректний телефон'
    return ''
  }, [callPhone, callTouched.phone])

  const callHasErrors = !!(callNameError || callPhoneError)

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
      setTimeout(()=> setCallSuccessOpen(false), 3500)
    } catch {
      alert('Сталася помилка при відправці. Спробуйте ще раз, будь ласка.')
    }
  }

  return (
    <div className='max-w-5xl mx-auto px-3 md:px-6 py-8'>
      <h1 className='text-3xl font-semibold'>Контакти</h1>

      <div className='mt-6 grid gap-4'>
        <div className='rounded-2xl border bg-white shadow-sm p-5 text-center'>
          <div className='text-lg font-semibold'>Як з нами зв’язатися</div>
          <div className='mt-3 grid gap-3 md:grid-cols-3'>
            <div className='rounded-xl border bg-white p-4 text-center'>
              <div className='flex items-center justify-center gap-2 text-sm font-medium text-gray-900'>
                <FiPhone className='w-4 h-4 text-gray-500' />
                <span>Телефон</span>
              </div>
              <a
                className='mt-2 inline-flex items-center justify-center underline decoration-dotted hover:text-black text-sm'
                href='tel:+380980095577'
                onClick={() => {
                  try {
                    window.dataLayer = window.dataLayer || []
                    window.dataLayer.push({ event: 'click_phone', phone_number: '+380980095577', location: 'contacts' })
                  } catch {}
                }}
              >
                +38 (098) 009-55-77
              </a>
              <div className='mt-2 text-xs text-gray-600'>Дзвінки приймаємо у робочі години.</div>
            </div>

            <div className='rounded-xl border bg-white p-4 text-center'>
              <div className='flex items-center justify-center gap-2 text-sm font-medium text-gray-900'>
                <FiMapPin className='w-4 h-4 text-gray-500' />
                <span>Адреса</span>
              </div>
              <div className='mt-2 text-sm text-gray-700'>м. Івано-Франківськ, вул. Білозіра 8</div>
              <button
                type='button'
                onClick={() => window.open(MAPS_URL, '_blank')}
                className='mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-red-600 hover:text-white transition-transform duration-150 active:scale-95 cursor-pointer shadow-sm hover:shadow-md border'
              >
                <FiMapPin className='w-4 h-4' />
                <span>Відкрити на карті</span>
              </button>
            </div>

            <div className='rounded-xl border bg-white p-4 text-center'>
              <div className='flex items-center justify-center gap-2 text-sm font-medium text-gray-900'>
                <FiClock className='w-4 h-4 text-gray-500' />
                <span>Графік роботи</span>
              </div>
              <div className='mt-2 text-sm text-gray-700'>
                <div>Пн–Пт: 9:00–19:00</div>
                <div>Сб: 9:00–15:00</div>
                <div>Нд: вихідний</div>
              </div>
            </div>
          </div>
        </div>

        <section id='lead' className='space-y-3'>
          <div className='relative overflow-hidden rounded-2xl border shadow-lg bg-gradient-to-br from-white to-red-50'>
            <div className='absolute -top-16 -right-16 w-56 h-56 rounded-full bg-red-100 blur-2xl opacity-70 pointer-events-none'></div>
            <div className='relative p-5 md:p-6'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow ring-1 ring-red-600/20'>
                  <FiPhoneCall className='w-5 h-5' />
                </div>
                <div className='text-xl font-semibold'>Зв’яжіться зі мною</div>
              </div>

              {callSuccessOpen && (
                <div className='mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800'>
                  Дякуємо! Ми зв’яжемося з вами найближчим часом.
                </div>
              )}

              <form className='grid md:grid-cols-2 gap-3' onSubmit={submitCallLead} noValidate>
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
                  type='submit'
                  className='btn md:col-span-2 disabled:opacity-60'
                  disabled={callHasErrors}
                >
                  Надіслати
                </button>
              </form>
            </div>
          </div>
        </section>

        <section id='how-it-works' className='space-y-6'>
          <h2 className='text-2xl font-semibold'>Як це працює</h2>
          <div className='relative'>
            <div className='hidden md:block absolute left-0 right-0 top-12 h-0.5 bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200'></div>

            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div className='relative bg-white border rounded-xl shadow-sm p-5 flex flex-col items-center text-center'>
                <div className='absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-white text-xs flex items-center justify-center font-semibold'>1</div>
                <div className='w-12 h-12 mt-2 rounded-xl bg-red-600 text-white flex items-center justify-center shadow ring-1 ring-red-600/20'>
                  <FiPhoneCall className='w-5 h-5' />
                </div>
                <div className='mt-3 font-medium'>Заявка або дзвінок</div>
                <p className='mt-1 text-sm text-gray-600'>Залишаєте контакти чи телефонуєте — уточнюємо запит.</p>
              </div>

              <div className='relative bg-white border rounded-xl shadow-sm p-5 flex flex-col items-center text-center'>
                <div className='absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-white text-xs flex items-center justify-center font-semibold'>2</div>
                <div className='w-12 h-12 mt-2 rounded-xl bg-red-600 text-white flex items-center justify-center shadow ring-1 ring-red-600/20'>
                  <FiCheckCircle className='w-5 h-5' />
                </div>
                <div className='mt-3 font-medium'>Підтвердження</div>
                <p className='mt-1 text-sm text-gray-600'>Передзвонюємо, відповідаємо на питання та узгоджуємо деталі.</p>
              </div>

              <div className='relative bg-white border rounded-xl shadow-sm p-5 flex flex-col items-center text-center'>
                <div className='absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-white text-xs flex items-center justify-center font-semibold'>3</div>
                <div className='w-12 h-12 mt-2 rounded-xl bg-red-600 text-white flex items-center justify-center shadow ring-1 ring-red-600/20'>
                  <FiPackage className='w-5 h-5' />
                </div>
                <div className='mt-3 font-medium'>Підбір / комплектація</div>
                <p className='mt-1 text-sm text-gray-600'>Підбираємо позиції та готуємо замовлення (за потреби — доставку).</p>
              </div>

              <div className='relative bg-white border rounded-xl shadow-sm p-5 flex flex-col items-center text-center'>
                <div className='absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-white text-xs flex items-center justify-center font-semibold'>4</div>
                <div className='w-12 h-12 mt-2 rounded-xl bg-red-600 text-white flex items-center justify-center shadow ring-1 ring-red-600/20'>
                  <FiTruck className='w-5 h-5' />
                </div>
                <div className='mt-3 font-medium'>Готово</div>
                <p className='mt-1 text-sm text-gray-600'>Отримуєте товар у магазині або при доставці (як домовились).</p>
              </div>
            </div>
          </div>
        </section>

        <div className='rounded-2xl border bg-white shadow-sm p-5 overflow-hidden'>
          <div className='text-lg font-semibold'>Карта</div>
          <div className='mt-3 rounded-xl overflow-hidden border'>
            <iframe
              title='Карта магазину БудЕксперт'
              src={MAPS_EMBED_URL}
              className='w-full h-[320px]'
              loading='lazy'
              referrerPolicy='no-referrer-when-downgrade'
            />
          </div>
        </div>
      </div>
    </div>
  )
}
