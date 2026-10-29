import mongoose from 'mongoose';

const fields = new Set(['name', 'price', 'stock', 'unit', 'sku', 'description', 'specs', 'specsText', 'images', 'image', 'imagePublicId', 'category', 'subcategory', 'type', 'discount', 'productOfWeek', 'categoryName']);

export function productInput(input) {
  const invalid = () => { throw Object.assign(new Error('Invalid product data'), { status: 400 }); };
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid();
  const result = Object.fromEntries(Object.entries(input).filter(([key]) => fields.has(key)));
  for (const [key, max] of Object.entries({ name: 500, sku: 200, unit: 100, description: 50000, specsText: 50000, image: 2000, imagePublicId: 500, categoryName: 500 })) {
    if (key in result && (typeof result[key] !== 'string' || result[key].length > max)) invalid();
  }
  for (const key of ['price', 'stock', 'discount']) {
    if (!(key in result)) continue;
    if (result[key] === '' || result[key] === null) { delete result[key]; continue; }
    if (!['number', 'string'].includes(typeof result[key])) invalid();
    const value = Number(result[key]);
    if (!Number.isFinite(value) || value < 0 || value > (key === 'discount' ? 100 : 10000000)) invalid();
    result[key] = value;
  }
  for (const key of ['category', 'subcategory', 'type']) {
    if (result[key] !== undefined && result[key] !== '' && result[key] !== null && !mongoose.isObjectIdOrHexString(result[key])) invalid();
  }
  if ('images' in result && (!Array.isArray(result.images) || result.images.length > 30)) invalid();
  if ('productOfWeek' in result && typeof result.productOfWeek !== 'boolean') invalid();
  if (result.specs !== undefined && typeof result.specs !== 'string' && (!result.specs || typeof result.specs !== 'object' || Array.isArray(result.specs) || Object.keys(result.specs).length > 200)) invalid();
  return result;
}
