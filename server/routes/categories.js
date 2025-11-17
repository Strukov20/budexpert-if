import express from "express";
import Category from "../models/Category.js";
import requireAdmin from "../middleware/auth.js";
import Product from "../models/Product.js";

const router = express.Router();

// ✅ GET /api/categories — отримати всі категорії
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
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
    const r = await Product.updateMany({ category: fromId }, { $set: { category: toId } });
    res.json({ ok: true, modifiedCount: r.modifiedCount });
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
    const exists = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (exists) return res.status(409).json({ message: "Категорія з такою назвою вже існує" });
    const category = new Category({ ...req.body, name });
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
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ DELETE /api/categories/:id — видалити категорію
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
