import { test, expect } from '@playwright/test';

const products = [
  { _id: 'photo-a', name: 'З фото', stock: 1, image: '/logo.png' },
  { _id: 'gallery-b', name: 'Галерея', stock: 1, images: [{ url: '/logo.png' }] },
  { _id: 'empty-c', name: 'Без фото', stock: 1 },
  { _id: 'absent-d', name: 'Відсутній з фото', stock: 0, image: '/logo.png' },
  { _id: 'absent-e', name: 'Відсутній без фото', stock: 0 },
].map(product => ({ ...product, price: 10 }));

for (const width of [390, 1280]) {
  test(`random products prioritize photos and availability at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => { Math.random = () => 0; });
    const queries = [];
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url());
      let json = [];
      if (url.pathname === '/api/products') {
        queries.push(Object.fromEntries(url.searchParams));
        json = { items: products, total: products.length, pages: 1 };
      } else if (url.pathname === '/api/seo') json = { title: 'Каталог', structuredData: [] };
      else if (url.pathname.includes('banner')) json = { images: [] };
      return route.fulfill({ json });
    });
    await page.goto('/products');
    const cards = page.getByTestId('products-search-grid').locator(':scope > [data-testid]');
    await expect(cards).toHaveCount(5);
    expect(queries.at(-1).photosFirst).toBe('true');
    expect(await cards.evaluateAll(nodes => nodes.map(node => node.dataset.testid))).toEqual([
      'product-card-gallery-b', 'product-card-photo-a', 'product-card-empty-c', 'product-card-absent-d', 'product-card-absent-e',
    ]);
    await page.goto('/products?q=фото');
    await expect(cards).toHaveCount(5);
    expect(queries.at(-1).photosFirst).toBeUndefined();
    expect(await cards.first().getAttribute('data-testid')).toBe('product-card-photo-a');
  });
}
