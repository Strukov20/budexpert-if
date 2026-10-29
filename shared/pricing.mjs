export function priceInKopiykas(product) {
  const price = Number(product.price);
  const discount = Math.max(0, Math.min(100, Number(product.discount) || 0));
  if (!Number.isFinite(price) || price < 0) throw new Error('Invalid product price');
  return Math.round(Math.round(price * 100) * (100 - discount) / 100);
}
