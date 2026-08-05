import { test, expect } from '@playwright/test';
import { getAdminToken, authHeaders } from './helpers.js';

let token;

test.beforeAll(async ({ request }) => {
  token = await getAdminToken(request);
});

test.describe('POST /uploads (admin only) — РЕГРЕСІЯ: раніше був повністю відкритий', () => {
  test('без токена -> 401 (критично! раніше будь-хто міг вантажити файли)', async ({ request }) => {
    const res = await request.post('uploads', {
      multipart: { file: { name: 'x.png', mimeType: 'image/png', buffer: Buffer.from('fake') } },
    });
    expect(res.status()).toBe(401);
  });

  test('з токеном, але без файлу -> 400', async ({ request }) => {
    const res = await request.post('uploads', { headers: authHeaders(token) });
    expect(res.status()).toBe(400);
  });
});
