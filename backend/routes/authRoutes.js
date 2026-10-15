import express from 'express';
import {
  signup,
  login,
  updateProfile,
  changePassword,
  deleteAccount,
  forgotPassword,
  resetPassword,
  exportMyData,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.delete('/account', protect, deleteAccount);
router.get('/export', protect, exportMyData);

export default router;