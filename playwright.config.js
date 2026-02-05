import { defineConfig } from '@playwright/test';

const apiUrl = process.env.PW_API_URL || 'http://127.0.0.1:5001/api';

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
  use: {
    baseURL: apiUrl,
  },
  webServer: {
    command: 'node server/index.js',
    url: 'http://127.0.0.1:5001/api/products',
    reuseExistingServer: true,
    timeout: 60_000,
    env: {
      PORT: '5001',
      TEST_ENV: 'test',
      MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/budexpert_test',
      ADMIN_USER: process.env.ADMIN_USER || 'admin',
      ADMIN_PASS: process.env.ADMIN_PASS || 'admin123',
      ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || 'dev-admin-secret',
    },
  },
  projects: [
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.js/,
    },
  ],
});
