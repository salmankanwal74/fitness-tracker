import Measurement from '../models/Measurement.js';
import { paginatedFind } from '../utils/paginate.js';

// @desc    Add measurement entry
// @route   POST /api/measurements
export const addMeasurement = async (req, res) => {
  try {
    const { chest, waist, hips, arms, thighs, date } = req.body;

    const entry = await Measurement.create({
      user: req.user._id,
      chest,
      waist,
      hips,
      arms,
      thighs,
      date,
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all measurement entries of logged-in user
// @route   GET /api/measurements
export const getMeasurements = async (req, res) => {
  try {
       const entries = await paginatedFind(Measurement, { user: req.user._id }, req, res, { direction: 1 });
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update measurement entry
// @route   PUT /api/measurements/:id
export const updateMeasurement = async (req, res) => {
  try {
    const entry = await Measurement.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedEntry = await Measurement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete measurement entry
// @route   DELETE /api/measurements/:id
export const deleteMeasurement = async (req, res) => {
  try {
    const entry = await Measurement.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Measurement.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};