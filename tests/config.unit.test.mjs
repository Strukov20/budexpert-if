import test from 'node:test';
import assert from 'node:assert/strict';
import { assertTestDatabase, validateConfig } from '../server/config.js';
import { priceInKopiykas } from '../shared/pricing.mjs';

test('test database guard rejects remote and non-test URIs', () => {
  for (const uri of ['mongodb+srv://example.com/budexpert_test', 'mongodb://example.com/budexpert_test', 'mongodb://127.0.0.1/production', 'mongodb://127.0.0.1/budexpert_test_other', 'mongodb://user:password@localhost/budexpert_test']) assert.throws(() => assertTestDatabase(uri));
  assert.doesNotThrow(() => assertTestDatabase('mongodb://127.0.0.1:27018/budexpert_test'));
});
test('missing/default admin secrets fail closed', () => {
  const previous = { ...process.env };
  try {
    delete process.env.ADMIN_USER;
    assert.throws(validateConfig);
    Object.assign(process.env, { ADMIN_USER: 'admin', ADMIN_PASS: 'admin123', ADMIN_JWT_SECRET: 'dev-admin-secret' });
    assert.throws(validateConfig);
  } finally { process.env = previous; }
});
test('prices round each discounted unit once in kopiykas', () => {
  assert.equal(priceInKopiykas({ price: 100.05, discount: 20 }), 8004);
  assert.equal(priceInKopiykas({ price: 1.01, discount: 50 }), 51);
  assert.throws(() => priceInKopiykas({ price: -1 }));
});
