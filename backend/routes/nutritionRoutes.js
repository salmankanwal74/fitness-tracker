import express from 'express';
import {
  addNutrition,
  getNutrition,
  updateNutrition,
  deleteNutrition,
} from '../controllers/nutritionController.js';
import { validateNumbers } from '../middleware/validate.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const validateNutrition = validateNumbers({
  calories: { min: 0, max: 20000, required: true, label: 'Calories' },
  protein: { min: 0, max: 5000, label: 'Protein' },
  carbs: { min: 0, max: 5000, label: 'Carbs' },
  fats: { min: 0, max: 5000, label: 'Fats' },
});

router.route('/').post(protect, validateNutrition, addNutrition).get(protect, getNutrition);
router.route('/:id').put(protect, validateNutrition, updateNutrition).delete(protect, deleteNutrition);

export default router;