import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { publicBaseUrl } from '../config.js';
import { categoryPaths, categorySlug, legacyCategorySlug } from '../../shared/catalog.mjs';
import { staticPages } from '../../shared/pages.mjs';
import { priceInKopiykas } from './pricing.js';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
export const plainText = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/[#*_`\[\]]/g, '').replace(/\s+/g, ' ').trim();
export const absoluteUrl = value => {
  try { const url = new URL(value || '/logo.png', publicBaseUrl()); return /^https?:$/.test(url.protocol) ? url.href : ''; }
  catch { return ''; }
};
export const businessData = () => ({
  '@context': 'https://schema.org', '@type': 'HardwareStore', '@id': `${publicBaseUrl()}/#store`,
  name: 'БудЕксперт', url: publicBaseUrl(), image: absoluteUrl('/logo.png'), telephone: '+380980095577',
  address: { '@type': 'PostalAddress', streetAddress: 'вул. Білозіра, 8', addressLocality: 'Івано-Франківськ', addressCountry: 'UA' },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '19:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '09:00', closes: '15:00' },
  ],
});
const notFound = (path) => ({ status: 404, title: 'Сторінку не знайдено — БудЕксперт', description: 'Перевірте адресу або відкрийте каталог товарів.', heading: 'Сторінку не знайдено', noindex: true, path, structuredData: [] });

