import { test, expect } from '@playwright/test';
import { getAdminToken, authHeaders } from './helpers.js';

let token;

test.beforeAll(async ({ request }) => {
  token = await getAdminToken(request);
});

test.describe('GET /promos (admin only)', () => {
  test('без токена -> 401', async ({ request }) => {
    const res = await request.get('promos');
    expect(res.status()).toBe(401);
  });

  test('з токеном повертає список промокодів, включно з SOCIAL5', async ({ request }) => {
    const res = await request.get('promos', { headers: authHeaders(token) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some(p => p.code === 'SOCIAL5')).toBe(true);
  });
});
