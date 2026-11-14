import { Router } from 'express';
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelMyOrder,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// Every order route needs a logged-in user
router.use(protect);

router.post('/', placeOrder);
router.get('/my', getMyOrders); // must come before '/:id', or "my" would be read as an id
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelMyOrder);

// Admin only
router.get('/', adminOnly, getAllOrders);
router.put('/:id/status', adminOnly, updateOrderStatus);

export default router;
