import { test, expect } from '@playwright/test';

const id = '6a51cf914dd60f7dbe34a634';
const product = { _id: '507f1f77bcf86cd799439011', name: 'Клей-герметик FIX ALL Flexi чорний 290мл', price: 348, discount: 0 };
const original = { _id: id, customerName: 'Тестовий покупець', phone: '+380991234567', address: 'Самовивіз', status: 'new', createdAt: '2026-07-11T05:07:29.451Z', subtotalPrice: 6644, discountAmount: 0, totalPrice: 6644, items: [{ productId: product, quantity: 22 }] };
for (const scenario of ['legacy', 'snapshot', 'unknown', 'inconsistent']) {
  test(`admin order history: ${scenario}`, async ({ page, context, request }) => {
    const base = new URL(test.info().project.use.baseURL).origin;
    const response = await request.post('/api/auth/login', { data: { username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || 'test-admin-password-2026' } });
    expect(response.status()).toBe(200);
    const { token } = await response.json();
    const order = structuredClone(original);
    if (scenario === 'snapshot') Object.assign(order.items[0], { unitPrice: 302, name: 'Історична назва' });
    if (scenario === 'unknown') order.items.push({ productId: { ...product, _id: '507f1f77bcf86cd799439012' }, quantity: 1 });
    if (scenario === 'inconsistent') order.items[0].unitPrice = 348;
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== base) return route.abort();
      if (url.pathname === '/api/orders' && route.request().method() === 'GET') return route.fulfill({ json: [order] });
      return route.continue();
    });
    await context.addInitScript(({ token, base }) => { if (window.top === window && location.origin === base) localStorage.setItem('admin_token', token); }, { token, base });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin');
    await page.getByTestId(`admin-order-${id}-details`).click();
    const modal = page.getByTestId('admin-order-details');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('admin-order-details-total')).toHaveText('Разом: 6644.00 ₴');
    await expect(modal).not.toContainText('−0.00');
    if (scenario === 'unknown') {
      await expect(page.getByTestId('admin-order-details-item-0-price')).toHaveText('—');
      await expect(page.getByTestId('admin-order-price-unknown')).toBeVisible();
    } else if (scenario === 'inconsistent') {
      await expect(page.getByTestId('admin-order-details-item-0-price')).toHaveText('348.00 ₴');
      await expect(page.getByTestId('admin-order-totals-mismatch')).toBeVisible();
    } else {
      await expect(page.getByTestId('admin-order-details-item-0-price')).toHaveText('302.00 ₴');
      await expect(page.getByTestId('admin-order-details-item-0-sum')).toHaveText('6644.00 ₴');
      await expect(page.getByTestId('admin-order-price-recovered')).toHaveCount(scenario === 'legacy' ? 1 : 0);
      await expect(page.getByTestId('admin-order-totals-mismatch')).toHaveCount(0);
    }
  });
}
