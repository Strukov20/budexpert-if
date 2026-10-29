import { test, expect } from '@playwright/test';
import { getAdminToken, authHeaders, uniqueSuffix } from './helpers.js';

test('order unit prices and totals survive product price changes and deletion', async ({ request }) => {
  const token = await getAdminToken(request);
  const headers = authHeaders(token);
  let productId;
  let orderId;
  try {
    const created = await request.post('products', { headers, data: { name: `History ${uniqueSuffix()}`, price: 302, stock: 0 } });
    expect(created.status()).toBe(201);
    const product = await created.json();
    productId = product._id;
    const placed = await request.post('orders', { data: { customerName: 'Тестовий покупець', phone: '0991234567', address: 'Самовивіз', items: [{ productId, quantity: 22 }] } });
    expect(placed.status()).toBe(201);
    orderId = (await placed.json())._id;
    expect((await request.put(`products/${productId}`, { headers, data: { price: 348, discount: 10 } })).status()).toBe(200);
    const changed = await (await request.get(`orders/${orderId}`, { headers })).json();
    expect(changed.items[0]).toMatchObject({ unitPrice: 302, quantity: 22, name: product.name });
    expect(changed.items[0].productId.price).toBe(348);
    expect(changed.subtotalPrice).toBe(6644);
    expect(changed.totalPrice).toBe(6644);
    await request.delete(`products/${productId}`, { headers });
    productId = null;
    const deleted = await (await request.get(`orders/${orderId}`, { headers })).json();
    expect(deleted.items[0].productId).toBeNull();
    expect(deleted.items[0].unitPrice).toBe(302);
    expect(deleted.items[0].name).toBe(product.name);
    expect(deleted.totalPrice).toBe(6644);
  } finally {
    if (orderId) await request.delete(`orders/${orderId}`, { headers });
    if (productId) await request.delete(`products/${productId}`, { headers });
  }
});
