import React from 'react'
import { priceInKopiykas } from '../../../shared/pricing.mjs'

export default function CartItemPrice({ product, quantity = 1, compact = false, format = value => value.toFixed(2), priceTestId }) {
  const current = priceInKopiykas(product) * quantity / 100
  const original = Math.round(Number(product.price) * 100) * quantity / 100
  const discounted = current < original
  const discount = Math.max(0, Math.min(100, Number(product.discount) || 0))

  return (
    <span className={`inline-flex flex-col whitespace-nowrap ${compact ? 'items-start' : 'items-end'}`}>
      {discounted && (
        <span className='inline-flex items-center gap-1.5 text-xs'>
          <s className='text-gray-400' aria-label='Ціна без знижки'>{format(original)} ₴</s>
          <span className='rounded bg-red-50 px-1 py-0.5 font-semibold text-red-600'>−{discount}%</span>
        </span>
      )}
      <span className={discounted ? 'font-semibold text-red-600' : ''} aria-label={discounted ? 'Ціна зі знижкою' : 'Ціна'} data-testid={priceTestId}>
        {format(current)} ₴
      </span>
    </span>
  )
}
