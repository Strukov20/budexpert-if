import express from "express";
import Category from "../models/Category.js";
import requireAdmin from "../middleware/auth.js";
import Product from "../models/Product.js";

const router = express.Router();

// ✅ GET /api/categories — отримати всі категорії (можна фільтрувати по parent)
// Query: ?parent=<id> | ?parent=null
router.get("/", async (req, res) => {
  try {
    const { parent } = req.query;
    const filter = {};
    if (typeof parent === 'string') {
      if (parent === 'null' || parent === '') filter.parent = null;
      else filter.parent = parent;
    }
    const categories = await Category.find(filter).sort({ createdAt: -1 }).lean();
    const normalized = (categories || []).map((c) => ({
      ...c,
      _id: c?._id ? String(c._id) : c?._id,
      parent: c.parent ? String(c.parent) : null,
    }));
    res.json(normalized);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST /api/categories/reassign — масово замінити категорію у товарах
// Body: { fromId: ObjectId, toId: ObjectId }
// Примітка: просте перейменування категорії НЕ потребує цього ендпоінта, оскільки товари зберігають посилання на _id
router.post("/reassign", requireAdmin, async (req, res) => {
  try {
    const { fromId, toId } = req.body || {};
    if (!fromId || !toId) return res.status(400).json({ message: 'Потрібні fromId і toId' });
    if (fromId === toId) return res.status(400).json({ message: 'fromId і toId однакові' });
    const fromCat = await Category.findById(fromId);
    const toCat = await Category.findById(toId);
    if (!fromCat || !toCat) return res.status(404).json({ message: 'Категорію не знайдено' });
    const [r1, r2] = await Promise.all([
      Product.updateMany({ category: fromId }, { $set: { category: toId } }),
      Product.updateMany({ subcategory: fromId }, { $set: { subcategory: toId } }),
    ]);
    res.json({ ok: true, modifiedCount: (r1.modifiedCount || 0) + (r2.modifiedCount || 0) });
  } catch (err) {
    console.error('Error reassigning category:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET /api/categories/:id — отримати одну категорію
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Not found" });
    res.json(category);
  } catch (err) {
    console.error("Error fetching category:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST /api/categories — створити нову категорію
router.post("/", requireAdmin, async (req, res) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ message: "Поле name обов'язкове" });
    const parent = (req.body?.parent === '' || req.body?.parent === null) ? null : (req.body?.parent || null);
    const exists = await Category.findOne({ parent, name: { $regex: `^${name}$`, $options: 'i' } });
    if (exists) return res.status(409).json({ message: "Категорія з такою назвою вже існує" });
    const category = new Category({ ...req.body, name, parent });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ PUT /api/categories/:id — оновити категорію
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const body = { ...req.body };
    if (typeof body.name === 'string') body.name = body.name.trim();
    if ('parent' in body) {
      if (body.parent === '' || body.parent === null) body.parent = null;
    }
    const updated = await Category.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    res.json(updated);
  } catch (err) {
    console.error("Error updating category:", err);
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Категорія з такою назвою вже існує" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ DELETE /api/categories/:id — видалити категорію
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const childrenCount = await Category.countDocuments({ parent: id });
    if (childrenCount > 0) {
      return res.status(400).json({ message: 'Спочатку видаліть/перемістіть підкатегорії цієї категорії' });
    }
    await Category.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
