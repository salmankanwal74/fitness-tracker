import Workout from '../models/Workout.js';
import { paginatedFind } from '../utils/paginate.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { onWorkoutCreated } from '../utils/notify.js';

// Tags ko clean karne ka helper — string ya array dono handle karta hai
const cleanTags = (tags) => {
  if (!tags) return [];
  const arr = Array.isArray(tags) ? tags : String(tags).split(',');
  return arr
    .map((t) => String(t).trim().toLowerCase())
    .filter((t) => t.length > 0)
    .slice(0, 10); // max 10 tags
};

// @desc    Create new workout
// @route   POST /api/workouts
export const createWorkout = async (req, res) => {
  try {
    const {
      exerciseName,
      category,
      tags,
      sets,
      reps,
      weight,
      notes,
      duration,
      caloriesBurned,
      date,
    } = req.body;

    if (!exerciseName || sets === undefined || reps === undefined) {
      return res
        .status(400)
        .json({ message: 'Exercise name, sets aur reps zaroori hain' });
    }

    const workout = await Workout.create({
      user: req.user._id,
      exerciseName,
      category: category || 'strength',
      tags: cleanTags(tags),
      sets,
      reps,
      weight: weight || 0,
      notes: notes || '',
      duration,
      caloriesBurned,
      date,
    });

    // Notifications (workout complete, streak, goal) - fail ho to bhi workout save rehta hai
    await onWorkoutCreated(req.user, workout);

    res.status(201).json(workout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get workouts of logged-in user (search + filter support)
// @route   GET /api/workouts?search=bench&category=strength&tag=push&from=&to=
export const getWorkouts = async (req, res) => {
  try {
    const { search, category, tag, from, to } = req.query;

    const query = { user: req.user._id };

    if (search) {
           query.exerciseName = { $regex: escapeRegex(search), $options: 'i' };
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (tag) {
            query.tags = String(tag).toLowerCase();
    }
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

        const workouts = await paginatedFind(Workout, query, req, res);
    res.status(200).json(workouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a workout
// @route   PUT /api/workouts/:id
export const updateWorkout = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    if (workout.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updates = { ...req.body };

    // user field kabhi client se change na ho
    delete updates.user;

    if (updates.tags !== undefined) {
      updates.tags = cleanTags(updates.tags);
    }

    const updatedWorkout = await Workout.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedWorkout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a workout
// @route   DELETE /api/workouts/:id
export const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    if (workout.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Workout.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Workout deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};