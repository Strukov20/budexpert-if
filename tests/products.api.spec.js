import { test, expect } from '@playwright/test';
import { getAdminToken, authHeaders, uniqueSuffix } from './helpers.js';

let token;

test.beforeAll(async ({ request }) => {
  token = await getAdminToken(request);
});

test.describe('GET /products', () => {
  test('повертає масив товарів (без пагінації)', async ({ request }) => {
    const res = await request.get('products');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test('пошук за назвою (q) знаходить сідовані товари', async ({ request }) => {
    const res = await request.get('products', { params: { q: 'Seed Product' } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.length).toBeGreaterThanOrEqual(5);
    expect(body.every(p => p.name.includes('Seed Product'))).toBe(true);
  });

  test('пагінація (page/limit) повертає обгорнутий об\'єкт з items/total', async ({ request }) => {
    const res = await request.get('products', { params: { page: 1, limit: 2 } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeLessThanOrEqual(2);
    expect(typeof body.total).toBe('number');
    expect(body.page).toBe(1);
    expect(body.limit).toBe(2);
  });
});

test('GET /products/counts повертає byCategory/bySubcategory/byType', async ({ request }) => {
  const res = await request.get('products/counts');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('byCategory');
  expect(body).toHaveProperty('bySubcategory');
  expect(body).toHaveProperty('byType');
});

test.describe('GET /products/:id', () => {
  test('існуючий товар -> 200', async ({ request }) => {
    const list = await (await request.get('products')).json();
    const first = list[0];
    const res = await request.get(`products/${first._id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body._id).toBe(first._id);
  });

  test('неіснуючий валідний ObjectId -> 404', async ({ request }) => {
    const res = await request.get('products/000000000000000000000000');
    expect(res.status()).toBe(404);
  });
});

test.describe('GET /products/export/all (admin only)', () => {
  test('без токена -> 401', async ({ request }) => {
    const res = await request.get('products/export/all');
    expect(res.status()).toBe(401);
  });

  test('з токеном -> 200, CSV з заголовком', async ({ request }) => {
    const res = await request.get('products/export/all', { headers: authHeaders(token) });
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text.split('\n')[0]).toContain('name,price,stock,unit,sku,description');
  });
});

test.describe('POST /products/sync/sku (admin only)', () => {
  test('без токена -> 401', async ({ request }) => {
    const res = await request.post('products/sync/sku', { data: { skus: ['x'] } });
    expect(res.status()).toBe(401);
  });

  test('порожній масив skus -> 400 (запобіжник від випадкового обнулення каталогу)', async ({ request }) => {
    const res = await request.post('products/sync/sku', {
      headers: authHeaders(token),
      data: { skus: [] },
    });
    expect(res.status()).toBe(400);
  });

  test('dryRun з реальним sku -> ok без змін (markedCount=0)', async ({ request }) => {
    const res = await request.post('products/sync/sku', {
      headers: authHeaders(token),
      data: { skus: ['seed-001'], dryRun: true },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.dryRun).toBe(true);
    expect(body.markedCount).toBe(0);
  });
});

test.describe('POST /products (create, admin only)', () => {
  test('без токена -> 401', async ({ request }) => {
    const res = await request.post('products', { data: { name: 'x', price: 1 } });
    expect(res.status()).toBe(401);
  });

  test('без name -> 400', async ({ request }) => {
    const res = await request.post('products', {
      headers: authHeaders(token),
      data: { price: 10 },
    });
    expect(res.status()).toBe(400);
  });

  test('без price (обов\'язкове поле схеми) -> 400, не 500', async ({ request }) => {
    const res = await request.post('products', {
      headers: authHeaders(token),
      data: { name: `NoPrice-${uniqueSuffix()}` },
    });
    expect(res.status()).toBe(400);
  });

  test('валідні дані -> 201, товар створено і видалено після тесту', async ({ request }) => {
    const name = `Test Product ${uniqueSuffix()}`;
    const createRes = await request.post('products', {
      headers: authHeaders(token),
      data: { name, price: 123, description: 'початковий опис' },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.name).toBe(name);

    const delRes = await request.delete(`products/${created._id}`, { headers: authHeaders(token) });
    expect(delRes.status()).toBe(200);
  });
});

test.describe('PUT /products/:id (admin only)', () => {
  let productId;

  test.beforeAll(async ({ request }) => {
    const res = await request.post('products', {
      headers: authHeaders(token),
      data: { name: `PutTarget-${uniqueSuffix()}`, price: 50 },
    });
    productId = (await res.json())._id;
  });

  test.afterAll(async ({ request }) => {
    if (productId) await request.delete(`products/${productId}`, { headers: authHeaders(token) });
  });

  test('без токена -> 401', async ({ request }) => {
    const res = await request.put(`products/${productId}`, { data: { price: 999 } });
    expect(res.status()).toBe(401);
  });

  test('з токеном оновлює поле', async ({ request }) => {
    const res = await request.put(`products/${productId}`, {
      headers: authHeaders(token),
      data: { price: 999 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.price).toBe(999);
  });

  test('неіснуючий товар -> 404', async ({ request }) => {
    const res = await request.put('products/000000000000000000000000', {
      headers: authHeaders(token),
      data: { price: 1 },
    });
    expect(res.status()).toBe(404);
  });
});

test.describe('DELETE /products/:id (admin only)', () => {
  test('без токена -> 401', async ({ request }) => {
    const res = await request.delete('products/000000000000000000000000');
    expect(res.status()).toBe(401);
  });

  test('з токеном видаляє товар', async ({ request }) => {
    const created = await (await request.post('products', {
      headers: authHeaders(token),
      data: { name: `DeleteTarget-${uniqueSuffix()}`, price: 10 },
    })).json();

    const delRes = await request.delete(`products/${created._id}`, { headers: authHeaders(token) });
    expect(delRes.status()).toBe(200);

    const getRes = await request.get(`products/${created._id}`);
    expect(getRes.status()).toBe(404);
  });
});

test.describe('DELETE /products (масове видалення, admin only)', () => {
  test('без токена -> 401 (не виконуємо авторизований варіант — надто деструктивно для спільної тестової БД)', async ({ request }) => {
    const res = await request.delete('products');
    expect(res.status()).toBe(401);
  });

  test('з токеном, але без ?confirm=true -> 400 (запобіжник)', async ({ request }) => {
    const res = await request.delete('products', { headers: authHeaders(token) });
    expect(res.status()).toBe(400);
  });
});

test.describe('POST /products/bulk (CSV/масовий імпорт, admin only) — регресія затирання опису', () => {
  const sku = `bulk-test-${uniqueSuffix()}`;

  test.afterAll(async ({ request }) => {
    // прибираємо тестовий товар напряму через bulk update неможливо видалити за sku,
    // тож знайдемо його по sku через список і видалимо по _id.
    const list = await (await request.get('products', { params: { q: 'Bulk Test Product' } })).json();
    const mine = list.find(p => p.sku === sku);
    if (mine) await request.delete(`products/${mine._id}`, { headers: authHeaders(token) });
  });

  test('без токена -> 401', async ({ request }) => {
    const res = await request.post('products/bulk', { data: [{ name: 'x', sku: 'x' }] });
    expect(res.status()).toBe(401);
  });

  test('порожній масив -> 400', async ({ request }) => {
    const res = await request.post('products/bulk', { headers: authHeaders(token), data: [] });
    expect(res.status()).toBe(400);
  });

  test('створює новий товар з описом (insert по sku)', async ({ request }) => {
    const res = await request.post('products/bulk', {
      headers: authHeaders(token),
      data: [{ name: 'Bulk Test Product', sku, price: 100, description: 'оригінальний опис' }],
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.inserted).toBe(1);

    const list = await (await request.get('products', { params: { q: 'Bulk Test Product' } })).json();
    const mine = list.find(p => p.sku === sku);
    expect(mine.description).toBe('оригінальний опис');
  });

  test('РЕГРЕСІЯ: bulk-оновлення без поля description НЕ затирає наявний опис', async ({ request }) => {
    const res = await request.post('products/bulk', {
      headers: authHeaders(token),
      data: [{ name: 'Bulk Test Product', sku, price: 150 }], // без description взагалі
    });
    expect(res.status()).toBe(200);

    const list = await (await request.get('products', { params: { q: 'Bulk Test Product' } })).json();
    const mine = list.find(p => p.sku === sku);
    expect(mine.price).toBe(150);
    expect(mine.description).toBe('оригінальний опис'); // мав лишитись незмінним
  });

  test('РЕГРЕСІЯ: bulk-оновлення з порожнім рядком description НЕ затирає наявний опис', async ({ request }) => {
    const res = await request.post('products/bulk', {
      headers: authHeaders(token),
      data: [{ name: 'Bulk Test Product', sku, price: 175, description: '' }],
    });
    expect(res.status()).toBe(200);

    const list = await (await request.get('products', { params: { q: 'Bulk Test Product' } })).json();
    const mine = list.find(p => p.sku === sku);
    expect(mine.price).toBe(175);
    expect(mine.description).toBe('оригінальний опис');
  });

  test('bulk-оновлення з реальним новим описом ОНОВЛЮЄ опис', async ({ request }) => {
    const res = await request.post('products/bulk', {
      headers: authHeaders(token),
      data: [{ name: 'Bulk Test Product', sku, price: 175, description: 'новий опис' }],
    });
    expect(res.status()).toBe(200);

    const list = await (await request.get('products', { params: { q: 'Bulk Test Product' } })).json();
    const mine = list.find(p => p.sku === sku);
    expect(mine.description).toBe('новий опис');
  });
});
