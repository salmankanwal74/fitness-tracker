import express from 'express';
import {
  createWorkout,
  getWorkouts,
  updateWorkout,
  deleteWorkout,
} from '../controllers/workoutController.js';
import { validateNumbers } from '../middleware/validate.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const validateWorkout = validateNumbers({
  sets: { min: 1, max: 1000, required: true, label: 'Sets' },
  reps: { min: 1, max: 10000, required: true, label: 'Reps' },
  weight: { min: 0, max: 1000, label: 'Weight' },
  duration: { min: 0, max: 1440, label: 'Duration' },
  caloriesBurned: { min: 0, max: 20000, label: 'Calories burned' },
});

router.route('/').post(protect, validateWorkout, createWorkout).get(protect, getWorkouts);
router.route('/:id').put(protect, validateWorkout, updateWorkout).delete(protect, deleteWorkout);

export default router;