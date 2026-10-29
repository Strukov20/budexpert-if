import fs from 'node:fs';
import path from 'node:path';
import { createRouter } from '../middleware/router.js';
import { resolvePage, metadataOnly, renderPage, escapeHtml } from '../services/seo.js';
import { publicBaseUrl } from '../config.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { staticPages } from '../../shared/pages.mjs';
import { categoryPaths } from '../../shared/catalog.mjs';

export const seoApi = createRouter();
seoApi.get('/', async (req, res) => {
  const pathname = req.query.path;
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//') || pathname.length > 1000) return res.status(400).json({ message: 'Invalid path' });
  const query = new URLSearchParams(typeof req.query.search === 'string' ? req.query.search.slice(0, 1000) : '');
  const page = await resolvePage(pathname, query);
  if (page.redirect) return res.json({ redirect: page.redirect });
  res.status(page.status).json(metadataOnly(page));
});

export const sitemapRouter = createRouter();
const xml = (res, text) => res.type('application/xml').set('Cache-Control', 'public, max-age=300').send(`<?xml version="1.0" encoding="UTF-8"?>${text}`);
const loc = pathname => escapeHtml(publicBaseUrl() + pathname);
const SITEMAP_SIZE = 1000;
sitemapRouter.get('/robots.txt', (_req, res) => {
  // noindex pages remain crawlable so crawlers can see their robots directive.
  res.type('text/plain').send(`User-agent: *\nDisallow: /api/auth/\nDisallow: /api/orders\nDisallow: /api/leads\nDisallow: /api/promos\nDisallow: /api/uploads\nSitemap: ${publicBaseUrl()}/sitemap.xml\n`);
});
sitemapRouter.get('/sitemap.xml', async (_req, res) => {
  const count = await Product.countDocuments();
  const pages = ['/sitemaps/pages.xml', ...Array.from({ length: Math.ceil(count / SITEMAP_SIZE) }, (_, i) => `/sitemaps/products-${i + 1}.xml`)];
  xml(res, `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(url => `<sitemap><loc>${loc(url)}</loc></sitemap>`).join('')}</sitemapindex>`);
});
sitemapRouter.get('/sitemaps/pages.xml', async (_req, res) => {
  const categories = await Category.find().lean();
  const urls = new Set([...Object.entries(staticPages).filter(([, value]) => !value.noindex).map(([url]) => url), ...categoryPaths(categories).values()]);
  xml(res, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...urls].map(url => `<url><loc>${loc(url)}</loc></url>`).join('')}</urlset>`);
});
sitemapRouter.get('/sitemaps/products-:page.xml', async (req, res) => {
  const page = Number(req.params.page);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1_000_000) return res.sendStatus(404);
  const products = await Product.find().sort({ _id: 1 }).skip((page - 1) * SITEMAP_SIZE).limit(SITEMAP_SIZE).select('_id updatedAt').lean();
  if (!products.length) return res.sendStatus(404);
  xml(res, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${products.map(p => `<url><loc>${loc(`/p/${p._id}`)}</loc>${p.updatedAt ? `<lastmod>${new Date(p.updatedAt).toISOString()}</lastmod>` : ''}</url>`).join('')}</urlset>`);
});

export function pageRouter(distDir) {
  const router = createRouter();
  const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  router.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/assets') || /\.(xml|txt|js|css|map|png|webp|jpg|svg|ico)$/.test(req.path)) return next();
    const page = await resolvePage(req.path, new URLSearchParams(req.url.split('?')[1] || ''));
    if (page.redirect) return res.redirect(301, page.redirect);
    res.set('Cache-Control', 'no-store'); // HTML contains a per-response CSP nonce.
    if (page.noindex) res.set('X-Robots-Tag', 'noindex, follow');
    res.status(page.status).type('html').send(renderPage(template, page, res.locals.nonce));
  });
  return router;
}
