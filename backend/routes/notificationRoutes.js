import express from 'express';
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  clearNotifications,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getNotifications).delete(protect, clearNotifications);
// "read-all" ko "/:id" se pehle rakhna zaroori hai
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markRead);
router.delete('/:id', protect, deleteNotification);

export default router;