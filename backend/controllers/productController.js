import Product, { CATEGORIES } from '../models/Product.js';
import { escapeRegex } from '../utils/escapeRegex.js';

// Sort options the client may ask for. Anything else falls back to newest.
const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name: { name: 1 },
};

// GET /api/products?search=shoe&category=Footwear,Clothing&minPrice=500&maxPrice=2000&inStock=true&sort=price_asc&page=1&limit=12
// Admin table also uses &stock=low (3 or fewer left) or &stock=out (none left)
export const getProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice, inStock, stock, sort } = req.query;
  const filter = {};

  // Search name, brand and description, ignoring upper/lower case
  if (typeof search === 'string' && search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: pattern }, { brand: pattern }, { description: pattern }];
  }

  // One or more categories, comma separated. Unknown names are dropped.
  if (typeof category === 'string' && category) {
    filter.category = { $in: category.split(',').filter((name) => CATEGORIES.includes(name)) };
  }

  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (stock === 'low') filter.stock = { $lte: 3 };
  if (stock === 'out') filter.stock = 0;

  // Build { price: { $gte: 500, $lte: 2000 } } from whichever limits were sent
  const min = Number(minPrice);
  const max = Number(maxPrice);
  if (minPrice && !Number.isNaN(min)) filter.price = { ...filter.price, $gte: min };
  if (maxPrice && !Number.isNaN(max)) filter.price = { ...filter.price, $lte: max };

  // Pagination: page 1 shows items 1-12, page 2 shows 13-24, ...
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);

  // Run the page query and the count at the same time
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(SORTS[sort] || SORTS.newest)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({ products, page, pages: Math.ceil(total / limit), total });
};

// GET /api/products/categories → { categories: [{ name: 'Footwear', count: 6 }, ...] }
export const getCategories = async (req, res) => {
  // Like SQL: SELECT category, COUNT(*) FROM products GROUP BY category
  const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);

  // Keep a fixed order, and show 0 for categories with no products
  const categories = CATEGORIES.map((name) => ({
    name,
    count: counts.find((c) => c._id === name)?.count || 0,
  }));
  res.json({ categories });
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ product });
};

// Only these fields can be set from a request body
const pickProductFields = (body) => {
  const fields = ['name', 'description', 'price', 'category', 'brand', 'stock', 'image'];
  const data = {};
  for (const field of fields) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
};

// POST /api/products (admin)
export const createProduct = async (req, res) => {
  const product = await Product.create(pickProductFields(req.body));
  res.status(201).json({ product });
};

// PUT /api/products/:id (admin)
export const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, pickProductFields(req.body), {
    returnDocument: 'after', // return the updated document, not the old one
    runValidators: true, // apply schema rules (min price, category enum) on update too
  });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ product });
};

// DELETE /api/products/:id (admin)
export const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ message: 'Product deleted' });
};
