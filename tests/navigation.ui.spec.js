import { test, expect } from '@playwright/test';
import { authHeaders, getAdminToken, uniqueSuffix } from './helpers.js';

// Tests use only the isolated local database/server configured in playwright.config.js.
// Prevent analytics, maps and remote images from leaving the test environment.
test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => {
    if (new URL(route.request().url()).hostname === '127.0.0.1') return route.continue();
    return route.abort();
  });
});
test('public navigation updates metadata and handles unknown category URLs', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Будматеріали');
  await expect(page.getByTestId('product-grid')).toContainText('Seed Product');
  expect(await page.locator('script[src*="AdminPanel"]').count()).toBe(0);
  await page.getByRole('link', { name: 'Контакти', exact: true }).first().click();
  await expect(page).toHaveTitle(/Контакти/);
  const product = (await (await page.request.get('/api/products?q=Seed%20Product%202')).json())[0];
  await page.goto(`/p/${product._id}`);
  await expect(page.getByTestId('product-page-title')).toHaveText('Seed Product 2');
  await expect(page).toHaveTitle('Seed Product 2 — купити в БудЕксперт');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `http://127.0.0.1:5001/p/${product._id}`);
  await expect(page.getByTestId('product-page')).toContainText('237.50');
  await page.getByTestId('product-page-add-to-cart').click();
  await page.getByTestId('product-page-go-to-cart').click();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.getByTestId(`cart-item-${product._id}-sum`)).toHaveText('237.50 ₴');
  const response = await page.goto('/unknown-category-for-audit');
  expect(response.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Сторінку не знайдено' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  expect(errors).toEqual([]);
});
test('admin lazy route still supports login and product management', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByPlaceholder('Логін').fill(process.env.ADMIN_USER || 'admin');
  await page.getByPlaceholder('Пароль').fill(process.env.ADMIN_PASS || 'test-admin-password-2026');
  await page.getByRole('button', { name: 'Увійти' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole('button', { name: 'Всі товари', exact: true }).click();
  await expect(page.getByText('Seed Product 1', { exact: true }).first()).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
});
test('mobile catalog renders and preserves product links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByTestId('product-grid')).toContainText('Seed Product');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.screenshot({ path: 'test-results/mobile-catalog.png', fullPage: true });
});

test('desktop pages and mobile infinite loading request bounded catalog pages', async ({ page, request }) => {
  const auth = await getAdminToken({ post: (url, options) => request.post('/api/' + url, options) });
  const suffix = uniqueSuffix();
  const term = `UI Pagination ${suffix}`;
  const docs = Array.from({ length: 25 }, (_, i) => ({ name: `${term} ${i}`, sku: `ui-${suffix}-${i}`, price: 10, stock: 1 }));
  await request.post('/api/products/bulk', { headers: authHeaders(auth), data: docs });
  try {
    const grid = page.getByTestId('product-grid');
    const cards = grid.locator(':scope > [data-testid^="product-card-"]');
    await page.goto('/?q=' + encodeURIComponent(term));
    await expect(grid).toContainText(term);
    await expect(cards).toHaveCount(12);
    const first = await cards.first().getAttribute('data-testid');
    await page.getByRole('link', { name: '2', exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(cards).toHaveCount(12);
    await expect(cards.first()).not.toHaveAttribute('data-testid', first);
    await page.reload();
    await expect(cards).toHaveCount(12);
    await expect(grid).toContainText(term);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?q=' + encodeURIComponent(term));
    await expect(grid).toContainText(term);
    await expect(cards).toHaveCount(12);
    await page.getByTestId('catalog-sentinel').scrollIntoViewIfNeeded();
    await expect(cards).toHaveCount(24);
  } finally {
    const list = await (await request.get('/api/products', { params: { q: term, page: 1, limit: 100 } })).json();
    for (const product of list.items) await request.delete(`/api/products/${product._id}`, { headers: authHeaders(auth) });
  }
});
