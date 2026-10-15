import express from 'express';
import {
  submitSupport,
  getMySupportTickets,
  addUserReply,
  adminListTickets,
  adminReply,
  adminSetStatus,
} from '../controllers/supportController.js';
import { validateText } from '../middleware/validate.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

const validateSupport = validateText({ subject: 150, message: 2000 });
const validateReply = validateText({ message: 2000 });

// ---------- User ----------
router.route('/').post(protect, validateSupport, submitSupport).get(protect, getMySupportTickets);
router.post('/:id/reply', protect, validateReply, addUserReply);

// ---------- Admin (sirf role === 'admin') ----------
router.get('/admin/all', protect, adminOnly, adminListTickets);
router.post('/admin/:id/reply', protect, adminOnly, validateReply, adminReply);
router.patch('/admin/:id/status', protect, adminOnly, adminSetStatus);

export default router;