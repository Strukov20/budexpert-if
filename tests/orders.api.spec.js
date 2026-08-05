import { test, expect } from '@playwright/test';
import { getAdminToken, authHeaders, uniqueSuffix } from './helpers.js';

let token;
let seedProduct;
const createdOrderIds = [];

test.beforeAll(async ({ request }) => {
  token = await getAdminToken(request);
  const list = await (await request.get('products', { params: { q: 'Seed Product 1' } })).json();
  seedProduct = list.find(p => p.name === 'Seed Product 1');
  if (!seedProduct) throw new Error('Сідований товар "Seed Product 1" не знайдено — запустіть seed:products перед тестами');
});

test.afterAll(async ({ request }) => {
  for (const id of createdOrderIds) {
    await request.delete(`orders/${id}`, { headers: authHeaders(token) }).catch(() => {});
  }
});

function validOrderPayload(phoneSuffix) {
  return {
    customerName: 'Тестовий Клієнт',
    phone: `099${phoneSuffix}`,
    address: 'вул. Тестова 1',
    items: [{ productId: seedProduct._id, quantity: 2 }],
  };
}

test.describe('POST /orders (публічний, з rate limit)', () => {
  test('невалідний телефон -> 400', async ({ request }) => {
    const res = await request.post('orders', {
      data: { ...validOrderPayload('1234567'), phone: '123' },
    });
    expect(res.status()).toBe(400);
  });

  test('валідні дані -> 201, totalPrice рахується сервером з ціни товару', async ({ request }) => {
    const res = await request.post('orders', { data: validOrderPayload('1000001') });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdOrderIds.push(body._id);
    expect(body.totalPrice).toBe(seedProduct.price * 2);
    expect(body.status).toBe('new');
  });

  test('невірний промокод -> 400', async ({ request }) => {
    const res = await request.post('orders', {
      data: { ...validOrderPayload('1000002'), promoCode: 'NOTREAL' },
    });
    expect(res.status()).toBe(400);
  });

  test('валідний промокод SOCIAL5 застосовує знижку 5%', async ({ request }) => {
    const payload = { ...validOrderPayload('1000003'), promoCode: 'SOCIAL5' };
    const res = await request.post('orders', { data: payload });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdOrderIds.push(body._id);
    expect(body.promoPercent).toBe(5);
    expect(body.totalPrice).toBeCloseTo(seedProduct.price * 2 * 0.95, 2);
  });

  test('той самий промокод з тим самим телефоном вдруге -> 400 (одноразовий)', async ({ request }) => {
    const payload = { ...validOrderPayload('1000003'), promoCode: 'SOCIAL5' };
    const res = await request.post('orders', { data: payload });
    expect(res.status()).toBe(400);
  });
});

test.describe('GET /orders (admin only)', () => {
  test('без токена -> 401', async ({ request }) => {
    const res = await request.get('orders');
    expect(res.status()).toBe(401);
  });

  test('з токеном повертає список, що містить створене замовлення', async ({ request }) => {
    const res = await request.get('orders', { headers: authHeaders(token) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some(o => createdOrderIds.includes(o._id))).toBe(true);
  });
});

test.describe('GET /orders/:id (admin only)', () => {
  test('без токена -> 401', async ({ request }) => {
    const res = await request.get(`orders/${createdOrderIds[0]}`);
    expect(res.status()).toBe(401);
  });

  test('з токеном повертає замовлення', async ({ request }) => {
    const res = await request.get(`orders/${createdOrderIds[0]}`, { headers: authHeaders(token) });
    expect(res.status()).toBe(200);
  });
});

test.describe('PUT /orders/:id (admin only)', () => {
  test('без токена -> 401', async ({ request }) => {
    const res = await request.put(`orders/${createdOrderIds[0]}`, { data: { status: 'processing' } });
    expect(res.status()).toBe(401);
  });

  test('з токеном оновлює статус і нотатку', async ({ request }) => {
    const res = await request.put(`orders/${createdOrderIds[0]}`, {
      headers: authHeaders(token),
      data: { status: 'processing', note: 'тестова нотатка' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('processing');
    expect(body.note).toBe('тестова нотатка');
  });
});

test.describe('DELETE /orders/:id (admin only)', () => {
  test('без токена -> 401', async ({ request }) => {
    const res = await request.delete(`orders/${createdOrderIds[1]}`);
    expect(res.status()).toBe(401);
  });

  test('з токеном видаляє замовлення', async ({ request }) => {
    const idToDelete = createdOrderIds[1];
    const res = await request.delete(`orders/${idToDelete}`, { headers: authHeaders(token) });
    expect(res.status()).toBe(200);
    createdOrderIds.splice(1, 1);

    const getRes = await request.get(`orders/${idToDelete}`, { headers: authHeaders(token) });
    expect(getRes.status()).toBe(404);
  });
});
