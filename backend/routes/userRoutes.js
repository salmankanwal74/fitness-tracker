import express from 'express';
import {
  searchUsers,
  followUser,
  unfollowUser,
  getMyFollowers,
  getMyFollowing,
   getSuggestions,
} from '../controllers/socialController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// "/me/..." aur "/search" ko "/:id" se pehle rakhna zaroori hai
router.get('/search', protect, searchUsers);
router.get('/suggestions', protect, getSuggestions);
router.get('/me/followers', protect, getMyFollowers);
router.get('/me/following', protect, getMyFollowing);
router.route('/:id/follow').post(protect, followUser).delete(protect, unfollowUser);

export default router;