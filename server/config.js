import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('.env', import.meta.url)), quiet: true });

export const isTestMode = process.env.NODE_ENV === 'test' || process.env.TEST_ENV === 'test';

export function assertTestDatabase(uri) {
  // Tests and seed scripts must never connect to a production/remote database.
  if (!/^mongodb:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/budexpert_test(?:\?|$)/.test(uri)) {
    throw new Error('Tests require a local mongodb://127.0.0.1:<port>/budexpert_test database');
  }
}

export function validateConfig() {
  const missing = ['MONGO_URI', 'ADMIN_USER', 'ADMIN_PASS', 'ADMIN_JWT_SECRET'].filter(k => !process.env[k]?.trim());
  if (missing.length) throw new Error(`Missing configuration: ${missing.join(', ')}`);
  if (process.env.ADMIN_PASS.length < 12 || ['admin123', 'password1234'].includes(process.env.ADMIN_PASS)) {
    throw new Error('ADMIN_PASS must be a unique password of at least 12 characters');
  }
  if (process.env.ADMIN_JWT_SECRET.length < 32 || process.env.ADMIN_JWT_SECRET === 'dev-admin-secret') {
    throw new Error('ADMIN_JWT_SECRET must contain at least 32 random characters');
  }
  if (isTestMode) assertTestDatabase(process.env.MONGO_URI);
  const base = process.env.PUBLIC_BASE_URL;
  if (process.env.NODE_ENV === 'production' && !base) throw new Error('PUBLIC_BASE_URL is required in production');
  if (base) {
    const url = new URL(base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      throw new Error('PUBLIC_BASE_URL must be an HTTP(S) origin');
    }
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') throw new Error('PUBLIC_BASE_URL must use HTTPS in production');
  }
}

export function publicBaseUrl() {
  // Never use untrusted Host / X-Forwarded-Host headers in canonical URLs or feeds.
  return (process.env.PUBLIC_BASE_URL || 'http://localhost:5001').replace(/\/$/, '');
}
