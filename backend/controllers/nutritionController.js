import Nutrition from '../models/Nutrition.js';
  import { paginatedFind } from '../utils/paginate.js';
import { onNutritionAdded } from '../utils/notify.js';

// @desc    Ad]d nutrition entry
// @route   POST /api/nutrition
export const addNutrition = async (req, res) => {
  try {
    const { mealType, foodItem, quantity, calories, protein, carbs, fats, date } = req.body;

    const entry = await Nutrition.create({
      user: req.user._id,
      mealType,
      foodItem,
      quantity,
      calories,
      protein,
      carbs,
      fats,
      date,
    });

    await onNutritionAdded(req.user, entry);
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all nutrition entries of logged-in user
// @route   GET /api/nutrition
export const getNutrition = async (req, res) => {
  try {
       const entries = await paginatedFind(Nutrition, { user: req.user._id }, req, res);
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update nutrition entry
// @route   PUT /api/nutrition/:id
export const updateNutrition = async (req, res) => {
  try {
    const entry = await Nutrition.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedEntry = await Nutrition.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete nutrition entry
// @route   DELETE /api/nutrition/:id
export const deleteNutrition = async (req, res) => {
  try {
    const entry = await Nutrition.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Nutrition.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};