import mongoose from 'mongoose';

export const CATEGORIES = ['Footwear', 'Clothing', 'Electronics', 'Home', 'Accessories'];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: CATEGORIES, message: '{VALUE} is not a valid category' },
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Speeds up the shop filters: "category = X and price between A and B"
productSchema.index({ category: 1, price: 1 });

export default mongoose.model('Product', productSchema);
