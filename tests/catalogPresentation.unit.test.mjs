import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasProductPhoto, randomCatalogProducts } from '../shared/catalogPresentation.mjs';

test('photo detection handles gallery and historical empty image values', () => {
  for (const product of [{}, { image: null }, { image: '  ' }, { image: 'null' }, { image: 'undefined' }, { images: [{ url: '' }] }]) {
    assert.equal(hasProductPhoto(product), false);
  }
  for (const product of [{ image: '/photo.webp' }, { image: ' https://example.com/photo.jpg ' }, { images: [{ url: '' }, { url: '/gallery.webp' }] }]) {
    assert.equal(hasProductPhoto(product), true);
  }
});

test('random catalog keeps availability and photo priorities without mutating its input', () => {
  const products = [
    { id: 'absent-photo', stock: 0, image: '/a.webp' },
    { id: 'available-empty', stock: 1 },
    { id: 'available-photo-a', stock: 1, image: '/b.webp' },
    { id: 'absent-empty', stock: 0 },
    { id: 'available-photo-b', stock: 100, images: [{ url: '/c.webp' }] },
  ];
  const before = structuredClone(products);
  const ordered = randomCatalogProducts(products, () => 0);
  assert.deepEqual(ordered.map(product => product.id), ['available-photo-b', 'available-photo-a', 'available-empty', 'absent-photo', 'absent-empty']);
  assert.deepEqual(products, before);
  assert.deepEqual(randomCatalogProducts([]), []);
});
