import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import requireAdmin from "../middleware/auth.js";

const router = express.Router();

const UA_MOBILE_OPERATOR_CODES = new Set([
  '39','50','63','66','67','68','73','89','91','92','93','94','95','96','97','98','99'
]);

const normalizeUaPhone = (v) => {
  const digits = (v || '').toString().replace(/\D+/g, '')
  let local = ''
  if (digits.startsWith('380')) local = digits.slice(3, 12)
  else if (digits.startsWith('0')) local = digits.slice(1, 10)
  else local = digits.slice(-9)
  return '+380' + (local ? local : '')
};

const isUaMobilePhoneValid = (v) => {
  if (!/^\+380\d{9}$/.test(v)) return false
  const code = v.slice(4, 6)
  return UA_MOBILE_OPERATOR_CODES.has(code)
};

// GET all orders (admin only)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate("items.productId", "name price sku");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET one order (admin only)
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.productId", "name price sku");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create order
router.post("/", async (req, res) => {
  try {
    const { customerName, phone, address, items, promoCode } = req.body;

    const normalizedPhone = normalizeUaPhone(phone);
    if (!isUaMobilePhoneValid(normalizedPhone)) {
      return res.status(400).json({ message: 'Invalid phone' });
    }

    // Підрахунок subtotalPrice (завжди з актуальних цін з БД)
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    let subtotalPrice = 0;

    items.forEach((item) => {
      const prod = products.find((p) => p._id.equals(item.productId));
      if (prod) subtotalPrice += prod.price * item.quantity;
    });

    const normalizedPromo = (promoCode || '').toString().trim().toUpperCase();
    let promoPercent = 0;
    let promoKey;
    if (normalizedPromo) {
      if (normalizedPromo === 'SOCIAL5') promoPercent = 5;
      else {
        return res.status(400).json({ message: 'Invalid promo code' });
      }

      // One-time promo: allow only once per phone number
      promoKey = `${normalizedPromo}::${normalizedPhone}`;
      const alreadyUsed = await Order.exists({ promoKey });
      if (alreadyUsed) {
        return res.status(400).json({ message: 'Promo code already used' });
      }
    }

    const discountAmount = promoPercent > 0 ? (subtotalPrice * promoPercent) / 100 : 0;
    const totalPrice = Math.max(0, subtotalPrice - discountAmount);

    const order = new Order({
      customerName,
      phone: normalizedPhone,
      address,
      items,
      promoCode: promoPercent ? normalizedPromo : undefined,
      promoPercent: promoPercent ? promoPercent : undefined,
      promoKey: promoPercent ? promoKey : undefined,
      subtotalPrice,
      discountAmount,
      totalPrice,
    });
    const saved = await order.save();
    res.status(201).json(saved);
  } catch (error) {
    if (error && (error.code === 11000 || error.code === 11001)) {
      return res.status(400).json({ message: 'Promo code already used' });
    }
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
