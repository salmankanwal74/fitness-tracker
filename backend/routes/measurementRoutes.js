import express from 'express';
import {
  addMeasurement,
  getMeasurements,
  updateMeasurement,
  deleteMeasurement,
} from '../controllers/measurementController.js';
import { validateNumbers } from '../middleware/validate.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const validateMeasurement = validateNumbers({
  chest: { min: 1, max: 400, label: 'Chest' },
  waist: { min: 1, max: 400, label: 'Waist' },
  hips: { min: 1, max: 400, label: 'Hips' },
  arms: { min: 1, max: 200, label: 'Arms' },
  thighs: { min: 1, max: 300, label: 'Thighs' },
});

router.route('/').post(protect, validateMeasurement, addMeasurement).get(protect, getMeasurements);
router.route('/:id').put(protect, validateMeasurement, updateMeasurement).delete(protect, deleteMeasurement);

export default router;