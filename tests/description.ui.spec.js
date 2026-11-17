import { test, expect } from '@playwright/test';

const id = '507f1f77bcf86cd799439011';
const description = 'Перший рядок\nДругий рядок\n\n**Переваги:**\n\n- Міцність\n- Морозостійкість\n\nПриготування суміші.\nДодайте воду.';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('admin_token', 'test-token'));
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const product = { _id: id, name: 'Тестова суміш', price: 100, stock: 5, description };
    let json = [];
    if (path === '/api/products') json = { items: [product], total: 1, page: 1, pages: 1 };
    else if (path === `/api/products/${id}`) json = product;
    else if (path === '/api/products/counts') json = {};
    else if (path === '/api/seo') json = { title: 'Тест', structuredData: [] };
    else if (path.includes('banner')) json = { images: [] };
    await route.fulfill({ json });
  });
});

async function checkDescription(container) {
  const firstParagraph = container.locator('p').first();
  await expect(firstParagraph).toHaveText('Перший рядок\nДругий рядок');
  await expect(firstParagraph).toHaveCSS('white-space', 'pre-wrap');
  await expect(container.locator('strong')).toHaveText('Переваги:');
  await expect(container.locator('ul > li')).toHaveCount(2);
  await expect(container.locator('ul')).toHaveCSS('list-style-type', 'disc');
  expect(await container.locator('ul').evaluate(el => parseFloat(getComputedStyle(el).paddingLeft))).toBeGreaterThan(0);
  expect(await container.locator('p').nth(1).evaluate(el => parseFloat(getComputedStyle(el).marginTop))).toBeGreaterThan(0);
}

for (const width of [390, 1280]) {
  test(`product descriptions keep formatting at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/p/${id}`);
    await checkDescription(page.getByTestId('product-page-description'));
    await page.getByTestId('product-page-description-toggle').click();
    await expect(page.getByText('Додайте воду.', { exact: false }).last()).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`description-${width}.png`), fullPage: true });
    await page.goto('/');
    await page.getByTestId('product-grid').getByTestId(`product-card-${id}-quick-view`).click();
    await checkDescription(page.getByTestId(`product-quick-view-${id}`).locator('.product-description'));
  });

  test(`editor bold, preview and save preserve text at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/admin');
    await page.getByTestId('admin-products-open-list').click();
    await page.getByTestId(`admin-product-${id}-edit`).click();
    const editor = page.getByTestId('admin-product-edit');
    const field = editor.getByRole('textbox', { name: 'Опис товару', exact: true });
    await expect(field).toHaveValue(description);
    await field.evaluate(el => { el.focus(); el.setSelectionRange(0, 13); });
    await editor.getByRole('button', { name: 'Жирний', exact: true }).click();
    const updated = '**Перший рядок**' + description.slice(12);
    await expect(field).toHaveValue(updated);
    await editor.getByRole('button', { name: 'Попередній перегляд', exact: true }).click();
    await expect(editor.locator('.product-description strong').first()).toHaveText('Перший рядок');
    await editor.screenshot({ path: test.info().outputPath(`editor-preview-${width}.png`) });
    await editor.getByRole('button', { name: 'Редагувати', exact: true }).click();
    await expect(field).toHaveValue(updated);
    const saved = page.waitForRequest(request => request.method() === 'PUT' && request.url().endsWith(`/api/products/${id}`));
    await page.getByTestId('admin-product-edit-save').click();
    expect((await saved).postDataJSON().description).toBe(updated);
  });
}
