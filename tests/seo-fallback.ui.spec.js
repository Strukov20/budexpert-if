import { test, expect } from '@playwright/test';

for (const response of [
  { name: 'HTML fallback with HTTP 200', status: 200, contentType: 'text/html', body: '<!doctype html><title>Shop</title>' },
  { name: 'missing endpoint with HTTP 404', status: 404, json: { message: 'Not found' } },
  { name: 'missing title', status: 200, json: { canonical: 'https://example.com/contacts' } },
  { name: 'literal undefined title', status: 200, json: { title: 'undefined', canonical: 'https://example.com/contacts' } },
]) {
  test(`route titles survive ${response.name}`, async ({ page }) => {
    const { name, ...reply } = response;
    await page.route('**/api/seo?*', route => route.fulfill(reply));
    await page.goto('/contacts');
    await expect(page).toHaveTitle('Контакти — БудЕксперт, Івано-Франківськ');
    await page.getByRole('link', { name: 'Оплата', exact: true }).first().click();
    await expect(page).toHaveTitle('Оплата та отримання замовлення — БудЕксперт');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Оплата та отримання замовлення — БудЕксперт');
  });
}

test('valid server metadata still updates the title', async ({ page }) => {
  await page.route('**/api/seo?*', route => route.fulfill({ json: {
    title: 'Заголовок із сервера — БудЕксперт', canonical: 'http://localhost:5001/contacts',
    description: 'Контакти магазину', structuredData: [],
  } }));
  await page.goto('/contacts');
  await expect(page).toHaveTitle('Заголовок із сервера — БудЕксперт');
});
