import { createRouter } from '../middleware/router.js';
import rateLimit from "express-rate-limit";
import Order from "../models/Order.js";
import { resolveOrderItems } from "../services/orderItems.js";
import requireAdmin from "../middleware/auth.js";

const router = createRouter();

// Публічне створення замовлення без авторизації — обмежуємо від спаму
const createOrderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

const UA_MOBILE_OPERATOR_CODES = new Set([
  '39','50','63','66','67','68','73','89','91','92','93','94','95','96','97','98','99'
]);

const normalizeUaPhone = (v) => {
  if (typeof v !== 'string' || v.length > 32) return ''
  const digits = v.replace(/\D+/g, '')
  if (![9, 10, 12].includes(digits.length)) return ''
  let local = ''
  if (digits.length === 12 && digits.startsWith('380')) local = digits.slice(3, 12)
  else if (digits.length === 10 && digits.startsWith('0')) local = digits.slice(1, 10)
  else if (digits.length === 9) local = digits
  else return ''
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
    res.status(error.status || 500).json({ message: error.status === 400 ? error.message : 'Не вдалося обробити замовлення' });
  }
});

// GET one order (admin only)
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.productId", "name price sku");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.status === 400 ? error.message : 'Не вдалося обробити замовлення' });
  }
});

// POST create order
router.post("/", createOrderLimiter, async (req, res) => {
  try {
    const { customerName, phone, address, items, promoCode } = req.body;

    const normalizedPhone = normalizeUaPhone(phone);
    if (!isUaMobilePhoneValid(normalizedPhone)) {
      return res.status(400).json({ message: 'Invalid phone' });
    }

    if (typeof customerName !== 'string' || !customerName.trim() || customerName.length > 200 ||
        typeof address !== 'string' || !address.trim() || address.length > 1000 ||
        (promoCode !== undefined && (typeof promoCode !== 'string' || promoCode.length > 50))) {
      return res.status(400).json({ message: 'Невірні дані замовлення' });
    }
    const resolved = await resolveOrderItems(items);
    const subtotalPrice = resolved.subtotal / 100;

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

    const discountKopiykas = Math.round(resolved.subtotal * promoPercent / 100);
    const discountAmount = discountKopiykas / 100;
    const totalPrice = (resolved.subtotal - discountKopiykas) / 100;

    const order = new Order({
      customerName: customerName.trim(),
      phone: normalizedPhone,
      address: address.trim(),
      items: resolved.items,
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
    res.status(error.status || 500).json({ message: error.status === 400 ? error.message : 'Не вдалося обробити замовлення' });
  }
});

// DELETE order (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.status === 400 ? error.message : 'Не вдалося обробити замовлення' });
  }
});

// PUT update order (admin only)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const allowed = {};
    if (typeof req.body.status === 'string') allowed.status = req.body.status;
    if (typeof req.body.note === 'string') allowed.note = req.body.note;
    const updated = await Order.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Order not found" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
