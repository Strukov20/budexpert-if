import { test, expect } from '@playwright/test';

// Легкі smoke-тести для допоміжних маршрутів. Зовнішні API (Nova Poshta, Nominatim)
// у тестовому середовищі свідомо не викликаємо по-справжньому (нема ключів/мережевих
// гарантій у CI) — перевіряємо тільки детерміновані гілки, які не йдуть у мережу.

test.describe('GET /geo/if/streets', () => {
  test('запит коротший за 4 символи -> порожній масив, без звернення до Nominatim', async ({ request }) => {
    const res = await request.get('geo/if/streets', { params: { q: 'аб' } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  test('латиниця -> порожній масив (свідомо відхиляється)', async ({ request }) => {
    const res = await request.get('geo/if/streets', { params: { q: 'street' } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

test.describe('GET /post/* (Nova Poshta) — без налаштованого API-ключа в тестовому середовищі', () => {
  test('GET /post/cities не падає з 500 без API-ключа (graceful error)', async ({ request }) => {
    const res = await request.get('post/cities', { params: { q: 'Київ' } });
    expect(res.status()).toBe(500);
    const body = await res.json();
    expect(typeof body.message).toBe('string');
  });

  test('GET /post/offices без cityRef -> 400', async ({ request }) => {
    const res = await request.get('post/offices');
    expect(res.status()).toBe(400);
  });
});

test('GET /google-shopping.xml (Google Merchant feed, поза /api) віддає валідний XML', async ({ request }) => {
  const res = await request.get('http://127.0.0.1:5001/google-shopping.xml');
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text.startsWith('<?xml')).toBe(true);
  expect(text).toContain('<rss');
});
