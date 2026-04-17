import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    promoCode: { type: String },
    promoPercent: { type: Number, min: 0, max: 100 },
    promoKey: { type: String },
    subtotalPrice: { type: Number },
    discountAmount: { type: Number },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['new', 'processing', 'shipped', 'completed', 'cancelled'], default: 'new' },
    note: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ promoKey: 1 }, { unique: true, sparse: true });

export default mongoose.model("Order", orderSchema);