export async function resolvePage(pathname, query = new URLSearchParams()) {
  const missing = () => notFound(pathname);
  const base = publicBaseUrl();
  const pageNumber = Number(query.get('page') || 1);
  if (!Number.isSafeInteger(pageNumber) || pageNumber < 1 || pageNumber > 1_000_000) return missing();
  const pageQuery = pageNumber > 1 ? `?page=${pageNumber}` : '';
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
  const match = /^\/(p|products)\/([a-f\d]{24})$/i.exec(path);
  if (match) {
    const product = await Product.findById(match[2]).lean();
    if (!product) return missing();
    const canonicalPath = `/p/${product._id}`;
    if (path !== canonicalPath) return { redirect: canonicalPath };
    const description = plainText(product.description).slice(0, 160) || `${product.name} у магазині БудЕксперт. Замовляйте з доставкою в Івано-Франківську та області.`;
    const price = priceInKopiykas(product) / 100;
    const productImage = product.images?.[0]?.url || product.image;
    const image = productImage ? absoluteUrl(productImage) : '';
    const structuredData = [{
      '@context': 'https://schema.org', '@type': 'Product', name: product.name, description, image: image ? [image] : undefined, sku: product.sku,
      offers: { '@type': 'Offer', url: base + canonicalPath, price: price.toFixed(2), priceCurrency: 'UAH', availability: Number(product.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition' },
    }];
    return { status: 200, path: canonicalPath, title: `${product.name} — купити в БудЕксперт`, description, heading: product.name, image, type: 'product', structuredData, product };
  }
  if (/^\/(p|products)\//.test(path)) return missing();
  let metadata = staticPages[path];
  let categories;
  let category;
  let paths;
  if (!metadata || ['/', '/products'].includes(path)) {
    categories = await Category.find().sort({ name: 1 }).lean();
    paths = categoryPaths(categories);
  }
  if (path === '/products' && (query.has('cat') || query.has('sub'))) {
    const target = paths.get(query.get('sub') || query.get('cat'));
    if (!target) return missing();
    const params = new URLSearchParams();
    if (query.get('q')) params.set('q', query.get('q'));
    if (pageNumber > 1) params.set('page', pageNumber);
    return { redirect: target + (params.size ? `?${params}` : '') };
  }
  if (!metadata) {
    let segments;
    try { segments = path.slice(1).split('/').map(decodeURIComponent); }
    catch { return missing(); }
    if (segments.length > 3) return missing();
    let parent = null;
    for (const segment of segments) {
      category = categories.find(c => String(c.parent || '') === String(parent || '') && [categorySlug(c.name), legacyCategorySlug(c.name).toLowerCase()].includes(segment.toLowerCase()));
      if (!category) return missing();
      parent = category._id;
    }
    const canonicalPath = paths.get(String(category._id));
    if (!canonicalPath) return missing();
    if (path !== canonicalPath) return { redirect: canonicalPath + pageQuery };
    metadata = { title: `${category.name} — купити в Івано-Франківську | БудЕксперт`, description: plainText(category.description).slice(0, 160) || `${category.name} у магазині БудЕксперт. Ціни, характеристики та замовлення з доставкою в Івано-Франківську й області.`, heading: category.name };
  }
  const result = { ...metadata, status: 200, path: path + pageQuery, image: absoluteUrl('/logo.png'), structuredData: [businessData()] };
  if (query.has('q') || query.has('promo')) result.noindex = true;
  if (pageNumber > 1) result.title += ` — сторінка ${pageNumber}`;
  if (path === '/' || path === '/products' || category) {
    const filter = {};
    if (category) {
      const depth = paths.get(String(category._id)).split('/').length - 1;
      filter[['category', 'subcategory', 'type'][depth - 1]] = category._id;
    }
    if (query.get('q')) filter.name = { $regex: query.get('q').slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const limit = 12;
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1, _id: -1 }).skip((pageNumber - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    if (pageNumber > 1 && !products.length) return missing();
    Object.assign(result, { products, total, page: pageNumber, pages: Math.max(1, Math.ceil(total / limit)), categories, category, categoryLinks: [...paths].map(([id, url]) => ({ url, name: categories.find(c => String(c._id) === id)?.name })) });
    if (category) result.structuredData.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Каталог', item: base + '/products' },
      { '@type': 'ListItem', position: 2, name: category.name, item: base + result.path },
    ] });
  }
  if (pathname !== path) return { redirect: path + pageQuery };
  return result;
}

export function metadataOnly(page) {
  const { product, products, categories, category, categoryLinks, ...metadata } = page;
  return { ...metadata, canonical: publicBaseUrl() + page.path };
}

export function renderPage(template, page, nonce) {
  const url = publicBaseUrl() + page.path;
  const escape = escapeHtml;
  const head = `<title>${escape(page.title)}</title>
<meta name="description" content="${escape(page.description)}">
<meta name="robots" content="${page.noindex ? 'noindex,follow' : 'index,follow'}">
<link rel="canonical" href="${escape(url)}">
<meta property="og:type" content="${page.type || 'website'}">
<meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}">
<meta property="og:url" content="${escape(url)}"><meta property="og:image" content="${escape(page.image || absoluteUrl('/logo.png'))}">
<meta name="twitter:title" content="${escape(page.title)}"><meta name="twitter:description" content="${escape(page.description)}"><meta name="twitter:image" content="${escape(page.image || absoluteUrl('/logo.png'))}">
${page.structuredData.map(data => `<script data-seo="structured" type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`).join('')}`;
  let body = `<header><a href="/">БудЕксперт</a><nav><a href="/products">Товари</a> · <a href="/services">Доставка</a> · <a href="/contacts">Контакти</a></nav></header><main><h1>${escape(page.heading)}</h1><p>${escape(page.description)}</p>`;
  if (page.product) {
    const p = page.product;
    body += `${page.image ? `<img src="${escape(page.image)}" alt="${escape(p.name)}" width="600">` : ''}<p>${(priceInKopiykas(p) / 100).toFixed(2)} ₴</p><p>Наявність: ${Number(p.stock) > 0 ? 'в наявності' : 'немає'}</p><p>${escape(plainText(p.description))}</p><dl>${Object.entries(p.specs || {}).map(([key, value]) => `<dt>${escape(key)}</dt><dd>${escape(value)}</dd>`).join('')}</dl>`;
  }
  if (page.categoryLinks) body += `<nav aria-label="Категорії">${page.categoryLinks.map(link => `<a href="${escape(link.url)}">${escape(link.name)}</a> `).join('')}</nav>`;
  if (page.products) body += `<ul>${page.products.map(p => `<li><a href="/p/${p._id}">${escape(p.name)}</a> — ${(priceInKopiykas(p) / 100).toFixed(2)} ₴</li>`).join('')}</ul>`;
  if (page.pages > 1) {
    body += '<nav aria-label="Сторінки каталогу">';
    for (const number of new Set([1, page.page - 1, page.page, page.page + 1, page.pages].filter(n => n > 0 && n <= page.pages))) {
      const params = new URLSearchParams();
      if (number > 1) params.set('page', number);
      body += `<a href="${escape(page.path.split('?')[0] + (params.size ? `?${params}` : ''))}">${number}</a> `;
    }
    body += '</nav>';
  }
  body += '</main><footer>БудЕксперт · вул. Білозіра, 8, Івано-Франківськ · <a href="tel:+380980095577">+380980095577</a></footer>';
  return template.replace(/<title>[\s\S]*?<\/title>/i, '').replace(/<meta\s+(?:name="(?:description|robots|twitter:(?:title|description|image))"|property="og:(?:title|description|image|type|url)")[^>]*>/gi, '')
    .replace('</head>', head + '</head>').replace('<div id="root"></div>', `<div id="root">${body}</div>`)
    .replace(/<script\b/g, `<script nonce="${nonce}"`);
}
