import { categorySlug } from './catalog.mjs';

export function productSlugBase(name) {
  const base = categorySlug(String(name || '').replace(/[.,/\\()+:;]+/g, ' ')).replace(/-+/g, '-').slice(0, 100).replace(/-+$/, '') || 'tovar';
  // Keep the legacy ObjectId namespace unambiguous.
  return /^[a-f\d]{24}$/i.test(base) ? `tovar-${base}` : base;
}

export const productPath = product => `/p/${product.slug || product._id}`;
export const isProductSlug = value => typeof value === 'string' && value.length <= 128 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
