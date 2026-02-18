import { defineConfig, devices } from '@playwright/test';

const baseUrl = process.env.PW_BASE_URL || 'http://127.0.0.1:5173';

function assertNotProd(urlStr: string) {
  const url = new URL(urlStr);
  const host = url.hostname;

  const deny = (process.env.DENY_PROD_HOSTS || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  const allow = (process.env.ALLOWED_TEST_HOSTS || '127.0.0.1,localhost')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  if (deny.includes(host)) {
    throw new Error(`[SAFETY] Refusing to run UI tests against PROD host: ${host}`);
  }
  if (allow.length && !allow.includes(host)) {
    throw new Error(`[SAFETY] Host is not in ALLOWED_TEST_HOSTS: ${host}`);
  }
}

assertNotProd(baseUrl);

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: baseUrl,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
