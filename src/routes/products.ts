import { Router } from 'express';
import {
  getProducts,
  getProductDetail,
  getProductReviews,
  getRelatedProducts,
  createReview,
  createProduct,
} from '../controllers/productController';
import { authMiddleware } from '../middleware/auth';
import { uploadProduct, uploadReview } from '../middleware/upload';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductDetail);
router.get('/:id/reviews', getProductReviews);
router.get('/:id/related', getRelatedProducts);

// Auth required routes
router.post('/:id/reviews', authMiddleware, uploadReview.array('images', 5), createReview);
router.post('/', authMiddleware, uploadProduct.array('images', 10), createProduct);

export default router;
