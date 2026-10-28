import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { priceInKopiykas } from './pricing.js';

export async function resolveOrderItems(items) {
  const badRequest = message => Object.assign(new Error(message), { status: 400 });
  if (!Array.isArray(items) || !items.length || items.length > 100) throw badRequest('Кошик має містити від 1 до 100 позицій');
  const quantities = new Map();
  for (const item of items) {
    if (!item || !mongoose.isObjectIdOrHexString(item.productId) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100000) {
      throw badRequest('Невірний товар або кількість');
    }
    const id = item.productId.toLowerCase();
    const quantity = (quantities.get(id) || 0) + item.quantity;
    if (quantity > 100000) throw badRequest('Завелика кількість товару');
    quantities.set(id, quantity);
  }
  const products = await Product.find({ _id: { $in: [...quantities.keys()] } }).lean();
  if (products.length !== quantities.size) throw badRequest('Один із товарів більше не доступний у каталозі');
  let subtotal = 0;
  const resolved = products.map(product => {
    const quantity = quantities.get(String(product._id));
    const unitPrice = priceInKopiykas(product);
    subtotal += unitPrice * quantity;
    return { productId: product._id, quantity, name: product.name, sku: product.sku, unitPrice: unitPrice / 100 };
  });
  if (!Number.isSafeInteger(subtotal)) throw badRequest('Завелика сума замовлення');
  // Stock is informational: ordering with stock=0 is an intentional business rule.
  return { items: resolved, subtotal };
}
