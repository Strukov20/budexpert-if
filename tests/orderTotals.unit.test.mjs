import test from 'node:test';
import assert from 'node:assert/strict';
import { orderTotals } from '../client/src/lib/orderTotals.mjs';

const product = { _id: 'product', name: 'Клей-герметик', price: 348, discount: 0 };
const oldOrder = { items: [{ productId: product, quantity: 22 }], subtotalPrice: 6644, discountAmount: 0, totalPrice: 6644 };

test('legacy single-item order recovers 302 × 22 from 6644, ignoring the current price 348', () => {
  const input = structuredClone(oldOrder);
  const result = orderTotals(input);
  assert.equal(result.rows[0].unitPrice, 30200);
  assert.equal(result.rows[0].lineTotal, 664400);
  assert.equal(result.total, 664400);
  assert.equal(result.recovered, true);
  assert.equal(result.mismatch, false);
  assert.deepEqual(input, oldOrder); // Presentation must not rewrite historical records.
});
test('snapshots remain authoritative after catalog price/discount changes or product deletion', () => {
  for (const current of [product, { ...product, price: 1000, discount: 50 }, null]) {
    const result = orderTotals({ ...oldOrder, items: [{ productId: current, name: 'Назва на момент замовлення', unitPrice: 302, quantity: 22 }] });
    assert.equal(result.rows[0].unitPrice, 30200);
    assert.equal(result.rows[0].lineTotal, 664400);
    assert.equal(result.rows[0].name, 'Назва на момент замовлення');
    assert.equal(result.recovered, false);
  }
});
test('promo discounts are separate from historical unit prices', () => {
  const result = orderTotals({ ...oldOrder, promoCode: 'SOCIAL5', promoPercent: 5, discountAmount: 332.20, totalPrice: 6311.80 });
  assert.equal(result.rows[0].unitPrice, 30200);
  assert.equal(result.subtotal, 664400);
  assert.equal(result.discount, 33220);
  assert.equal(result.total, 631180);
  assert.equal(result.mismatch, false);
});
test('one missing price can be recovered from the remaining historical subtotal', () => {
  const result = orderTotals({ ...oldOrder, subtotalPrice: 6844, totalPrice: 6844, items: [{ name: 'Відома позиція', unitPrice: 100, quantity: 2 }, ...oldOrder.items] });
  assert.equal(result.rows[1].unitPrice, 30200);
  assert.equal(result.rows[1].lineTotal, 664400);
  assert.equal(result.mismatch, false);
});
test('multiple missing prices are not invented from current catalog data', () => {
  const result = orderTotals({ ...oldOrder, items: [...oldOrder.items, { productId: 'other', quantity: 1 }] }, [{ _id: 'other', name: 'Інший товар', price: 500 }]);
  assert.equal(result.unresolved, true);
  assert.equal(result.recovered, false);
  assert.deepEqual(result.rows.map(item => item.unitPrice), [null, null]);
  assert.equal(result.total, 664400);
});
test('non-divisible subtotal and insufficient promo history remain explicitly unknown', () => {
  assert.equal(orderTotals({ subtotalPrice: 100, totalPrice: 100, items: [{ productId: product, quantity: 3 }] }).unresolved, true);
  assert.equal(orderTotals({ totalPrice: 6311.80, promoPercent: 5, items: oldOrder.items }).unresolved, true);
});
test('zero historical prices are valid, and inconsistencies are reported without changing totals', () => {
  const zero = orderTotals({ subtotalPrice: 0, totalPrice: 0, items: [{ productId: product, unitPrice: 0, quantity: 22 }] });
  assert.equal(zero.rows[0].unitPrice, 0);
  assert.equal(zero.recovered, false);
  assert.equal(zero.mismatch, false);
  const mismatch = orderTotals({ ...oldOrder, items: [{ productId: product, unitPrice: 348, quantity: 22 }] });
  assert.equal(mismatch.rows[0].lineTotal, 765600);
  assert.equal(mismatch.total, 664400);
  assert.equal(mismatch.mismatch, true);
});
