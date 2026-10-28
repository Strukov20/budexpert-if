// Спільні хелпери для API-тестів. baseURL з playwright.config.js вже вказує на /api,
// тож усі шляхи тут відносні (без /api).

export async function getAdminToken(request) {
  const res = await request.post('auth/login', {
    data: {
      username: process.env.ADMIN_USER || 'admin',
      password: process.env.ADMIN_PASS || 'test-admin-password-2026',
    },
  });
  if (!res.ok()) {
    throw new Error(`Не вдалося залогінитись як admin: ${res.status()}`);
  }
  const body = await res.json();
  return body.token;
}

export function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

// Унікальний суфікс для тестових даних, щоб паралельні/повторні запуски не конфліктували
// і щоб легко відрізнити тестові записи від реальних (seed) даних.
export function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
