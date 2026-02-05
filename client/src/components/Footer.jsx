import React from 'react'
import { FiFacebook, FiInstagram, FiPhone, FiMail, FiMapPin, FiClock, FiTruck } from 'react-icons/fi'
import { FaTiktok, FaTelegramPlane } from 'react-icons/fa'

const MAPS_URL = 'https://maps.app.goo.gl/V6mLeSS4EXGmaSe56'

export default function Footer(){
  return (
    <footer className="bg-black text-gray-300 mt-10 pt-10">
      <div className="container grid gap-10 md:grid-cols-2 lg:grid-cols-4 pb-8">
        {/* Brand / summary */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold tracking-tight">
              <span className="text-red-600">БУД</span>{' '}<span className="text-white">ЕКСПЕРТ</span>
            </h3>
          </div>
          <p className="mt-3 text-xs md:text-sm text-gray-400">
            Все для ремонту та будівництва: матеріали, інструменти та сервіс для майстрів і домашніх проєктів.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <a
              href="https://www.tiktok.com/@budexpert_"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-transform duration-150 flex items-center justify-center cursor-pointer hover:scale-105"
              aria-label="TikTok"
            >
              <FaTiktok className="w-4 h-4" />
            </a>
            <a
              href="https://www.instagram.com/budexpert_if/"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-transform duration-150 flex items-center justify-center cursor-pointer hover:scale-105"
              aria-label="Instagram"
            >
              <FiInstagram className="w-4 h-4" />
            </a>
            <a
              href="https://t.me/budexpert_if"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-transform duration-150 flex items-center justify-center cursor-pointer hover:scale-105"
              aria-label="Telegram"
            >
              <FaTelegramPlane className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="text-white font-semibold mb-4">Навігація</h4>
          <ul className="space-y-2 text-xs md:text-sm">
            <li><a href="/" className="hover:text-white transition-colors cursor-pointer">Каталог товарів</a></li>
            <li><a href="/services" className="hover:text-white transition-colors cursor-pointer">Послуги</a></li>
            <li><a href="/cart" className="hover:text-white transition-colors cursor-pointer">Кошик</a></li>
          </ul>
        </div>

        {/* Location / map */}
        <div>
          <h4 className="text-white font-semibold mb-4">Де ми знаходимось?</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <FiMapPin className="mt-0.5 text-gray-400" />
              <span>
                Івано-Франківськ<br />
                вул. Білозіра 8
              </span>
            </li>
          </ul>
          <button
            type="button"
            onClick={() => window.open(MAPS_URL, '_blank')}
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-red-600 hover:text-white transition-transform duration-150 active:scale-95 cursor-pointer shadow-sm hover:shadow-md"
          >
            <FiMapPin className="w-4 h-4" />
            <span>Відкрити маршрут на карті</span>
          </button>
        </div>

        {/* Info: hours, delivery */}
        <div>
          <h4 className="text-white font-semibold mb-4">Корисна інформація</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <FiClock className="mt-0.5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-200">Графік роботи</div>
                <div className="text-gray-400 text-xs md:text-sm">Пн–Пт: 9:00–19:00<br />Сб: 9:00–15:00, Нд: вихідний</div>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <FiTruck className="mt-0.5 text-gray-400 w-6 h-6" />
              <div>
                <div className="font-medium text-gray-200">Доставка</div>
                <div className="text-gray-400 text-xs md:text-sm">Безкоштовна доставка від 5000 грн по Франківську. Відправка по Україні службами доставки.</div>
              </div>
            </li>
          </ul>
        </div>

        {/* Contacts */}
        <div className="md:col-span-2 lg:col-span-4 border-t border-white/10 pt-6 grid gap-6 md:grid-cols-3">
          <div>
            <h4 className="text-white font-semibold mb-3">Контакти</h4>
            <ul className="space-y-2 text-xs md:text-sm">
              <li className="flex items-center gap-2">
                <FiPhone className="text-gray-400" />
                <a
                  href="tel:+380980095577"
                  onClick={() => {
                    try {
                      window.dataLayer = window.dataLayer || []
                      window.dataLayer.push({ event: 'click_phone', phone_number: '+380980095577', location: 'footer' })
                    } catch {}
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  098 009 5577
                </a>
              </li>
              <li className="flex items-center gap-2">
                <FiMail className="text-gray-400" />
                <a href="mailto:budexpertif@mailinator.com" className="hover:text-white transition-colors cursor-pointer">budexpertif@mailinator.com</a>
              </li>
              <li className="flex items-center gap-2">
                <FaTelegramPlane className="text-gray-400" />
                <a
                  href="https://t.me/budexpert_if"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Telegram: @budexpert_if
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Покупцям</h4>
            <ul className="space-y-2 text-xs md:text-sm text-gray-400">
              <li>Допомога у підборі матеріалів.</li>
              <li>Індивідуальні умови для майстрів.</li>
              <li>Можливість замовлення у Viber/Telegram.</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Оплата</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Готівка при отриманні.</li>
              <li>Безготівковий розрахунок.</li>
              <li>Передоплата для нестандартних позицій.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container py-4 text-xs md:text-sm text-gray-400 flex flex-col md:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} Буд Експерт. Всі права захищено.</div>
          <div className="flex items-center gap-3 text-xs md:text-sm">
            <a href="#" className="hover:text-white transition-colors cursor-pointer">Політика конфіденційності</a>
            <span className="opacity-30">|</span>
            <a href="#" className="hover:text-white transition-colors cursor-pointer">Умови користування</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
