import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { validateConfig, isTestMode, publicBaseUrl } from "./config.js";
import { randomBytes } from "node:crypto";
import { seoApi, sitemapRouter, pageRouter } from "./routes/seo.js";
import requireAdmin from "./middleware/auth.js";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import categoryRoutes from "./routes/categories.js";
import authRoutes from "./routes/auth.js";
import path from "path";
import fs from "fs";
import uploadsRoutes from "./routes/uploads.js";
import leadsRoutes from "./routes/leads.js";
import postRoutes from "./routes/post.js";
import bannerRoutes from "./routes/banner.js";
import merchantRoutes from "./routes/merchant.js";
import geoRoutes from "./routes/geo.js";
import promosRoutes from "./routes/promos.js";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import dns from "dns";

validateConfig();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const app = express();
app.disable('x-powered-by');
// Configure the exact trusted proxy hop count for the hosting topology.
if (process.env.TRUST_PROXY_HOPS) {
  const hops = Number(process.env.TRUST_PROXY_HOPS);
  if (!Number.isSafeInteger(hops) || hops < 1 || hops > 10) throw new Error('Invalid TRUST_PROXY_HOPS');
  app.set('trust proxy', hops);
}
// Avoid 304 Not Modified for API JSON responses (axios expects a body)
app.set('etag', false);
const allowedOriginEnv = process.env.CORS_ORIGIN || `${publicBaseUrl()},http://localhost:5173`;
const allowedOrigins = allowedOriginEnv.split(",").map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser clients or same-origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(Object.assign(new Error("Not allowed by CORS"), { status: 403 }));
  },
  credentials: true,
}));
app.use((_req, res, next) => { res.locals.nonce = randomBytes(18).toString('base64'); next(); });
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", (_req, res) => `'nonce-${res.locals.nonce}'`, 'https://www.googletagmanager.com', 'https://www.google-analytics.com'],
    scriptSrcAttr: ["'none'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com', ...(process.env.CSP_CONNECT_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean)],
    frameSrc: ['https://www.google.com', 'https://maps.google.com', 'https://www.googletagmanager.com'],
    objectSrc: ["'none'"], baseUri: ["'self'"], frameAncestors: ["'none'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
  } },
}));
// The large parser is restricted to authenticated bulk imports.
app.use('/api/products/bulk', (req, res, next) => req.method === 'POST' ? requireAdmin(req, res, next) : next(), express.json({ limit: '10mb' }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(mongoSanitize());
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: isTestMode ? 5000 : 300, standardHeaders: 'draft-7', legacyHeaders: false });
app.use('/api', apiLimiter);

// Disable caching for API responses
app.use('/api', (_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, follow');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: isTestMode ? 1000 : 10 });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

const MONGO_URI = process.env.MONGO_URI;
const dnsServersEnv = (process.env.DNS_SERVERS || '').toString().trim();
if (dnsServersEnv) {
  const servers = dnsServersEnv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (servers.length) {
    try {
      dns.setServers(servers);
      console.log('[BOOT] Using DNS_SERVERS =', servers.join(', '));
    } catch {
      console.log('[BOOT] Failed to apply DNS_SERVERS');
    }
  }
}

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    console.log("MongoDB connected");

    app.use("/api/products", productsRouter);
    app.use("/api/orders", ordersRouter);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/auth", authLimiter, authRoutes);
    // статика для завантажених файлів
    const uploadsDir = path.join(projectRoot, "server", "uploads");
    if (!fs.existsSync(uploadsDir)) { fs.mkdirSync(uploadsDir, { recursive: true }); }
    // Preserve historical raster URLs without allowing active documents/scripts.
    app.use('/uploads', (req, res, next) => {
      if (!/\.(jpe?g|png|webp|gif)$/i.test(req.path)) return res.sendStatus(404);
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      next();
    }, express.static(uploadsDir, { index: false, dotfiles: 'deny' }));
    app.use("/api/uploads", uploadLimiter, uploadsRoutes);
    app.use("/api/leads", leadsRoutes);
    app.use("/api/post", postRoutes);
    app.use("/api/banner", bannerRoutes);
    app.use("/api/geo", geoRoutes);
    app.use("/api/promos", promosRoutes);

    app.use("/api/seo", seoApi);
    app.use("/", sitemapRouter);

    // Google Merchant Center feeds (public)
    app.use("/", merchantRoutes);

    // Serve client (Vite build) in production with SPA fallback
    const clientDistDir = path.join(projectRoot, "client", "dist");
    if (fs.existsSync(clientDistDir)) {
      app.get('/index.html', (_req, res) => res.redirect(301, '/'));
      app.use('/assets', express.static(path.join(clientDistDir, 'assets'), { maxAge: '1y', immutable: true, index: false }));
      app.use(express.static(clientDistDir, { index: false, maxAge: '1h', setHeaders: (res, file) => {
        if (file.endsWith('.html')) res.setHeader('Cache-Control', 'no-store');
      } }));
      app.use(pageRouter(clientDistDir));
    }
    app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

    // Global error handler (fallback)
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => {
      if (res.headersSent) return _next(err);
      const status = err.name === 'CastError' || err.name === 'ValidationError' || err.name === 'MulterError' ? 400 : (err.status || 500);
      if (status >= 500) console.error('Request failed:', err.name || 'Error');
      res.status(status).json({ message: status === 400 ? 'Invalid request' : status === 413 ? 'Request too large' : status === 403 ? 'Forbidden' : 'Server error' });
    });

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Server startup failed:', err.name || 'Error');
    process.exit(1)
  }
}

startServer()