import Weight from '../models/Weight.js';
import { paginatedFind } from '../utils/paginate.js';
import { onWeightAdded } from '../utils/notify.js';

// @desc    Add weight entry
// @route   POST /api/weight
export const addWeight = async (req, res) => {
  try {
    const { weight, date } = req.body;

    const weightEntry = await Weight.create({
      user: req.user._id,
      weight,
      date,
    });

       await onWeightAdded(req.user);
     res.status(201).json(weightEntry);
     
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all weight entries of logged-in user
// @route   GET /api/weight
export const getWeights = async (req, res) => {
  try {
     const weights = await paginatedFind(Weight, { user: req.user._id }, req, res, { direction: 1 });
    res.status(200).json(weights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a weight entry
// @route   PUT /api/weight/:id
export const updateWeight = async (req, res) => {
  try {
    const weightEntry = await Weight.findById(req.params.id);

    if (!weightEntry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    if (weightEntry.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedWeight = await Weight.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json(updatedWeight);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a weight entry
// @route   DELETE /api/weight/:id
export const deleteWeight = async (req, res) => {
  try {
    const weightEntry = await Weight.findById(req.params.id);

    if (!weightEntry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    if (weightEntry.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Weight.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Weight entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};