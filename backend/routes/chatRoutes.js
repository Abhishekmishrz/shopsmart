import { Router } from 'express';
import { chat } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Logged-in users only: every message costs money on OpenAI, and order
// questions need to know who is asking
router.post('/', protect, chat);

export default router;
