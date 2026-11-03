import test from 'node:test';
import assert from 'node:assert/strict';
import { productSlugBase, productPath, isProductSlug } from '../shared/products.mjs';

test('product slugs transliterate Ukrainian, separate dimensions and bound length', () => {
  assert.equal(productSlugBase('Клей-герметик FIX ALL Flexi чорний 290мл'), 'kley-hermetyk-fix-all-flexi-chornyy-290ml');
  assert.equal(productSlugBase('Шуруп 5,0 × 35 (500)'), 'shurup-5-0-35-500');
  assert.equal(productSlugBase('!!!'), 'tovar');
  assert.ok(productSlugBase('a '.repeat(200)).length <= 100);
  assert.equal(productSlugBase('694005fcbbfdf2b4a685c94d'), 'tovar-694005fcbbfdf2b4a685c94d');
});
test('canonical paths prefer saved slugs and reject unsafe slug lookups', () => {
  assert.equal(productPath({ _id: 'id', slug: 'klej' }), '/p/klej');
  assert.equal(productPath({ _id: 'id' }), '/p/id');
  for (const slug of ['../x', '$ne', 'x/y', 'UPPER', 'x--y', 'x'.repeat(129)]) assert.equal(isProductSlug(slug), false);
  assert.equal(isProductSlug('kley-fix-all-2'), true);
});
