import express from "express";
import Product from "../models/Product.js";
import requireAdmin from "../middleware/auth.js";
import Category from "../models/Category.js";

const router = express.Router();

// GET /api/products
router.get("/", async (req, res) => {
  const { q, category } = req.query;
  const filter = {};
  if (q) {
    filter.name = { $regex: q, $options: 'i' };
  }
  if (category) {
    filter.category = category;
  }
  // Optional pagination
  const page = parseInt(req.query.page, 10);
  const limit = parseInt(req.query.limit, 10);
  if (Number.isInteger(page) && Number.isInteger(limit) && limit > 0) {
    const skip = Math.max(0, (page - 1)) * limit;
    const [items, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ]);
    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  }
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: "Not found" });
  res.json(p);
});

// POST /api/products
router.post("/", requireAdmin, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.category === '' || payload.category === null) {
      delete payload.category;
    }
    const name = (payload.name || '').trim();
    if (!name) return res.status(400).json({ message: "Поле name обов'язкове" });
    // Перевірка на дубль назви (без урахування регістру)
    const exists = await Product.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (exists) {
      return res.status(409).json({ message: "Товар з такою назвою вже існує" });
    }
    const product = new Product(payload);
    await product.save();
    res.status(201).json(product);
  } catch (e) {
    res.status(400).json({ message: "Не вдалося створити товар", error: e?.message });
  }
});

// POST /api/products/bulk
// Body: Array<ProductLike>. Підтримує category або categoryName (name існуючої категорії)
router.post("/bulk", requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    if (!Array.isArray(payload) || payload.length === 0) {
      return res.status(400).json({ message: "Очікується масив продуктів" });
    }

    // Збираємо унікальні categoryName для мапінгу на ObjectId
    const names = Array.from(new Set(
      payload
        .map((p) => (p && typeof p.categoryName === "string" ? p.categoryName.trim() : null))
        .filter(Boolean)
    ));

    let catMap = new Map();
    if (names.length) {
      const cats = await Category.find({ name: { $in: names } });
      cats.forEach((c) => catMap.set(c.name, c._id));
      // створити відсутні категорії
      const missing = names.filter(n => !catMap.has(n));
      if (missing.length) {
        const created = await Category.insertMany(missing.map(name => ({ name })), { ordered: false });
        created.forEach(c => catMap.set(c.name, c._id));
      }
    }

    const docs = payload.map((p) => {
      const doc = { ...p };
      if (!doc.category && doc.categoryName && catMap.has(doc.categoryName)) {
        doc.category = catMap.get(doc.categoryName);
      }
      delete doc.categoryName;
      return doc;
    });

    const inserted = await Product.insertMany(docs, { ordered: false });
    return res.status(201).json({ count: inserted.length, items: inserted });
  } catch (err) {
    // Якщо були часткові вставки при ordered:false
    if (err && err.insertedDocs) {
      return res.status(207).json({ count: err.insertedDocs.length, items: err.insertedDocs, error: true });
    }
    return res.status(500).json({ message: "Помилка масового додавання", error: err?.message });
  }
});

// PUT /api/products/:id
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const body = { ...req.body };
    const update = {};
    // копіюємо усі поля окрім category
    for (const k of Object.keys(body)) {
      if (k !== 'category') update[k] = body[k];
    }
    // спеціальна обробка category
    if ('category' in body) {
      if (body.category === '' || body.category === null) {
        update.$unset = { ...(update.$unset||{}), category: "" };
      } else {
        update.category = body.category;
      }
    }
    const p = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (e) {
    res.status(400).json({ message: "Не вдалося оновити товар", error: e?.message });
  }
});

// DELETE /api/products/:id
router.delete("/:id", requireAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// DELETE /api/products
// Видалити всі товари: потребує підтвердження ?confirm=true
router.delete("/", requireAdmin, async (req, res) => {
  try {
    const { confirm } = req.query;
    if (confirm !== 'true') {
      return res.status(400).json({ message: "Для масового видалення додайте ?confirm=true" });
    }
    const result = await Product.deleteMany({});
    return res.json({ ok: true, deletedCount: result?.deletedCount || 0 });
  } catch (e) {
    return res.status(500).json({ message: "Не вдалося видалити товари", error: e?.message });
  }
});

export default router;
