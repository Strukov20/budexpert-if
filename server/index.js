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
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";


dotenv.config();
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
console.log("[BOOT] process.env.MONGO_URI =", process.env.MONGO_URI);
console.log("[BOOT] Using MONGO_URI =", MONGO_URI);

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authLimiter, authRoutes);
// статика для завантажених файлів
const uploadsDir = path.join(process.cwd(), "server", "uploads");
if (!fs.existsSync(uploadsDir)) { fs.mkdirSync(uploadsDir, { recursive: true }); }
app.use("/uploads", express.static(uploadsDir));
app.use("/api/uploads", uploadLimiter, uploadsRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/post", postRoutes);


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Global error handler (fallback)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Server error" });
});