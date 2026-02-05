import { test, expect } from '@playwright/test';

async function getAdminToken(request, baseURL) {
  const r = await request.post(`${baseURL}/auth/login`, {
    data: { username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || 'admin123' },
  });
  expect(r.status()).toBe(200);
  const body = await r.json();
  return body.token;
}

test('GET /products returns seeded products', async ({ request, baseURL }) => {
  const r = await request.get(`${baseURL}/products`);
  expect(r.status()).toBe(200);
  const items = await r.json();
  expect(Array.isArray(items)).toBe(true);
  expect(items.length).toBeGreaterThan(0);
  for (const p of items.slice(0, 5)) {
    expect(typeof p).toBe('object');
    expect(p).toHaveProperty('_id');
    expect(p).toHaveProperty('name');
    expect(p).toHaveProperty('price');
  }
  const skus = items.map((p) => p && p.sku).filter(Boolean);
  expect(skus).toContain('seed-001');
});

test('GET /products supports pagination when page & limit are provided', async ({ request, baseURL }) => {
  const r = await request.get(`${baseURL}/products?page=1&limit=2`);
  expect(r.status()).toBe(200);
  const body = await r.json();

  expect(body).toHaveProperty('items');
  expect(body).toHaveProperty('total');
  expect(body).toHaveProperty('page', 1);
  expect(body).toHaveProperty('limit', 2);
  expect(body).toHaveProperty('pages');

  expect(Array.isArray(body.items)).toBe(true);
  expect(body.items.length).toBeLessThanOrEqual(2);
  expect(typeof body.total).toBe('number');
  expect(typeof body.pages).toBe('number');
});

test('Admin can create and delete product', async ({ request, baseURL }) => {
  const token = await getAdminToken(request, baseURL);

  const createPayload = {
    name: `API Test Product ${Date.now()}`,
    price: 123,
    stock: 3,
    unit: 'шт',
    sku: `api-test-${Date.now()}`,
    description: 'Created by Playwright API test',
    discount: 0,
    specs: { source: 'playwright' },
  };

  const create = await request.post(`${baseURL}/products`, {
    data: createPayload,
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(create.status()).toBe(201);
  const created = await create.json();
  expect(created && created._id).toBeTruthy();

  const del = await request.delete(`${baseURL}/products/${created._id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(del.status()).toBe(200);
  const delBody = await del.json();
  expect(delBody.ok).toBe(true);
});
