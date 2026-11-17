import { test, expect } from '@playwright/test';

test.use({ hasTouch: true });

const product = { _id: '507f1f77bcf86cd799439012', name: 'Мобільна тестова суміш', price: 1780, stock: 5 };
for (const width of [320, 390]) {
  test(`mobile catalog shows live cart quantity and preserves it at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname;
      let json = [];
      if (path === '/api/products') json = { items: [product], total: 1, page: 1, pages: 1 };
      else if (path === '/api/products/counts') json = {};
      else if (path.includes('banner')) json = { images: [] };
      else if (path === '/api/seo') json = { title: 'Тест', structuredData: [] };
      return route.fulfill({ json });
    });
    await page.goto('/');
    const card = page.getByTestId('product-grid').getByTestId(`product-card-${product._id}`);
    const add = card.getByTestId(`product-card-${product._id}-add-mobile`);
    const quantity = card.getByTestId(`product-card-${product._id}-qty-mobile`);
    await expect(quantity).toHaveCount(0);
    for (const count of [1, 2, 3]) {
      await add.tap();
      await expect(quantity).toBeVisible();
      await expect(quantity).toHaveText(String(count));
      await expect(add).toHaveText('+');
      await expect(card.getByTestId(`product-card-${product._id}-description-hint`)).toBeHidden();
      await expect(page.getByTestId('week-products-row').getByTestId(`product-card-${product._id}-qty-mobile`)).toHaveText(String(count));
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    const toast = page.getByTestId('cart-toast');
    await expect(toast).toContainText('Додано в кошик');
    expect((await toast.boundingBox()).y).toBeGreaterThan(844 / 2);
    await expect(toast).toHaveCount(0, { timeout: 4000 });
    await expect(quantity).toHaveText('3');
    await card.screenshot({ path: test.info().outputPath(`cart-quantity-${width}.png`) });
    await page.goto('/cart');
    const cartQuantity = page.getByTestId(`cart-item-${product._id}-qty`);
    await expect(cartQuantity).toHaveText('3');
    await page.getByTestId(`cart-item-${product._id}-dec`).tap();
    await page.goto('/');
    await expect(quantity).toHaveText('2');
    await page.reload();
    await expect(quantity).toHaveText('2');
  });
}
