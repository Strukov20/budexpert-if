import Product from '../models/Product.js';

// Sort the whole filtered catalog before pagination, including search and promotions.
// Stock quantity itself does not affect the order within either availability group.
export function catalogProducts(filter, { skip = 0, limit = 100 } = {}) {
  return Product.aggregate([
    { $match: filter },
    { $set: { _catalogAvailable: { $gt: [{ $ifNull: ['$stock', 0] }, 0] } } },
    { $sort: { _catalogAvailable: -1, createdAt: -1, _id: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $unset: '_catalogAvailable' },
  ]);
}
