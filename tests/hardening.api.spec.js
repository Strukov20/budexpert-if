import { test, expect } from '@playwright/test';
import { getAdminToken, authHeaders, uniqueSuffix } from './helpers.js';

let token;
let product;
let category;
const orderIds = [];
const site = 'http://127.0.0.1:5001';
test.beforeAll(async ({ request }) => {
  token = await getAdminToken(request);
  const categoryRes = await request.post('categories', { headers: authHeaders(token), data: { name: `Аудит ${uniqueSuffix()}` } });
  category = await categoryRes.json();
  const response = await request.post('products', { headers: authHeaders(token), data: {
    name: `Audit <product> ${uniqueSuffix()}`, price: 100.05, discount: 20, stock: 0, sku: `audit-${uniqueSuffix()}`, category: category._id,
    description: 'Опис товару <script>alert(1)</script>',
  } });
  expect(response.status()).toBe(201);
  product = await response.json();
});
test.afterAll(async ({ request }) => {
  for (const id of orderIds) await request.delete(`orders/${id}`, { headers: authHeaders(token) });
  if (product?._id) await request.delete(`products/${product._id}`, { headers: authHeaders(token) });
  if (category?._id) await request.delete(`categories/${category._id}`, { headers: authHeaders(token) });
});
const order = items => ({ customerName: 'Тестовий Покупець', phone: '0991234567', address: 'Самовивіз', items });

test('rejects empty, missing, unknown, fractional and negative order items', async ({ request }) => {
  for (const items of [[], undefined, [{ productId: '000000000000000000000000', quantity: 1 }], [{ productId: product._id, quantity: 1.5 }], [{ productId: product._id, quantity: -1 }], [{ productId: { $ne: null }, quantity: 1 }]]) {
    const response = await request.post('orders', { data: order(items) });
    expect(response.status()).toBe(400);
  }
});
test('stock=0 remains orderable; discounts, duplicate quantities and snapshots use database values', async ({ request }) => {
  const response = await request.post('orders', { data: { ...order([{ productId: product._id, quantity: 1, unitPrice: 0 }, { productId: product._id, quantity: 2 }]), totalPrice: 0, status: 'completed' } });
  expect(response.status()).toBe(201);
  const saved = await response.json();
  orderIds.push(saved._id);
  expect(saved.totalPrice).toBe(240.12);
  expect(saved.status).toBe('new');
  expect(saved.items).toHaveLength(1);
  expect(saved.items[0]).toMatchObject({ quantity: 3, unitPrice: 80.04, name: product.name, sku: product.sku });
});
test('invalid ids/filters/pagination return 400 and server stays alive', async ({ request }) => {
  for (const url of ['products/not-an-id', 'products?category=bad', 'products?limit=100000', 'products?page=-1', 'products?q[x]=a']) {
    expect((await request.get(url)).status()).toBe(400);
  }
  expect((await request.get('products')).status()).toBe(200);
});
test('product validation also applies to updates', async ({ request }) => {
  expect((await request.put(`products/${product._id}`, { headers: authHeaders(token), data: { price: -1 } })).status()).toBe(400);
  expect((await request.put(`products/${product._id}`, { headers: authHeaders(token), data: { discount: 150 } })).status()).toBe(400);
});
test('uploads reject disguised active documents without calling Cloudinary', async ({ request }) => {
  const response = await request.post('uploads', { headers: authHeaders(token), multipart: { file: { name: 'image.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('<html><script>alert(1)</script></html>') } } });
  expect(response.status()).toBe(400);
});
test('product HTML contains escaped content, metadata, structured data and a matching CSP nonce without JavaScript', async ({ request }) => {
  const response = await request.get(`${site}/p/${product._id}`);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('Audit &lt;product&gt;');
  expect(html).toContain(`<link rel="canonical" href="${site}/p/${product._id}">`);
  expect(html).toContain('"@type":"Product"');
  expect(html).toContain('"price":"80.04"');
  expect(html).toContain('https://schema.org/OutOfStock');
  expect(html).not.toContain('<script>alert(1)</script>');
  expect(html).toContain('<div id="root"><header>');
  const nonce = /<script nonce="([^"]+)"/.exec(html)[1];
  expect(response.headers()['content-security-policy']).toContain(`'nonce-${nonce}'`);
  expect(response.headers()['x-powered-by']).toBeUndefined();
});
test('legacy product URLs redirect permanently, unknown pages return real 404s', async ({ request }) => {
  const redirect = await request.get(`${site}/products/${product._id}`, { maxRedirects: 0 });
  expect(redirect.status()).toBe(301);
  expect(redirect.headers().location).toBe(`/p/${product._id}`);
  for (const url of ['/category-that-does-not-exist', '/p/000000000000000000000000', '/p/bad', '/unknown/child/leaf/deeper', '/sitemap-missing.xml']) {
    expect((await request.get(site + url)).status()).toBe(404);
  }
});
test('category query redirects to canonical path; category HTML has its own metadata', async ({ request }) => {
  const redirect = await request.get(`${site}/products?cat=${category._id}`, { maxRedirects: 0 });
  expect(redirect.status()).toBe(301);
  const page = await request.get(site + redirect.headers().location);
  expect(page.status()).toBe(200);
  expect(await page.text()).toContain(`${category.name} — купити`);
});
test('sitemaps and robots advertise canonical URLs, private pages are noindex', async ({ request }) => {
  const robots = await (await request.get(site + '/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${site}/sitemap.xml`);
  expect(robots).not.toMatch(/Disallow: \/api\/\s/);
  expect((await request.get('products')).headers()['x-robots-tag']).toContain('noindex');
  expect(await (await request.get(site + '/sitemap.xml')).text()).toContain('/sitemaps/products-1.xml');
  const products = await (await request.get(site + '/sitemaps/products-1.xml')).text();
  expect(products).toContain(`/p/${product._id}`);
  expect(products).not.toContain('/products/');
  const pages = await (await request.get(site + '/sitemaps/pages.xml')).text();
  expect(pages).not.toContain('/admin');
  expect(pages).not.toContain('/checkout');
  const cart = await request.get(site + '/cart');
  expect(cart.headers()['x-robots-tag']).toContain('noindex');
});
test('merchant feed uses original price and discounted sale price', async ({ request }) => {
  const feed = await (await request.get(site + '/google-shopping.xml')).text();
  const item = feed.split('<item>').find(item => item.includes(product.sku));
  expect(item).toContain('<g:price>100.05 UAH</g:price>');
  expect(item).toContain('<g:sale_price>80.04 UAH</g:sale_price>');
});
