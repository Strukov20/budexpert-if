import React, { useEffect, useState } from 'react'
import { FiClock, FiMapPin, FiPhone } from 'react-icons/fi'
import { FaInstagram, FaTiktok, FaTelegramPlane } from 'react-icons/fa'
import { getBanner } from '../api'

const MAPS_URL = 'https://maps.app.goo.gl/V6mLeSS4EXGmaSe56'

const ABOUT_PHOTOS_FALLBACK = [
  '/about/shop-01.jpg',
  '/about/shop-02.jpg',
  '/about/shop-03.jpg',
  '/about/shop-04.jpg',
  '/about/shop-05.jpg',
  '/about/shop-06.jpg',
  '/about/shop-07.jpg',
  '/about/shop-08.jpg',
  '/about/shop-09.jpg',
  '/about/shop-10.jpg',
  '/about/shop-11.jpg',
  '/about/shop-12.jpg',
  '/about/shop-13.jpg',
  '/about/shop-14.jpg',
  '/about/shop-15.jpg',
  '/about/shop-16.jpg',
 ]

export default function About(){
  const [gallery, setGallery] = useState([])

  useEffect(()=>{
    document.title = 'Про магазин — БудЕксперт'
    const metaDesc = document.querySelector('meta[name="description"]') || (()=>{ const m=document.createElement('meta'); m.setAttribute('name','description'); document.head.appendChild(m); return m })()
    metaDesc.setAttribute('content','Інформація про магазин БудЕксперт: графік роботи, адреса, карта, контакти та соціальні мережі.')
  },[])

  useEffect(()=>{
    let alive = true
    ;(async ()=>{
      try{
        const d = await getBanner('about')
        const imgs = Array.isArray(d?.images) ? d.images : []
        if (!alive) return
        setGallery(imgs)
      } catch {
        if (!alive) return
        setGallery([])
      }
    })()
    return ()=>{ alive = false }
  },[])

  const photos = (Array.isArray(gallery) && gallery.length)
    ? gallery.map(x => (x?.url || '').toString()).filter(Boolean)
    : ABOUT_PHOTOS_FALLBACK

  return (
    <div className='max-w-5xl mx-auto px-3 md:px-6 py-8'>
      <h1 className='text-3xl font-semibold'>Про магазин</h1>

      <div className='mt-6 grid gap-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
          <div className='rounded-2xl border bg-white shadow-sm p-5 text-center'>
            <div className='text-lg font-semibold'>Адреса</div>
            <div className='mt-3 text-sm text-gray-700'>м. Івано-Франківськ, вул. Білозіра 8</div>
            <button
              type='button'
              onClick={() => window.open(MAPS_URL, '_blank')}
              className='mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-red-600 hover:text-white transition-transform duration-150 active:scale-95 cursor-pointer shadow-sm hover:shadow-md border'
            >
              <FiMapPin className='w-4 h-4' />
              <span>Відкрити на карті</span>
            </button>
          </div>

          <div className='rounded-2xl border bg-white shadow-sm p-5 text-center'>
            <div className='text-lg font-semibold'>Графік роботи</div>
            <div className='mt-3 flex flex-col items-center gap-2 text-sm text-gray-700'>
              <FiClock className='text-gray-500' />
              <div>
                <div>Пн–Пт: 9:00–19:00</div>
                <div>Сб: 9:00–15:00</div>
                <div>Нд: вихідний</div>
              </div>
            </div>
          </div>

          <div className='rounded-2xl border bg-white shadow-sm p-5 text-center'>
            <div className='text-lg font-semibold'>Контакти</div>
            <div className='mt-3 text-sm text-gray-700 flex justify-center'>
              <a
                className='inline-flex items-center justify-center gap-2 underline decoration-dotted hover:text-black'
                href='tel:+380980095577'
                onClick={() => {
                  try {
                    window.dataLayer = window.dataLayer || []
                    window.dataLayer.push({ event: 'click_phone', phone_number: '+380980095577', location: 'about' })
                  } catch {}
                }}
              >
                <FiPhone className='w-4 h-4' />
                <span>+38 (098) 009-55-77</span>
              </a>
            </div>
          </div>

          <div className='rounded-2xl border bg-white shadow-sm p-5 text-center'>
            <div className='text-lg font-semibold'>Ми в соцмережах</div>
            <div className='mt-3 flex flex-wrap items-center justify-center gap-3'>
              <a
                href='https://www.instagram.com/budexpert_if/'
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-red-50 transition'
                aria-label='Instagram'
              >
                <FaInstagram className='w-4 h-4 text-[#E1306C]' />
                <span className='text-sm text-gray-800'>Instagram</span>
              </a>
              <a
                href='https://www.tiktok.com/@budexpert_'
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-red-50 transition'
                aria-label='TikTok'
              >
                <FaTiktok className='w-4 h-4' />
                <span className='text-sm text-gray-800'>TikTok</span>
              </a>
              <a
                href='https://t.me/budexpert_if'
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-red-50 transition'
                aria-label='Telegram'
              >
                <FaTelegramPlane className='w-4 h-4 text-[#229ED9]' />
                <span className='text-sm text-gray-800'>Telegram</span>
              </a>
            </div>
          </div>
        </div>

        <div className='rounded-2xl border bg-white shadow-sm p-5'>
          <div className='text-lg font-semibold'>Фото магазину</div>
          <div className='mt-3 grid grid-cols-2 md:grid-cols-3 gap-3'>
            {photos.map((src, idx) => (
              <div key={src} className='relative overflow-hidden rounded-xl border bg-gray-50 aspect-[4/3]'>
                <img
                  src={src}
                  alt={`Фото магазину ${idx + 1}`}
                  className='absolute inset-0 w-full h-full object-cover'
                  loading='lazy'
                />
              </div>
            ))}
          </div>
        </div>

        
      </div>
    </div>
  )
}
