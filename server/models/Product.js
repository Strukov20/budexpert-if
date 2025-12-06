import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  sku: { type: String, trim: true },
  stock: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
