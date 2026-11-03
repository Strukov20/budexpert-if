import Product from '../models/Product.js';
import { productSlugBase } from '../../shared/products.mjs';

const missingSlug = { $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] };

export async function ensureProductSlug(product) {
  if (product.slug) return product;
  const base = productSlugBase(product.name);
  for (let number = 1; number <= 10000; number++) {
    const slug = number === 1 ? base : `${base}-${number}`;
    try {
      const updated = await Product.findOneAndUpdate(
        { _id: product._id, ...missingSlug }, { $set: { slug } },
        { new: true, timestamps: false },
      );
      // Another server might have assigned this product's slug concurrently.
      return updated || await Product.findById(product._id);
    } catch (error) {
      if (error.code !== 11000 || !error.keyPattern?.slug) throw error;
      // Jump past existing suffixes instead of retrying every occupied address.
      const siblings = await Product.find({ slug: { $regex: `^${base}(?:-[0-9]+)?$` } }).select('slug').lean();
      const occupied = new Set(siblings.map(product => product.slug));
      while (occupied.has(`${base}-${number + 1}`)) number++;
    }
  }
  throw new Error('Could not allocate a unique product slug');
}

export async function backfillProductSlugs() {
  // Establish the collision constraint before assigning any addresses.
  await Product.collection.createIndex({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: 'string' } } });
  let assigned = 0;
  const cursor = Product.find(missingSlug).select('_id name slug').sort({ _id: 1 }).lean().cursor();
  for await (const product of cursor) {
    if (await ensureProductSlug(product)) assigned++;
  }
  return assigned;
}
