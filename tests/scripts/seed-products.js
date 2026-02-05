import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../../server/models/Product.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/budexpert_test";

const seedProducts = [
  {
    name: "Seed Product 1",
    price: 100,
    stock: 50,
    unit: "шт",
    sku: "seed-001",
    description: "Seeded product for local test environment",
    discount: 0,
    specs: { brand: "Seed", model: "S1" },
  },
  {
    name: "Seed Product 2",
    price: 250,
    stock: 30,
    unit: "шт",
    sku: "seed-002",
    description: "Seeded product for local test environment",
    discount: 5,
    specs: { brand: "Seed", model: "S2" },
  },
  {
    name: "Seed Product 3",
    price: 75,
    stock: 200,
    unit: "шт",
    sku: "seed-003",
    description: "Seeded product for local test environment",
    discount: 0,
    specs: { brand: "Seed", model: "S3" },
  },
  {
    name: "Seed Product 4",
    price: 999,
    stock: 10,
    unit: "шт",
    sku: "seed-004",
    description: "Seeded product for local test environment",
    discount: 10,
    specs: { brand: "Seed", model: "S4" },
  },
  {
    name: "Seed Product 5",
    price: 15,
    stock: 500,
    unit: "шт",
    sku: "seed-005",
    description: "Seeded product for local test environment",
    discount: 0,
    specs: { brand: "Seed", model: "S5" },
  },
];

async function main() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const skus = seedProducts.map((p) => p.sku).filter(Boolean);
  await Product.deleteMany({ sku: { $in: skus } });
  await Product.insertMany(seedProducts, { ordered: false });

  const count = await Product.countDocuments({ sku: { $in: skus } });
  console.log(`[SEED] Inserted/updated seed products: ${count}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("[SEED] Error:", err?.message || err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
