import Product from '../models/Product.js';
import { productPhotoUrlPattern } from '../../shared/catalogPresentation.mjs';

const photoUrl = field => ({ $regexMatch: {
  input: { $trim: { input: { $cond: [{ $eq: [{ $type: field }, 'string'] }, field, ''] } } },
  regex: productPhotoUrlPattern,
} });

// Sort the whole filtered catalog before pagination, including search and promotions.
// Stock quantity itself does not affect the order within either availability group.
export function catalogProducts(filter, { skip = 0, limit = 100, photosFirst = false } = {}) {
  return Product.aggregate([
    { $match: filter },
    { $set: { _catalogAvailable: { $gt: [{ $ifNull: ['$stock', 0] }, 0] } } },
    ...(photosFirst ? [{ $set: { _catalogHasPhoto: { $or: [
      photoUrl('$image'),
      { $anyElementTrue: [{ $map: {
        input: { $cond: [{ $isArray: '$images' }, '$images', []] },
        as: 'image', in: photoUrl('$$image.url'),
      } }] },
    ] } } }] : []),
    { $sort: { _catalogAvailable: -1, ...(photosFirst ? { _catalogHasPhoto: -1 } : {}), createdAt: -1, _id: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $unset: ['_catalogAvailable', '_catalogHasPhoto'] },
  ]);
}
