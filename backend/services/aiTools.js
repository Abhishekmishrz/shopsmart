import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product, { CATEGORIES } from '../models/Product.js';
import { escapeRegex } from '../utils/escapeRegex.js';

// What the AI is told it can call. OpenAI reads the names, descriptions and
// JSON Schema parameters, and decides when to call which tool with which arguments.
// The AI never touches the database itself: it asks, and our code runs the query.
export const tools = [
  {
    type: 'function',
    function: {
      name: 'searchProducts',
      description:
        'Search the ShopSmart catalogue. Use for any request to find, recommend or compare products. Returns at most 5 products, cheapest first.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'A few keywords, e.g. "running shoes" or "bottle". Leave empty to browse a category.' },
          category: {
            type: 'string',
            enum: CATEGORIES,
            description:
              'Only if clearly implied. Footwear: shoes, sneakers, boots, sliders. Clothing: tees, shirts, jackets, chinos, shorts, socks. Electronics: earbuds, headphones, speakers, chargers, fitness bands. Home: water bottles, mugs, lamps, bedsheets, lunch boxes. Accessories: backpacks, wallets, sunglasses, watches.',
          },
          minPrice: { type: 'number', description: 'Minimum price in rupees' },
          maxPrice: { type: 'number', description: 'Maximum price in rupees' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getProductDetails',
      description: 'Get full details (description, stock) of one product by its id from a previous search.',
      parameters: {
        type: 'object',
        properties: { productId: { type: 'string' } },
        required: ['productId'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getMyOrderStatus',
      description:
        "Get the logged-in customer's own orders and their status. Pass an order number like #SS-1A2B3C to get one order; leave it out for the 3 most recent.",
      parameters: {
        type: 'object',
        properties: { orderNumber: { type: 'string' } },
        additionalProperties: false,
      },
    },
  },
];

// Only the fields the AI and the chat cards need
const shortProduct = (p) => ({ id: p._id.toString(), name: p.name, brand: p.brand, category: p.category, price: p.price, stock: p.stock });

const searchProducts = async ({ query = '', category, minPrice, maxPrice }) => {
  const filter = { stock: { $gt: 0 } }; // only suggest things that can be bought

  // Every keyword must appear somewhere. "shoes" → "shoe", so it also matches "Shoe".
  const words = String(query)
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map((w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w));
  if (words.length) {
    filter.$and = words.map((w) => {
      const pattern = new RegExp(escapeRegex(w), 'i');
      return { $or: [{ name: pattern }, { brand: pattern }, { description: pattern }, { category: pattern }] };
    });
  }

  if (typeof minPrice === 'number') filter.price = { ...filter.price, $gte: minPrice };
  if (typeof maxPrice === 'number') filter.price = { ...filter.price, $lte: maxPrice };

  const find = (f) => Product.find(f).sort({ price: 1 }).limit(5);

  if (CATEGORIES.includes(category)) {
    const inCategory = await find({ ...filter, category });
    if (inCategory.length) return { products: inCategory.map(shortProduct) };
    // The AI may guess the wrong category (a bottle under "Accessories"), so try once more without it
    const anywhere = await find(filter);
    return { note: `Nothing in ${category}; these match in other categories`, products: anywhere.map(shortProduct) };
  }

  return { products: (await find(filter)).map(shortProduct) };
};

const getProductDetails = async ({ productId }) => {
  if (!mongoose.isValidObjectId(productId)) return { error: 'Product not found' };
  const product = await Product.findById(productId);
  if (!product) return { error: 'Product not found' };
  return { product: { ...shortProduct(product), description: product.description } };
};

// Scoped to the logged-in user: the filter always includes user = req.user._id,
// so even if the AI is tricked into asking for someone else's order, it gets nothing.
const getMyOrderStatus = async ({ orderNumber }, user) => {
  const filter = { user: user._id };

  if (orderNumber) {
    const ending = String(orderNumber).replace(/^#?SS-/i, '').trim();
    if (!/^[0-9a-f]{6,24}$/i.test(ending)) return { error: 'That is not a valid order number' };
    filter.$expr = { $regexMatch: { input: { $toString: '$_id' }, regex: `${ending}$`, options: 'i' } };
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(3);
  if (orders.length === 0) return { error: orderNumber ? 'No order with that number on your account' : 'You have no orders yet' };

  return {
    orders: orders.map((o) => ({
      orderNumber: `#SS-${o._id.toString().slice(-6).toUpperCase()}`,
      status: o.status,
      total: o.totalAmount,
      placedOn: o.createdAt.toDateString(),
      items: o.items.map((i) => `${i.name} x${i.qty}`),
    })),
  };
};

const handlers = { searchProducts, getProductDetails, getMyOrderStatus };

// Runs the tool the AI asked for. Unknown names or bad arguments become an error
// message the AI can read, instead of crashing the request.
export const runTool = async (name, rawArgs, user) => {
  const handler = handlers[name];
  if (!handler) return { error: `Unknown tool ${name}` };

  let args;
  try {
    args = JSON.parse(rawArgs || '{}');
  } catch {
    return { error: 'Arguments were not valid JSON' };
  }
  return handler(args, user);
};
