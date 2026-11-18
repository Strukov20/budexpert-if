// Accept the same absolute and local image URLs as product cards.
export const productPhotoUrlPattern = /^(?:https?:\/\/|\/(?!\/))/;
export const hasProductPhoto = product => [product?.image, ...(Array.isArray(product?.images) ? product.images.map(image => image?.url) : [])]
  .some(url => typeof url === 'string' && productPhotoUrlPattern.test(url.trim()));

export function randomCatalogProducts(products, random = Math.random) {
  const groups = [[], [], [], []];
  for (const product of products) {
    const priority = (Number(product.stock) > 0 ? 0 : 2) + (hasProductPhoto(product) ? 0 : 1);
    groups[priority].push(product);
  }
  for (const group of groups) {
    for (let index = group.length - 1; index > 0; index--) {
      const other = Math.floor(random() * (index + 1));
      [group[index], group[other]] = [group[other], group[index]];
    }
  }
  return groups.flat();
}
