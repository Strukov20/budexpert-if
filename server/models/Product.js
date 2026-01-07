import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
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
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  sku: { type: String, trim: true },
  stock: { type: Number, default: 0, min: 0 },
  unit: { type: String, trim: true },
  discount: { type: Number, default: 0, min: 0, max: 100 }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
