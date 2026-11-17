import { test, expect } from '@playwright/test';
import { getAdminToken, authHeaders, uniqueSuffix } from './helpers.js';

test('catalog puts available products first across pages, filters and server HTML', async ({ request }) => {
  const headers = authHeaders(await getAdminToken(request));
  const prefix = `Availability-${uniqueSuffix()}`;
  const categoryResponse = await request.post('categories', { headers, data: { name: prefix } });
  expect(categoryResponse.status()).toBe(201);
  const category = await categoryResponse.json();
  const products = [];
  try {
    // Newest is unavailable; 1 unit must not rank below an older item with 100 units.
    for (const stock of [100, 0, 1, 0]) {
      const response = await request.post('products', { headers, data: {
        name: `${prefix}-${products.length}`, price: 100, stock, category: category._id,
        productOfWeek: true,
      } });
      expect(response.status()).toBe(201);
      products.push(await response.json());
    }
    const expected = [products[2], products[0], products[3], products[1]].map(p => p._id);
    for (const filter of [{ q: prefix }, { category: category._id }, { q: prefix, productOfWeek: true }]) {
      const pages = [];
      for (const page of [1, 2]) {
        const response = await request.get('products', { params: { ...filter, page, limit: 2 } });
        expect(response.status()).toBe(200);
        const result = await response.json();
        expect(result.total).toBe(4);
        expect(result.pages).toBe(2);
        expect(result.items.every(p => !('_catalogAvailable' in p))).toBe(true);
        pages.push(...result.items.map(p => p._id));
      }
      expect(pages).toEqual(expected);
    }
    const legacy = await (await request.get('products', { params: { q: prefix } })).json();
    expect(legacy.map(p => p._id)).toEqual(expected);
    const html = await (await request.get(`/products?q=${encodeURIComponent(prefix)}`)).text();
    const positions = expected.map(id => html.indexOf(products.find(p => p._id === id).name));
    expect(positions.every(position => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    // Restocking moves an item back into the available group immediately.
    const restocked = products[3];
    expect((await request.put(`products/${restocked._id}`, { headers, data: { stock: 1 } })).ok()).toBe(true);
    const refreshed = await (await request.get('products', { params: { q: prefix } })).json();
    expect(refreshed.map(p => p._id)).toEqual([products[3]._id, products[2]._id, products[0]._id, products[1]._id]);
  } finally {
    for (const product of products) await request.delete(`products/${product._id}`, { headers });
    await request.delete(`categories/${category._id}`, { headers });
  }
});
