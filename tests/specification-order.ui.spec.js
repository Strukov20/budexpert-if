import { test, expect } from '@playwright/test';

for (const width of [390, 1280]) {
  test(`specifications drag, save and reopen in order at ${width}px`, async ({ page, request, context }) => {
    const login = await request.post('/api/auth/login', { data: {
      username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || 'test-admin-password-2026',
    } });
    expect(login.ok()).toBeTruthy();
    const { token } = await login.json();
    const headers = { Authorization: `Bearer ${token}` };
    const created = await request.post('/api/products', { headers, data: {
      name: `Перевірка порядку ${width} ${Date.now()}`, price: 100,
      specs: { 'Тип матеріалу': 'Клей', 'Основа': 'Цементна', 'Бренд': 'Siltek' },
    } });
    expect(created.ok()).toBeTruthy();
    const product = await created.json();
    try {
      await context.addInitScript(token => localStorage.setItem('admin_token', token), token);
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('/admin');
      await page.getByTestId('admin-products-open-list').click();
      await page.getByTestId(`admin-product-${product._id}-edit`).click();
      const editor = page.getByTestId('admin-product-edit');
      const keys = editor.locator('[data-spec-row-id] input[placeholder="Ключ"]');
      const brand = editor.getByRole('button', { name: 'Перетягнути характеристику «Бренд»', exact: true });
      await brand.scrollIntoViewIfNeeded();
      const start = await brand.boundingBox();
      const first = await keys.first().boundingBox();
      const x = start.x + start.width / 2;
      if (width === 390) {
        const touch = await context.newCDPSession(page);
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: start.y + start.height / 2 }] });
        for (let step = 1; step <= 12; step++) {
          const y = start.y + start.height / 2 + (first.y - start.y - start.height / 2 + 5) * step / 12;
          await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
        }
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await touch.detach();
      } else {
        await page.mouse.move(x, start.y + start.height / 2);
        await page.mouse.down();
        await page.mouse.move(x, first.y + 5, { steps: 12 });
        await page.mouse.up();
      }
      await expect(keys.first()).toHaveValue('Бренд');
      await expect(editor.getByRole('status')).toContainText('позиція 1 з 3');
      await brand.focus();
      await page.keyboard.press('ArrowDown');
      await expect(keys.nth(1)).toHaveValue('Бренд');
      await page.keyboard.press('ArrowUp');
      await expect(keys.first()).toHaveValue('Бренд');
      await expect(editor.locator('textarea').last()).toHaveValue('Бренд: Siltek;\nТип матеріалу: Клей;\nОснова: Цементна;');
      await expect(editor.locator('[data-spec-row-id] input[placeholder="Значення"]').first()).toHaveValue('Siltek');
      await editor.screenshot({ path: test.info().outputPath(`specifications-${width}.png`) });
      expect(await editor.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await page.getByTestId('admin-product-edit-save').click();
      await expect(editor).toBeHidden();
      const saved = await (await request.get(`/api/products/${product._id}`)).json();
      expect(Object.keys(saved.specs)).toEqual(['Бренд', 'Тип матеріалу', 'Основа']);
      await page.reload();
      await page.getByTestId('admin-products-open-list').click();
      await page.getByTestId(`admin-product-${product._id}-edit`).click();
      await expect(keys.first()).toHaveValue('Бренд');
      await page.goto(`/p/${product.slug || product._id}`);
      await page.getByTestId('product-page-tab-specs').click();
      await expect(page.locator('tbody tr').first()).toContainText('Бренд');
    } finally {
      await request.delete(`/api/products/${product._id}`, { headers });
    }
  });
}
