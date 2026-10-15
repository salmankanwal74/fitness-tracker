import Performance from '../models/Performance.js';
import { paginatedFind } from '../utils/paginate.js';

// @desc    Add performance entry
// @route   POST /api/performance
export const addPerformance = async (req, res) => {
  try {
    const { type, exerciseName, value, unit, date } = req.body;

    const entry = await Performance.create({
      user: req.user._id,
      type,
      exerciseName,
      value,
      unit,
      date,
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all performance entries of logged-in user
// @route   GET /api/performance
export const getPerformance = async (req, res) => {
  try {
       const entries = await paginatedFind(Performance, { user: req.user._id }, req, res, { direction: 1 });
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update performance entry
// @route   PUT /api/performance/:id
export const updatePerformance = async (req, res) => {
  try {
    const entry = await Performance.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedEntry = await Performance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete performance entry
// @route   DELETE /api/performance/:id
export const deletePerformance = async (req, res) => {
  try {
    const entry = await Performance.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Performance.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};