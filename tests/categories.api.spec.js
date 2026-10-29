import { test, expect } from '@playwright/test';
import { getAdminToken, authHeaders, uniqueSuffix } from './helpers.js';

let token;

test.beforeAll(async ({ request }) => {
  token = await getAdminToken(request);
});

test('GET /categories повертає масив', async ({ request }) => {
  const res = await request.get('categories');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
});

test('GET /categories/:id неіснуюча -> 404', async ({ request }) => {
  const res = await request.get('categories/000000000000000000000000');
  expect(res.status()).toBe(404);
});

test.describe('POST /categories (admin only)', () => {
  test('без токена -> 401', async ({ request }) => {
    const res = await request.post('categories', { data: { name: 'x' } });
    expect(res.status()).toBe(401);
  });

  test('без name -> 400', async ({ request }) => {
    const res = await request.post('categories', { headers: authHeaders(token), data: {} });
    expect(res.status()).toBe(400);
  });

  test('валідні дані -> 201', async ({ request }) => {
    const name = `Test Category ${uniqueSuffix()}`;
    const res = await request.post('categories', { headers: authHeaders(token), data: { name } });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.name).toBe(name);
    await request.delete(`categories/${body._id}`, { headers: authHeaders(token) });
  });

  test('дубль назви на тому ж рівні -> 409', async ({ request }) => {
    const name = `Dup Category ${uniqueSuffix()}`;
    const first = await (await request.post('categories', { headers: authHeaders(token), data: { name } })).json();
    const dupRes = await request.post('categories', { headers: authHeaders(token), data: { name } });
    expect(dupRes.status()).toBe(409);
    await request.delete(`categories/${first._id}`, { headers: authHeaders(token) });
  });
});

test.describe('PUT /categories/:id (admin only)', () => {
  let catId;

  test.beforeAll(async ({ request }) => {
    const res = await request.post('categories', {
      headers: authHeaders(token),
      data: { name: `PutCat-${uniqueSuffix()}` },
    });
    catId = (await res.json())._id;
  });

  test.afterAll(async ({ request }) => {
    if (catId) await request.delete(`categories/${catId}`, { headers: authHeaders(token) });
  });

  test('без токена -> 401', async ({ request }) => {
    const res = await request.put(`categories/${catId}`, { data: { name: 'x' } });
    expect(res.status()).toBe(401);
  });

  test('з токеном оновлює назву', async ({ request }) => {
    const newName = `Updated-${uniqueSuffix()}`;
    const res = await request.put(`categories/${catId}`, {
      headers: authHeaders(token),
      data: { name: newName },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe(newName);
  });
});

test.describe('DELETE /categories/:id (admin only)', () => {
  test('без токена -> 401', async ({ request }) => {
    const res = await request.delete('categories/000000000000000000000000');
    expect(res.status()).toBe(401);
  });

  test('категорію з підкатегоріями видалити не можна -> 400', async ({ request }) => {
    const parent = await (await request.post('categories', {
      headers: authHeaders(token),
      data: { name: `Parent-${uniqueSuffix()}` },
    })).json();
    const child = await (await request.post('categories', {
      headers: authHeaders(token),
      data: { name: `Child-${uniqueSuffix()}`, parent: parent._id },
    })).json();

    const delRes = await request.delete(`categories/${parent._id}`, { headers: authHeaders(token) });
    expect(delRes.status()).toBe(400);

    await request.delete(`categories/${child._id}`, { headers: authHeaders(token) });
    await request.delete(`categories/${parent._id}`, { headers: authHeaders(token) });
  });

  test('видаляє категорію без дітей', async ({ request }) => {
    const cat = await (await request.post('categories', {
      headers: authHeaders(token),
      data: { name: `ToDelete-${uniqueSuffix()}` },
    })).json();

    const res = await request.delete(`categories/${cat._id}`, { headers: authHeaders(token) });
    expect(res.status()).toBe(200);

    const getRes = await request.get(`categories/${cat._id}`);
    expect(getRes.status()).toBe(404);
  });
});

test.describe('POST /categories/reassign (admin only)', () => {
  test('без токена -> 401', async ({ request }) => {
    const res = await request.post('categories/reassign', { data: { fromId: 'a', toId: 'b' } });
    expect(res.status()).toBe(401);
  });

  test('без fromId/toId -> 400', async ({ request }) => {
    const res = await request.post('categories/reassign', { headers: authHeaders(token), data: {} });
    expect(res.status()).toBe(400);
  });

  test('неіснуючі категорії -> 404', async ({ request }) => {
    const res = await request.post('categories/reassign', {
      headers: authHeaders(token),
      data: { fromId: '000000000000000000000000', toId: '000000000000000000000001' },
    });
    expect(res.status()).toBe(404);
  });
});
