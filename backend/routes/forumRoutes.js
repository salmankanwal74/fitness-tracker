import express from 'express';
import {
  getPosts,
  createPost,
  getPost,
  addReply,
  deletePost,
  deleteReply,
} from '../controllers/forumController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getPosts).post(protect, createPost);
router.route('/:id').get(protect, getPost).delete(protect, deletePost);
router.post('/:id/replies', protect, addReply);
router.delete('/:id/replies/:replyId', protect, deleteReply);

export default router;