import express from 'express';
import {
  addWeight,
  getWeights,
  updateWeight,
  deleteWeight,
} from '../controllers/weightController.js';
import { validateNumbers } from '../middleware/validate.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const validateWeight = validateNumbers({
  weight: { min: 1, max: 700, required: true, label: 'Weight' },
});

router.route('/').post(protect, validateWeight, addWeight).get(protect, getWeights);
router.route('/:id').put(protect, validateWeight, updateWeight).delete(protect, deleteWeight);

export default router;