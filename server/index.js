import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Product from "./models/Product.js";
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
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import Category from "./models/Category.js";
import { fileURLToPath } from "url";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const app = express();
// Avoid 304 Not Modified for API JSON responses (axios expects a body)
app.set('etag', false);
const allowedOriginEnv = process.env.CORS_ORIGIN || "http://localhost:5173";
const allowedOrigins = allowedOriginEnv.split(",").map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser clients or same-origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
// Allow images to be consumed from a different origin/port (e.g., Vite dev server)
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// Підняти ліміт body для великих імпортів товарів
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// Disable caching for API responses
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shop";
const NODE_ENV = process.env.NODE_ENV || "development";
const TEST_ENV = process.env.TEST_ENV || "";
const isTestMode = NODE_ENV === "test" || TEST_ENV === "test";
const allowRemoteDbInTest = String(process.env.ALLOW_REMOTE_DB_IN_TEST || "").toLowerCase() === "true";

if (isTestMode && !allowRemoteDbInTest) {
  const uri = String(MONGO_URI || "");
  const isRemote = /mongodb\+srv:\/\//i.test(uri) || /@/i.test(uri);
  const looksLikeProdDb = /budexpert(?!_test)/i.test(uri);
  if (isRemote || looksLikeProdDb) {
    throw new Error(
      `[SAFETY] Refusing to start server in test mode with a non-test MongoDB URI. ` +
      `Set MONGO_URI to a local test DB (e.g. mongodb://127.0.0.1:27017/budexpert_test). ` +
      `If you really need remote, set ALLOW_REMOTE_DB_IN_TEST=true explicitly.`
    );
  }
}
console.log("[BOOT] process.env.MONGO_URI =", process.env.MONGO_URI);
console.log("[BOOT] Using MONGO_URI =", MONGO_URI);

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected");
    // Remove legacy unique index on Category.name that may still exist in MongoDB
    // after switching to compound uniqueness (parent, name).
    try {
      await Category.collection.dropIndex('name_1');
      console.log('[BOOT] Dropped legacy categories index name_1');
    } catch (err) {
      // Index may not exist; ignore
      const msg = (err && err.message) ? err.message : '';
      if (!/index not found/i.test(msg) && !(err && err.code === 27)) {
        console.log('[BOOT] Could not drop legacy categories index name_1:', msg);
      }
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authLimiter, authRoutes);
// статика для завантажених файлів
const uploadsDir = path.join(projectRoot, "server", "uploads");
if (!fs.existsSync(uploadsDir)) { fs.mkdirSync(uploadsDir, { recursive: true }); }
app.use("/uploads", express.static(uploadsDir));
app.use("/api/uploads", uploadLimiter, uploadsRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/post", postRoutes);
app.use("/api/banner", bannerRoutes);

// Google Merchant Center feeds (public)
app.use("/", merchantRoutes);

// Serve client (Vite build) in production with SPA fallback
const clientDistDir = path.join(projectRoot, "client", "dist");
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    return res.sendFile(path.join(clientDistDir, "index.html"));
  });
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Global error handler (fallback)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Server error" });
});