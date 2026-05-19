import { Router } from 'express';
import { deleteAccount, updateProfile, changePassword } from '../controllers/accountController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.put('/profile', authMiddleware, updateProfile);
router.put('/password', authMiddleware, changePassword);
router.delete('/', authMiddleware, deleteAccount);

export default router;
