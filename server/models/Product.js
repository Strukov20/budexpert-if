import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String },
  imagePublicId: { type: String, trim: true },
  images: {
    type: [
      {
        url: { type: String, trim: true },
        publicId: { type: String, trim: true },
      },
    ],
    default: [],
  },
  description: { type: String },
  specs: { type: Map, of: String, default: {} },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
  type: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
  sku: { type: String, trim: true, index: true },
  stock: { type: Number, default: 0, min: 0 },
  unit: { type: String, trim: true },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  productOfWeek: { type: Boolean, default: false, index: true }
}, { timestamps: true });

productSchema.index({ createdAt: -1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
