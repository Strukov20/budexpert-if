import { test, expect } from '@playwright/test';

for (const width of [390, 1280]) {
  test(`slow JavaScript shows loader without a flash of server text at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let entered;
    const requested = new Promise(resolve => { entered = resolve; });
    await page.route('**/assets/index-*.js', async route => {
      entered();
      await gate;
      await route.continue();
    });
    const navigation = page.goto('/', { waitUntil: 'domcontentloaded' });
    await requested;
    try {
      await expect(page.getByRole('status', { name: 'Завантаження сторінки' })).toBeVisible();
      await expect(page.locator('[data-server-page]')).toBeHidden();
      await page.screenshot({ path: test.info().outputPath(`loading-${width}.png`) });
    } finally {
      release();
    }
    await navigation;
    await expect(page.locator('html')).not.toHaveClass(/app-booting/);
    await expect(page.locator('[data-server-page]')).toHaveCount(0);
    await expect(page.getByTestId('product-grid')).toBeVisible();
  });
}

test('server page remains visible with JavaScript disabled', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL + '/');
    await expect(page.locator('[data-server-page]')).toBeVisible();
    await expect(page.locator('[data-server-page] h1')).toBeVisible();
    await expect(page.locator('.app-loading')).toBeHidden();
  } finally {
    await context.close();
  }
});

test('failed app bundle restores the server page', async ({ page }) => {
  await page.route('**/assets/index-*.js', route => route.abort());
  await page.goto('/');
  await expect(page.locator('[data-server-page]')).toBeVisible();
  await expect(page.locator('.app-loading')).toBeHidden();
});

test('stalled app bundle reveals server content after the fallback timeout', async ({ page }) => {
  await page.clock.install();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/assets/index-*.js', async route => {
    await gate;
    await route.abort();
  });
  await page.goto('/', { waitUntil: 'commit' });
  try {
    await expect(page.locator('.app-loading')).toBeVisible();
    await page.clock.fastForward(8100);
    await expect(page.locator('[data-server-page]')).toBeVisible();
    await expect(page.locator('.app-loading')).toBeHidden();
  } finally {
    release();
  }
});
