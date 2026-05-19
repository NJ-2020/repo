import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cartController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getCart);
router.post('/', authMiddleware, addToCart);
router.put('/:productId', authMiddleware, updateCartItem);
router.delete('/:productId', authMiddleware, removeFromCart);
router.delete('/', authMiddleware, clearCart);

export default router;
