import Goal from '../models/Goal.js';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/; // "HH:MM", 24-hour
const GENDERS = ['male', 'female', 'other'];
const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const GOAL_DIRECTIONS = ['lose', 'maintain', 'gain'];

// @desc    Get logged-in user's goal (creates a default one if none exists)
// @route   GET /api/goals
export const getGoal = async (req, res) => {
  try {
    let goal = await Goal.findOne({ user: req.user._id });

    if (!goal) {
      goal = await Goal.create({ user: req.user._id });
    }

    res.status(200).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update (or create) logged-in user's goal
// @route   PUT /api/goals
export const updateGoal = async (req, res) => {
  try {
    const {
      targetWeight,
      weeklyWorkoutTarget,
      dailyCalorieTarget,
      workoutReminder,
      mealReminder,
      suggestionInputs,
    } = req.body || {};

    if (weeklyWorkoutTarget !== undefined && (weeklyWorkoutTarget < 0 || weeklyWorkoutTarget > 21)) {
      return res.status(400).json({ message: 'Weekly workout target 0 se 21 ke darmiyan honi chahiye' });
    }
    if (targetWeight !== undefined && targetWeight !== null && targetWeight <= 0) {
      return res.status(400).json({ message: 'Target weight sahi likhein' });
    }
    if (dailyCalorieTarget !== undefined && dailyCalorieTarget !== null && dailyCalorieTarget <= 0) {
      return res.status(400).json({ message: 'Daily calorie target sahi likhein' });
    }

    for (const reminder of [workoutReminder, mealReminder]) {
      if (reminder?.time !== undefined && !TIME_REGEX.test(reminder.time)) {
        return res.status(400).json({ message: 'Reminder time HH:MM format mein honi chahiye' });
      }
    }

    if (suggestionInputs) {
      const { age, gender, heightCm, activityLevel, goalDirection } = suggestionInputs;
      if (age !== undefined && age !== null && (age < 10 || age > 100)) {
        return res.status(400).json({ message: 'Age sahi likhein (10-100)' });
      }
      if (gender !== undefined && gender !== null && !GENDERS.includes(gender)) {
        return res.status(400).json({ message: 'Gender sahi select karein' });
      }
      if (heightCm !== undefined && heightCm !== null && (heightCm < 100 || heightCm > 250)) {
        return res.status(400).json({ message: 'Height sahi likhein (cm mein)' });
      }
      if (activityLevel !== undefined && !ACTIVITY_LEVELS.includes(activityLevel)) {
        return res.status(400).json({ message: 'Activity level sahi select karein' });
      }
      if (goalDirection !== undefined && !GOAL_DIRECTIONS.includes(goalDirection)) {
        return res.status(400).json({ message: 'Goal direction sahi select karein' });
      }
    }

    let goal = await Goal.findOne({ user: req.user._id });
    if (!goal) {
      goal = new Goal({ user: req.user._id });
    }

    if (targetWeight !== undefined) goal.targetWeight = targetWeight;
    if (weeklyWorkoutTarget !== undefined) goal.weeklyWorkoutTarget = weeklyWorkoutTarget;
    if (dailyCalorieTarget !== undefined) goal.dailyCalorieTarget = dailyCalorieTarget;
    if (workoutReminder?.enabled !== undefined) goal.workoutReminder.enabled = workoutReminder.enabled;
    if (workoutReminder?.time !== undefined) goal.workoutReminder.time = workoutReminder.time;
    if (mealReminder?.enabled !== undefined) goal.mealReminder.enabled = mealReminder.enabled;
    if (mealReminder?.time !== undefined) goal.mealReminder.time = mealReminder.time;

    if (suggestionInputs) {
      goal.suggestionInputs = goal.suggestionInputs || {};
      const { age, gender, heightCm, activityLevel, goalDirection } = suggestionInputs;
      if (age !== undefined) goal.suggestionInputs.age = age;
      if (gender !== undefined) goal.suggestionInputs.gender = gender;
      if (heightCm !== undefined) goal.suggestionInputs.heightCm = heightCm;
      if (activityLevel !== undefined) goal.suggestionInputs.activityLevel = activityLevel;
      if (goalDirection !== undefined) goal.suggestionInputs.goalDirection = goalDirection;
    }

    await goal.save();

    res.status(200).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};