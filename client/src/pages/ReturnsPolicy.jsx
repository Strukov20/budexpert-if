import React from 'react'
import { Link } from 'react-router-dom'

export default function ReturnsPolicy(){
  return (
    <div className='max-w-5xl mx-auto px-4 py-10'>
      <div className='mb-4 text-sm text-gray-500'>
        <Link className='hover:underline' to='/'>Головна</Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-800'>Умови повернення товару</span>
      </div>

      <div className='bg-white border rounded-2xl shadow-sm p-6 md:p-8'>
        <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>Умови повернення та обміну</h1>
        <p className='mt-3 text-gray-700'>
          Ми прагнемо, щоб покупки в «БудЕксперт» були зручними та безпечними. Якщо товар не підійшов або має невідповідність,
          ви можете оформити повернення або обмін згідно з чинним законодавством України та правилами магазину.
        </p>

        <div className='mt-8 grid gap-6'>
          <section>
            <h2 className='text-lg md:text-xl font-semibold'>Коли можливе повернення</h2>
            <div className='mt-3 text-gray-700 space-y-2'>
              <p>Повернення/обмін можливі, якщо:</p>
              <ul className='list-disc pl-5 space-y-1'>
                <li>товар не був у використанні та збережено його товарний вигляд;</li>
                <li>збережено комплектність, упаковку (за наявності), пломби/ярлики;</li>
                <li>є документ, що підтверджує покупку (чек/накладна) або інша можливість ідентифікувати замовлення;</li>
                <li>товар не відповідає заявленим характеристикам або має виробничий брак.</li>
              </ul>
              <p className='text-sm text-gray-600'>
                Рекомендований строк звернення — протягом 14 календарних днів з дати отримання (якщо інше не передбачено законом
                або умовами гарантії).
              </p>
            </div>
          </section>

          <section>
            <h2 className='text-lg md:text-xl font-semibold'>Коли повернення може бути неможливим</h2>
            <div className='mt-3 text-gray-700 space-y-2'>
              <p>Повернення може бути неможливим у випадках, коли:</p>
              <ul className='list-disc pl-5 space-y-1'>
                <li>товар був у використанні або має сліди монтажу/експлуатації;</li>
                <li>товар пошкоджено після отримання не з вини продавця/виробника;</li>
                <li>відсутня повна комплектація або втрачено елементи, що входили до комплекту;</li>
                <li>
                  товар належить до категорій, що не підлягають поверненню відповідно до законодавства (окремі групи товарів
                  особистого/гігієнічного призначення тощо).
                </li>
              </ul>
              <p className='text-sm text-gray-600'>
                Якщо ви не впевнені, чи підлягає товар поверненню — напишіть/подзвоніть нам, і ми підкажемо найкращий варіант.
              </p>
            </div>
          </section>

          <section>
            <h2 className='text-lg md:text-xl font-semibold'>Як оформити повернення або обмін</h2>
            <div className='mt-3 text-gray-700 space-y-2'>
              <ol className='list-decimal pl-5 space-y-1'>
                <li>Зверніться до нас з номером замовлення та коротким описом причини повернення/обміну.</li>
                <li>За можливості додайте фото/відео (особливо якщо є брак або невідповідність).</li>
                <li>Ми узгодимо спосіб повернення: у магазині або службою доставки.</li>
                <li>Після отримання товару ми проводимо огляд та підтверджуємо рішення.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className='text-lg md:text-xl font-semibold'>Повернення коштів</h2>
            <div className='mt-3 text-gray-700 space-y-2'>
              <p>
                Повернення коштів здійснюється тим самим способом, яким була проведена оплата, або іншим погодженим способом.
                Строки залежать від банку/платіжної системи та можуть складати до кількох робочих днів.
              </p>
              <p className='text-sm text-gray-600'>
                Вартість доставки/пересилки може відшкодовуватися відповідно до причини повернення та умов доставки.
              </p>
            </div>
          </section>

          <section>
            <h2 className='text-lg md:text-xl font-semibold'>Контакти для звернення</h2>
            <div className='mt-3 text-gray-700 space-y-2'>
              <p>
                Телефон:{' '}
                <a
                  className='underline decoration-dotted hover:text-black'
                  href='tel:+380980095577'
                  onClick={() => {
                    try {
                      window.dataLayer = window.dataLayer || []
                      window.dataLayer.push({ event: 'click_phone', phone_number: '+380980095577', location: 'returns_policy' })
                    } catch {}
                  }}
                >
                  +38 (098) 009-55-77
                </a>
              </p>
              <p>
                Telegram:{' '}
                <a className='underline decoration-dotted hover:text-black' href='https://t.me/budexpert_if' target='_blank' rel='noreferrer'>
                  @budexpert_if
                </a>
              </p>
              <p className='text-sm text-gray-600'>
                Адреса магазину: м. Івано-Франківськ, вул. Білозіра 8.
              </p>
            </div>
          </section>

          <section>
            <h2 className='text-lg md:text-xl font-semibold'>Важливо</h2>
            <div className='mt-3 text-gray-700 space-y-2'>
              <p>
                Ця сторінка носить інформаційний характер. Остаточні умови повернення/обміну визначаються чинним законодавством
                України та документами, що супроводжують товар (гарантійні умови виробника).
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
