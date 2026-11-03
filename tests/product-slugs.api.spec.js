import { test, expect } from '@playwright/test';
import { getAdminToken, authHeaders, uniqueSuffix } from './helpers.js';

let headers;
const ids = [];
const site = 'http://127.0.0.1:5001';
test.beforeAll(async ({ request }) => { headers = authHeaders(await getAdminToken(request)); });
test.afterAll(async ({ request }) => { for (const id of ids) await request.delete(`products/${id}`, { headers }); });

async function create(request, name, extra = {}) {
  const response = await request.post('products', { headers, data: { name, price: 100, stock: 0, ...extra } });
  expect(response.status()).toBe(201);
  const product = await response.json();
  ids.push(product._id);
  return product;
}

test('readable URL resolves through API and HTML; both old paths redirect directly', async ({ request }) => {
  const p = await create(request, `Клей-герметик FIX ALL ${uniqueSuffix()}`);
  expect(p.slug).toMatch(/^kley-hermetyk-fix-all-/);
  expect((await (await request.get(`products/by-slug/${p.slug}`)).json())._id).toBe(p._id);
  for (const oldPath of [`/p/${p._id}`, `/products/${p._id}`]) {
    const r = await request.get(site + oldPath, { maxRedirects: 0 });
    expect(r.status()).toBe(301);
    expect(r.headers().location).toBe(`/p/${p.slug}`);
  }
  const html = await (await request.get(`${site}/p/${p.slug}`)).text();
  expect(html).toContain(`<link rel="canonical" href="${site}/p/${p.slug}">`);
  expect(html).toContain('"@type":"Product"');
  expect((await (await request.get(`seo?path=/p/${p._id}`)).json()).redirect).toBe(`/p/${p.slug}`);
  const sitemap = await (await request.get(site + '/sitemaps/products-1.xml')).text();
  expect(sitemap).toContain(`/p/${p.slug}</loc>`);
  const feed = await (await request.get(site + '/google-shopping.xml')).text();
  expect(feed).toContain(`${site}/p/${p.slug}`);
});

test('concurrent transliteration collisions receive distinct slugs', async ({ request }) => {
  const suffix = uniqueSuffix();
  const products = await Promise.all([
    create(request, `Тест ${suffix}`), create(request, `Test ${suffix}`),
    create(request, `Test (${suffix})`),
  ]);
  expect(new Set(products.map(p => p.slug)).size).toBe(3);
  for (const p of products) expect((await (await request.get(`products/by-slug/${p.slug}`)).json())._id).toBe(p._id);
});

test('renaming and bulk SKU updates preserve the saved address', async ({ request }) => {
  const suffix = uniqueSuffix();
  const p = await create(request, `Стала адреса ${suffix}`, { sku: `slug-${suffix}` });
  const updated = await (await request.put(`products/${p._id}`, { headers, data: { name: `Нова назва ${suffix}`, slug: 'tampered' } })).json();
  expect(updated.slug).toBe(p.slug);
  expect((await request.post('products/bulk', { headers, data: [{ name: `Імпорт ${suffix}`, sku: p.sku, price: 123 }] })).status()).toBe(200);
  expect((await (await request.get(`products/${p._id}`)).json()).slug).toBe(p.slug);
});

test('startup backfills legacy seed products and rejects unknown slugs', async ({ request }) => {
  const products = await (await request.get('products?q=Seed%20Product')).json();
  expect(products.length).toBeGreaterThan(0);
  for (const p of products) expect(p.slug).toMatch(/^seed-product-/);
  expect((await request.get('products/by-slug/unknown-product-slug')).status()).toBe(404);
  expect((await request.get(site + '/p/unknown-product-slug')).status()).toBe(404);
});
