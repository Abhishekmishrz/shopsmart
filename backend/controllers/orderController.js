import mongoose from 'mongoose';
import Order, { ORDER_STATUSES } from '../models/Order.js';
import Product from '../models/Product.js';

// Which status an order may move to from its current status
const NEXT_STATUS = {
  Placed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

// Puts stock back, e.g. when an order is cancelled or fails halfway
const restock = (items) =>
  Promise.all(
    items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } }))
  );

// Changes the status only if the order is still in the "from" status.
// If two requests arrive together, only the first one matches, so stock
// can never be put back twice.
const moveStatus = async (filter, from, to) => {
  const order = await Order.findOneAndUpdate(
    { ...filter, status: from },
    { status: to },
    { returnDocument: 'after' }
  );
  if (order && to === 'Cancelled') await restock(order.items);
  return order;
};

// POST /api/orders
// Body: { items: [{ product: "<id>", qty: 2 }], shippingAddress: {...} }
export const placeOrder = async (req, res) => {
  const { items, shippingAddress } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Your cart is empty');
  }

  // Check every line, and add up quantities if the same product appears twice
  const wanted = new Map();
  for (const item of items) {
    const qty = Number(item?.qty);
    if (!mongoose.isValidObjectId(item?.product) || !Number.isInteger(qty) || qty < 1) {
      res.status(400);
      throw new Error('Each item needs a valid product and quantity');
    }
    const id = String(item.product);
    wanted.set(id, (wanted.get(id) || 0) + qty);
  }

  const reserved = []; // stock we have already taken, in case we must give it back
  try {
    for (const [productId, qty] of wanted) {
      // Atomic: "reduce stock by qty, but only if at least qty is left".
      // Two buyers of the last item can't both pass this check.
      const product = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { returnDocument: 'after' }
      );

      if (!product) {
        const existing = await Product.findById(productId).select('name stock');
        res.status(409);
        throw new Error(
          existing
            ? `Only ${existing.stock} left of ${existing.name}`
            : 'A product in your cart is no longer available'
        );
      }

      // Name and price come from the database, never from the client
      reserved.push({ product: product._id, name: product.name, price: product.price, qty });
    }

    const totalAmount = reserved.reduce((sum, item) => sum + item.price * item.qty, 0);

    const order = await Order.create({
      user: req.user._id,
      items: reserved,
      totalAmount,
      shippingAddress,
    });
    res.status(201).json({ order });
  } catch (err) {
    // Out of stock, bad address, etc.: undo what we took, then report the error
    await restock(reserved);
    throw err;
  }
};

// GET /api/orders/my
export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
};

// GET /api/orders/:id (the owner or an admin)
export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  // Someone else's order looks the same as a missing one, so ids can't be probed
  const isOwner = order && order.user._id.equals(req.user._id);
  if (!order || (!isOwner && req.user.role !== 'admin')) {
    res.status(404);
    throw new Error('Order not found');
  }
  res.json({ order });
};

// PUT /api/orders/:id/cancel (the owner, only before it ships)
export const cancelMyOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.status !== 'Placed') {
    res.status(400);
    throw new Error(
      order.status === 'Cancelled'
        ? 'This order is already cancelled'
        : `This order is already ${order.status.toLowerCase()} and can't be cancelled`
    );
  }

  const updated = await moveStatus({ _id: order._id }, 'Placed', 'Cancelled');
  if (!updated) {
    res.status(409);
    throw new Error('This order was just updated, please refresh');
  }
  res.json({ order: updated });
};

// GET /api/orders?status=Placed&page=1&limit=20 (admin)
export const getAllOrders = async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (ORDER_STATUSES.includes(status)) filter.status = status;

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email') // like a SQL JOIN: swap the user id for name and email
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, page, pages: Math.ceil(total / limit), total });
};

// PUT /api/orders/:id/status (admin)
// Body: { status: "Shipped" }
export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!NEXT_STATUS[order.status].includes(status)) {
    res.status(400);
    throw new Error(`Can't change status from ${order.status} to ${status}`);
  }

  const updated = await moveStatus({ _id: order._id }, order.status, status);
  if (!updated) {
    res.status(409);
    throw new Error('This order was just updated, please refresh');
  }
  res.json({ order: updated });
};
