function money(value) {
  if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') return null;
  const number = Number(value);
  const cents = Math.round(number * 100);
  return Number.isFinite(number) && number >= 0 && Number.isSafeInteger(cents) ? cents : null;
}

export function orderTotals(order, products = []) {
  const total = money(order.totalPrice ?? order.total);
  const savedSubtotal = money(order.subtotalPrice);
  const savedDiscount = money(order.discountAmount);
  const hasPromo = Boolean(order.promoCode || Number(order.promoPercent) > 0);
  // Old orders may only have a total. Never reverse a percentage discount by guessing.
  const subtotal = savedSubtotal ?? (total !== null && (savedDiscount !== null || !hasPromo) ? total + (savedDiscount ?? 0) : null);
  const discount = savedDiscount ?? (subtotal !== null && total !== null && subtotal >= total ? subtotal - total : null);
  const rows = (order.items || []).map(item => {
    const product = item.productId && typeof item.productId === 'object' ? item.productId : null;
    const id = product?._id || item.productId || item._id;
    const catalogProduct = products.find(candidate => String(candidate._id) === String(id));
    const quantity = Number(item.quantity);
    // Current catalog prices are not historical order prices.
    const unitPrice = money(item.unitPrice) ?? money(item.price);
    const lineTotal = unitPrice !== null && Number.isFinite(quantity) && quantity > 0 ? Math.round(unitPrice * quantity) : null;
    return {
      name: item.name || product?.name || catalogProduct?.name || 'Товар',
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : null,
      unitPrice,
      lineTotal: Number.isSafeInteger(lineTotal) ? lineTotal : null,
      recovered: false,
    };
  });
  const unknown = rows.filter(row => row.unitPrice === null || row.lineTotal === null);
  const knownSum = rows.reduce((sum, row) => sum + (row.lineTotal ?? 0), 0);
  // A single missing line price is recoverable only when the saved subtotal
  // determines it exactly to a kopiyka. Never distribute a difference between items.
  if (unknown.length === 1 && unknown[0].unitPrice === null && unknown[0].quantity !== null && subtotal !== null && Number.isSafeInteger(knownSum)) {
    const row = unknown[0];
    const remaining = subtotal - knownSum;
    const unitPrice = Math.round(remaining / row.quantity);
    if (remaining >= 0 && Number.isSafeInteger(unitPrice) && Math.abs(unitPrice * row.quantity - remaining) < 0.000001) {
      Object.assign(row, { unitPrice, lineTotal: remaining, recovered: true });
    }
  }
  const unresolved = rows.some(row => row.unitPrice === null || row.lineTotal === null);
  const itemsSubtotal = unresolved ? null : rows.reduce((sum, row) => sum + row.lineTotal, 0);
  const mismatch = (itemsSubtotal !== null && subtotal !== null && itemsSubtotal !== subtotal)
    || (subtotal !== null && discount !== null && total !== null && subtotal - discount !== total);
  return { rows, subtotal, discount, total, recovered: rows.some(row => row.recovered), unresolved, mismatch };
}
