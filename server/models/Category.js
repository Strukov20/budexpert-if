import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  },
  { timestamps: true }
);

CategorySchema.index({ parent: 1, name: 1 }, { unique: true });

export default mongoose.model("Category", CategorySchema);
