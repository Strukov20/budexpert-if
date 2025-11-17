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
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";


dotenv.config();
const app = express();
app.use(cors());
// Allow images to be consumed from a different origin/port (e.g., Vite dev server)
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json());
app.use(mongoSanitize());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shop";
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

  mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));

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


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Global error handler (fallback)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Server error" });
});