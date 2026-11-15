import { Router } from 'express';
import {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// Anyone can browse products
router.get('/', getProducts);
router.get('/categories', getCategories); // before '/:id', or "categories" would be read as an id
router.get('/:id', getProductById);

// Only admins can change the catalogue
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
