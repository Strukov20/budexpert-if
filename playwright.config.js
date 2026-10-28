import { defineConfig } from '@playwright/test';

// Обов'язково з кінцевим "/" — інакше відносні шляхи, що починаються з "/"
// (напр. request.get('/products')) скидають "/api" при резолюції проти baseURL
// (new URL('/products', 'http://x/api') === 'http://x/products', а не '.../api/products').
const apiUrl = process.env.PW_API_URL || 'http://127.0.0.1:5001/api/';

function assertNotProd(urlStr) {
  const url = new URL(urlStr);
  const host = url.hostname;

  const deny = (process.env.DENY_PROD_HOSTS || 'budexpert-if-api.onrender.com')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allow = (process.env.ALLOWED_TEST_HOSTS || '127.0.0.1,localhost')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (deny.includes(host)) {
    throw new Error(`[SAFETY] Refusing to run tests against PROD host: ${host}`);
  }
  if (allow.length && !allow.includes(host)) {
    throw new Error(`[SAFETY] Host is not in ALLOWED_TEST_HOSTS: ${host}`);
  }
}

assertNotProd(apiUrl);

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? 'html' : 'list',
  use: {
    baseURL: apiUrl,
  },
  webServer: {
    command: 'node server/index.js',
    url: 'http://127.0.0.1:5001/api/products',
    // У CI завжди піднімати свіжий процес — reuse чужого/застряглого сервера
    // на порту вже раз коштував години діагностики локально.
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      PORT: '5001',
      PUBLIC_BASE_URL: 'http://127.0.0.1:5001',
      NOVA_POSHTA_API_KEY: '',
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
      TEST_ENV: 'test',
      MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/budexpert_test',
      ADMIN_USER: process.env.ADMIN_USER || 'admin',
      ADMIN_PASS: process.env.ADMIN_PASS || 'test-admin-password-2026',
      ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || 'test-only-jwt-secret-with-at-least-32-characters',
    },
  },
  projects: [
    { name: 'ui', testMatch: /.*\.ui\.spec\.js/, use: { baseURL: 'http://127.0.0.1:5001', browserName: 'chromium' } },
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.js/,
    },
  ],
});
