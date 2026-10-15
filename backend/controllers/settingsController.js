import User from '../models/User.js';

const THEMES = ['light', 'dark', 'system'];
const WEIGHT_UNITS = ['kg', 'lbs'];
const LENGTH_UNITS = ['cm', 'in'];
const NOTIFICATION_KEYS = ['workoutMilestones', 'streaks', 'weightProgress', 'mealReminders'];

// Database se settings nikal kar clean object banata hai
// (purane users ke paas preferences nahi hoti, un ke liye defaults milte hain)
const buildSettings = (user) => {
  const p = user.preferences || {};
  const n = p.notifications || {};

  return {
    theme: p.theme ?? 'light',
    weightUnit: p.weightUnit ?? 'kg',
    lengthUnit: p.lengthUnit ?? 'cm',
    notifications: {
      workoutMilestones: n.workoutMilestones ?? true,
      streaks: n.streaks ?? true,
      weightProgress: n.weightProgress ?? true,
      mealReminders: n.mealReminders ?? true,
    },
  };
};

// @desc    Get settings of logged-in user
// @route   GET /api/settings
export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(buildSettings(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update settings (sirf wahi fields bhejein jo badalni hain)
// @route   PUT /api/settings
export const updateSettings = async (req, res) => {
  try {
    const { theme, weightUnit, lengthUnit, notifications } = req.body || {};

    if (theme !== undefined && !THEMES.includes(theme)) {
      return res.status(400).json({ message: 'Theme light, dark ya system honi chahiye' });
    }
    if (weightUnit !== undefined && !WEIGHT_UNITS.includes(weightUnit)) {
      return res.status(400).json({ message: 'Weight unit kg ya lbs honi chahiye' });
    }
    if (lengthUnit !== undefined && !LENGTH_UNITS.includes(lengthUnit)) {
      return res.status(400).json({ message: 'Length unit cm ya in honi chahiye' });
    }
    if (notifications !== undefined) {
      if (typeof notifications !== 'object' || notifications === null || Array.isArray(notifications)) {
        return res.status(400).json({ message: 'Notifications ka format galat hai' });
      }
      for (const [key, value] of Object.entries(notifications)) {
        if (!NOTIFICATION_KEYS.includes(key)) {
          return res.status(400).json({ message: `Unknown notification setting: ${key}` });
        }
        if (typeof value !== 'boolean') {
          return res.status(400).json({ message: `${key} true ya false honi chahiye` });
        }
      }
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (theme !== undefined) user.set('preferences.theme', theme);
    if (weightUnit !== undefined) user.set('preferences.weightUnit', weightUnit);
    if (lengthUnit !== undefined) user.set('preferences.lengthUnit', lengthUnit);
    if (notifications !== undefined) {
      for (const [key, value] of Object.entries(notifications)) {
        user.set(`preferences.notifications.${key}`, value);
      }
    }

    await user.save();

    res.status(200).json(buildSettings(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};