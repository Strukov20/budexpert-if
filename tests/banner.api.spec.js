import { test, expect } from '@playwright/test';
import { getAdminToken, authHeaders } from './helpers.js';

let token;

test.beforeAll(async ({ request }) => {
  token = await getAdminToken(request);
});

test('GET /banner (публічний) повертає {key, images}', async ({ request }) => {
  const res = await request.get('banner');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('key');
  expect(Array.isArray(body.images)).toBe(true);
});

test.describe('PUT /banner (admin only)', () => {
  test('без токена -> 401', async ({ request }) => {
    const res = await request.put('banner', { data: { images: [] } });
    expect(res.status()).toBe(401);
  });

  test('з токеном оновлює зображення банера і повертає їх назад', async ({ request }) => {
    const testImages = [{ url: 'https://example.com/test-banner.jpg', publicId: 'test-banner' }];
    const putRes = await request.put('banner', {
      headers: authHeaders(token),
      data: { key: 'test-suite', images: testImages },
    });
    expect(putRes.status()).toBe(200);
    const putBody = await putRes.json();
    expect(putBody.images).toHaveLength(1);
    expect(putBody.images[0].url).toBe(testImages[0].url);

    // прибираємо за собою
    await request.put('banner', { headers: authHeaders(token), data: { key: 'test-suite', images: [] } });
  });
});
