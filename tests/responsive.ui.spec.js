import { test, expect } from '@playwright/test';

const viewports = [
  { width: 320, height: 568 }, { width: 390, height: 844 },
  { width: 640, height: 960 }, { width: 768, height: 1024 },
  { width: 820, height: 1180 }, { width: 1024, height: 768 },
  { width: 1440, height: 900 }, { width: 1920, height: 1080 },
  { width: 844, height: 390 },
];
async function withinViewport(locator, viewport) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}
for (const viewport of viewports) {
  test(`storefront fits ${viewport.width}×${viewport.height}, including cart and overlays`, async ({ page, context, request }) => {
    test.setTimeout(60_000);
    const base = new URL(test.info().project.use.baseURL).origin;
    const data = await (await request.get('/api/products?page=1&limit=10')).json();
    const product = data.items.find(product => product.discount > 0) || data.items[0];
    expect(product).toBeTruthy();
    await page.setViewportSize(viewport);
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    await context.addInitScript(({ product, base }) => {
      if (window.top !== window || location.origin !== base) return;
      localStorage.setItem('cart', JSON.stringify([{ ...product, quantity: 12,
        name: 'Професійна будівельна суміш для внутрішніх та зовнішніх робіт — велике пакування',
        description: 'Детальний опис будівельного матеріалу. '.repeat(80),
        price: 12345.67, discount: 25, sku: 'VERY-LONG-SKU-123456789012345678901234567890',
      }]));
    }, { product, base });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['/', '/products', `/p/${product._id}`, '/cart', '/checkout', '/services', '/about', '/contacts', '/payment', '/returns', '/admin/login']) {
      await test.step(route, async () => {
        await page.goto(route);
        await expect(page.locator('main').getByRole('heading').first()).toBeVisible();
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
        if (!route.startsWith('/admin')) {
          const input = page.locator('[data-testid="search-input"]:visible');
          await withinViewport(input, viewport);
          expect((await input.boundingBox()).width).toBeGreaterThan(100);
        }
      });
    }
    await page.goto('/cart');
    const row = page.getByTestId(`cart-item-${product._id}`);
    await expect(row.locator('s')).toHaveText('148148.04 ₴');
    await expect(page.getByTestId(`cart-item-${product._id}-sum`)).toHaveText('111111.00 ₴');
    await page.getByTestId(`cart-item-${product._id}-open`).click();
    await withinViewport(page.getByTestId('cart-item-modal'), viewport);
    await page.getByTestId('cart-item-modal-close').click();
    await page.goto('/');
    const input = page.locator('[data-testid="search-input"]:visible');
    await input.fill('Seed');
    await expect(page.getByTestId('search-suggestions')).toHaveCount(1);
    await expect(page.getByTestId('search-suggestions')).toContainText('Seed Product');
    await withinViewport(page.getByTestId('search-suggestions'), viewport);
    await input.fill('');
    await page.getByTestId(`product-card-${product._id}-quick-view`).click();
    await withinViewport(page.getByTestId(`product-quick-view-${product._id}`), viewport);
    await page.getByTestId(`product-quick-view-${product._id}-close`).click();
    if (viewport.width >= 1024) {
      await page.getByTestId('header-cart').hover();
      await withinViewport(page.getByTestId('header-mini-cart'), viewport);
      await page.getByTestId('header-call-me-open').click();
      await withinViewport(page.getByTestId('call-modal'), viewport);
      await page.getByTestId('call-modal-close').click();
    }
    await page.goto('/checkout');
    await page.getByTestId('checkout-method-pickup').click();
    await page.getByTestId('checkout-method-post').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
    expect(errors).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`checkout-${viewport.width}.png`), fullPage: true });
  });
}

for (const viewport of [{ width: 320, height: 568 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1440, height: 900 }, { width: 844, height: 390 }]) {
  test(`admin filters and product editor fit ${viewport.width}×${viewport.height}`, async ({ page, context, request }) => {
    const base = new URL(test.info().project.use.baseURL).origin;
    const login = await request.post('/api/auth/login', { data: { username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || 'test-admin-password-2026' } });
    expect(login.status()).toBe(200);
    const { token } = await login.json();
    await page.setViewportSize(viewport);
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    await context.addInitScript(({ token, base }) => { if (window.top === window && location.origin === base) localStorage.setItem('admin_token', token); }, { token, base });
    await page.goto('/admin');
    await expect(page.getByTestId('admin-leads-filters')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
    await page.getByTestId('admin-products-open-list').click();
    await withinViewport(page.getByTestId('admin-products-list'), viewport);
    await page.locator('[data-testid^="admin-product-"][data-testid$="-edit"]').first().click();
    const editor = page.getByTestId('admin-product-edit');
    await withinViewport(editor, viewport);
    expect(await editor.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    await page.getByTestId('admin-product-edit-close').click();
  });
}
