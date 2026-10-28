import test from 'node:test';
import assert from 'node:assert/strict';
import Product from '../server/models/Product.js';
import router from '../server/routes/products.js';
import { v2 as cloudinary } from '../server/node_modules/cloudinary/cloudinary.js';

const handler = router.stack.find(layer => layer.route?.path === '/:id' && layer.route.methods.put).route.stack.at(-1).handle;
for (const scenario of ['price-only', 'replace-images', 'failed-update']) {
  test(`image cleanup: ${scenario}`, async t => {
    const operations = [];
    const current = { image: 'https://example.com/old.webp', imagePublicId: 'products/old', images: [{ url: 'https://example.com/old.webp', publicId: 'products/old' }], toObject() { return { ...this }; } };
    t.mock.method(Product, 'findById', async () => current);
    t.mock.method(Product, 'findByIdAndUpdate', async () => { operations.push('save'); if (scenario === 'failed-update') throw new Error('Validation failed'); return {}; });
    t.mock.method(cloudinary.uploader, 'destroy', async id => { operations.push(`delete:${id}`); });
    let status = 200;
    const res = { status(value) { status = value; return this; }, json() {} };
    const body = scenario === 'price-only' ? { price: 42 } : { images: [{ url: 'https://example.com/new.webp', publicId: 'products/new' }] };
    let forwarded;
    await handler({ params: { id: '507f1f77bcf86cd799439011' }, body }, res, error => { forwarded = error; });
    assert.equal(forwarded, undefined);
    assert.equal(status, scenario === 'failed-update' ? 400 : 200);
    assert.deepEqual(operations, scenario === 'replace-images' ? ['save', 'delete:products/old'] : ['save']);
  });
}
