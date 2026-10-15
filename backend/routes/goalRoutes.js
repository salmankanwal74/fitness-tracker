import express from 'express';
import { getGoal, updateGoal } from '../controllers/goalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getGoal);
router.put('/', protect, updateGoal);

export default router;