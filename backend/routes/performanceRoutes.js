import express from 'express';
import {
  addPerformance,
  getPerformance,
  updatePerformance,
  deletePerformance,
} from '../controllers/performanceController.js';
import { validateNumbers } from '../middleware/validate.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const validatePerformance = validateNumbers({
  value: { min: 0, max: 1000000, required: true, label: 'Value' },
});

router.route('/').post(protect, validatePerformance, addPerformance).get(protect, getPerformance);
router.route('/:id').put(protect, validatePerformance, updatePerformance).delete(protect, deletePerformance);

export default router;