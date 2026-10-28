import { v2 as cloudinary } from 'cloudinary';

export function imageIds(product) {
  return [...new Set([product.imagePublicId, ...(product.images || []).map(image => image.publicId)].filter(Boolean))];
}

export async function removeImages(ids) {
  await Promise.all(ids.map(async id => {
    try { await cloudinary.uploader.destroy(id); }
    catch { console.error('Cloudinary cleanup failed'); }
  }));
}
