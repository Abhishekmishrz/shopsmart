import mongoose from 'mongoose';

export const ORDER_STATUSES = ['Placed', 'Shipped', 'Delivered', 'Cancelled'];

// One line in an order. Name and price are copied from the product
// so the order still shows what was paid even if the product changes later.
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [(items) => items.length > 0, 'Order must have at least one item'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: { values: ORDER_STATUSES, message: '{VALUE} is not a valid status' },
      default: 'Placed',
    },
    shippingAddress: {
      fullName: { type: String, required: [true, 'Full name is required'] },
      phone: {
        type: String,
        required: [true, 'Phone is required'],
        match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'],
      },
      address: { type: String, required: [true, 'Address is required'] },
      city: { type: String, required: [true, 'City is required'] },
      state: { type: String, required: [true, 'State is required'] },
      pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        match: [/^\d{6}$/, 'Enter a valid 6-digit pincode'],
      },
    },
    paymentMethod: {
      type: String,
      enum: ['COD'],
      default: 'COD',
    },
  },
  { timestamps: true }
);

// Speeds up "My orders": find by user, newest first
orderSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
