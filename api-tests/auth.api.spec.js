import { test, expect } from '@playwright/test';

test('POST /auth/login returns token for admin', async ({ request, baseURL }) => {
  const r = await request.post(`${baseURL}/auth/login`, {
    data: { username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || 'admin123' },
  });
  expect(r.status()).toBe(200);
  const body = await r.json();
  expect(typeof body.token).toBe('string');
  expect(body.token.length).toBeGreaterThan(10);
});
