import { test, expect } from '@playwright/test';

test.describe('POST /auth/login', () => {
  test('успішний логін повертає JWT токен', async ({ request }) => {
    const res = await request.post('auth/login', {
      data: {
        username: process.env.ADMIN_USER || 'admin',
        password: process.env.ADMIN_PASS || 'test-admin-password-2026',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(10);
  });

  test('невірний пароль -> 401', async ({ request }) => {
    const res = await request.post('auth/login', {
      data: { username: process.env.ADMIN_USER || 'admin', password: 'wrong-password' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.token).toBeUndefined();
  });

  test('невірний логін -> 401', async ({ request }) => {
    const res = await request.post('auth/login', {
      data: { username: 'not-admin', password: process.env.ADMIN_PASS || 'test-admin-password-2026' },
    });
    expect(res.status()).toBe(401);
  });

  test('порожнє тіло запиту -> 401 (не падає з 500)', async ({ request }) => {
    const res = await request.post('auth/login', { data: {} });
    expect(res.status()).toBe(401);
  });
});
