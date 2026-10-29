import React from 'react'
import { orderTotals } from '../lib/orderTotals.mjs'

const price = cents => cents === null ? '—' : `${(cents / 100).toFixed(2)} ₴`

export default function AdminOrderItems({ order, products }) {
  const totals = orderTotals(order, products)
  return (
    <div className='mt-3 min-w-0 space-y-3' data-testid='admin-order-details-items'>
      <div className='overflow-x-auto'>
        <table className='min-w-full text-sm' data-testid='admin-order-details-items-table'>
          <thead>
            <tr className='bg-gray-50'>
              <th className='text-left px-3 py-2'>Товар</th>
              <th className='text-right px-3 py-2'>К-сть</th>
              <th className='text-right px-3 py-2'>Ціна</th>
              <th className='text-right px-3 py-2'>Сума</th>
            </tr>
          </thead>
          <tbody>
            {totals.rows.map((item, index) => (
              <tr key={index} className='border-t' data-testid={`admin-order-details-item-${index}`}>
                <td className='px-3 py-2'>{item.name}</td>
                <td className='px-3 py-2 text-right'>{item.quantity ?? '—'}</td>
                <td className='px-3 py-2 text-right whitespace-nowrap' data-testid={`admin-order-details-item-${index}-price`}>{price(item.unitPrice)}</td>
                <td className='px-3 py-2 text-right whitespace-nowrap' data-testid={`admin-order-details-item-${index}-sum`}>{price(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totals.recovered && (
        <p className='rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600' data-testid='admin-order-price-recovered'>
          У старому замовленні не збережена ціна за одиницю. Її відновлено зі збереженої суми товарів; поточні ціни каталогу не застосовуються.
        </p>
      )}
      {totals.unresolved && (
        <p className='rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900' data-testid='admin-order-price-unknown'>
          У цьому замовленні не збережені всі ціни позицій. Їх неможливо однозначно відновити з підсумку, тому невідомі ціни позначені «—». Збережену суму замовлення залишено без змін.
        </p>
      )}
      {totals.mismatch && (
        <p className='rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900' data-testid='admin-order-totals-mismatch'>
          Збережені ціни позицій і підсумки не узгоджуються. Перевірте первинне замовлення: історичні суми автоматично не перераховуються.
        </p>
      )}
      <div className='space-y-1 text-right text-sm text-gray-700' data-testid='admin-order-details-promo'>
        {totals.subtotal !== null && <div>Сума товарів: {price(totals.subtotal)}</div>}
        {order.promoCode && <div>Промокод: {order.promoCode}{Number(order.promoPercent) > 0 ? ` (−${order.promoPercent}%)` : ''}</div>}
        {totals.discount > 0 && <div>Знижка на замовлення: −{price(totals.discount)}</div>}
        <div className='pt-1 text-base font-semibold text-gray-900' data-testid='admin-order-details-total'>Разом: {price(totals.total)}</div>
      </div>
    </div>
  )
}
