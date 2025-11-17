import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import requireAdmin from "../middleware/auth.js";

const router = express.Router();

// GET all orders (admin only)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate("items.productId", "name price");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET one order (admin only)
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.productId", "name price");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create order
router.post("/", async (req, res) => {
  try {
    const { customerName, phone, address, items } = req.body;

    // Підрахунок totalPrice
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    let totalPrice = 0;

    items.forEach((item) => {
      const prod = products.find((p) => p._id.equals(item.productId));
      if (prod) totalPrice += prod.price * item.quantity;
    });

    const order = new Order({ customerName, phone, address, items, totalPrice });
    const saved = await order.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE order (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update order (admin only)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const allowed = {};
    if (typeof req.body.status === 'string') allowed.status = req.body.status;
    if (typeof req.body.note === 'string') allowed.note = req.body.note;
    const updated = await Order.findByIdAndUpdate(req.params.id, allowed, { new: true });
    if (!updated) return res.status(404).json({ message: "Order not found" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
