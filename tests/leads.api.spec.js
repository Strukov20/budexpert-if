import { test, expect } from '@playwright/test';
import { getAdminToken, authHeaders } from './helpers.js';

let token;
const createdLeadIds = [];

test.beforeAll(async ({ request }) => {
  token = await getAdminToken(request);
});

test.afterAll(async ({ request }) => {
  for (const id of createdLeadIds) {
    await request.delete(`leads/${id}`, { headers: authHeaders(token) }).catch(() => {});
  }
});

test.describe('POST /leads (публічний, з rate limit)', () => {
  test('невалідний телефон -> 400', async ({ request }) => {
    const res = await request.post('leads', {
      data: { type: 'call', name: 'Тест', phone: '123' },
    });
    expect(res.status()).toBe(400);
  });

  test('без імені -> 400', async ({ request }) => {
    const res = await request.post('leads', {
      data: { type: 'call', phone: '0991234567' },
    });
    expect(res.status()).toBe(400);
  });

  test('валідна заявка на дзвінок -> 200/201, статус new', async ({ request }) => {
    const res = await request.post('leads', {
      data: { type: 'call', name: 'Тест Заявка', phone: '0991234567' },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    createdLeadIds.push(body._id);
    expect(body.status).toBe('new');
    expect(body.phone).toBe('+380991234567');
  });

  test('заявка на доставку без міста/вулиці -> 400', async ({ request }) => {
    const res = await request.post('leads', {
      data: { type: 'delivery', name: 'Тест', phone: '0991234568' },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('GET /leads (admin only) — РЕГРЕСІЯ: раніше був публічним, витік PII клієнтів', () => {
  test('без токена -> 401 (критично!)', async ({ request }) => {
    const res = await request.get('leads');
    expect(res.status()).toBe(401);
  });

  test('з токеном повертає список, що містить створену заявку', async ({ request }) => {
    const res = await request.get('leads', { headers: authHeaders(token) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const list = Array.isArray(body) ? body : body.items;
    expect(list.some(l => createdLeadIds.includes(l._id))).toBe(true);
  });
});

test.describe('PUT /leads/:id (admin only) — РЕГРЕСІЯ: раніше був публічним', () => {
  test('без токена -> 401 (критично!)', async ({ request }) => {
    const res = await request.put(`leads/${createdLeadIds[0]}`, { data: { status: 'done' } });
    expect(res.status()).toBe(401);
  });

  test('невалідний статус -> 400', async ({ request }) => {
    const res = await request.put(`leads/${createdLeadIds[0]}`, {
      headers: authHeaders(token),
      data: { status: 'not-a-real-status' },
    });
    expect(res.status()).toBe(400);
  });

  test('з токеном оновлює статус', async ({ request }) => {
    const res = await request.put(`leads/${createdLeadIds[0]}`, {
      headers: authHeaders(token),
      data: { status: 'in_progress' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('in_progress');
  });
});

test.describe('DELETE /leads/:id (admin only)', () => {
  test('без токена -> 401', async ({ request }) => {
    const res = await request.delete(`leads/${createdLeadIds[0]}`);
    expect(res.status()).toBe(401);
  });

  test('з токеном видаляє заявку', async ({ request }) => {
    const res = await request.delete(`leads/${createdLeadIds[0]}`, { headers: authHeaders(token) });
    expect(res.status()).toBe(200);
    createdLeadIds.shift();
  });
});
