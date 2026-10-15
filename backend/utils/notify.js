import Notification from '../models/Notification.js';
import Workout from '../models/Workout.js';
import Weight from '../models/Weight.js';
import Nutrition from '../models/Nutrition.js';
import Goal from '../models/Goal.js';

// Kaunsi notification kis Settings toggle se control hoti hai
const PREF_FOR_TYPE = {
  workout_completed: 'workoutMilestones',
  workout_milestone: 'workoutMilestones',
  goal_workouts: 'workoutMilestones',
  streak: 'streaks',
  weight_progress: 'weightProgress',
  goal_weight: 'weightProgress',
  goal_calories: 'mealReminders',
};

const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfWeek = (d) => {
  const diffToMonday = (d.getDay() + 6) % 7; // Monday = hafte ka pehla din
  return addDays(startOfDay(d), -diffToMonday);
};

// Notification banata hai (user ki Settings ka khayal rakhta hai, duplicate key ko ignore karta hai)
export const createNotification = async (user, { type, message, key, link = '' }) => {
  try {
    const pref = PREF_FOR_TYPE[type];
    if (pref && user.preferences?.notifications?.[pref] === false) return null;
    return await Notification.create({ user: user._id, type, message, key, link });
  } catch (error) {
    if (error.code !== 11000) console.error('[notify] notification nahi bani:', error.message);
    return null;
  }
};

// ---------- Workout add hone par ----------
export const onWorkoutCreated = async (user, workout) => {
  try {
    await createNotification(user, {
      type: 'workout_completed',
      message: `Workout complete: ${workout.exerciseName} (${workout.sets} x ${workout.reps})`,
      key: `workout-${workout._id}`,
    });

    // Milestone: har 5th workout
    const total = await Workout.countDocuments({ user: user._id });
    if (total > 0 && total % 5 === 0) {
      await createNotification(user, {
        type: 'workout_milestone',
        message: `Aap ne ${total} workouts complete kar liye! Shabash!`,
        key: `milestone-${total}`,
      });
    }

    const now = new Date();
    const workoutDate = new Date(workout.date || now);

    // Streak: lagataar din (aaj se peechay), sirf tab check hota hai jab workout aaj ki ho
    if (dayKey(workoutDate) === dayKey(now)) {
      const recent = await Workout.find({
        user: user._id,
        date: { $gte: addDays(startOfDay(now), -29) },
      }).select('date');
      const days = new Set(recent.map((w) => dayKey(new Date(w.date))));
      let streak = 0;
      for (let i = 0; i < 30 && days.has(dayKey(addDays(startOfDay(now), -i))); i++) streak++;

      if ([3, 7, 14, 30].includes(streak)) {
        await createNotification(user, {
          type: 'streak',
          message: `${streak} din ki workout streak! Aap kamaal kar rahe hain!`,
          key: `streak-${streak}-${dayKey(now)}`,
        });
      }
    }

    // Weekly goal: is hafte ki workouts target tak pohanch gayin
    const goal = await Goal.findOne({ user: user._id });
    const target = goal?.weeklyWorkoutTarget;
    if (target) {
      const weekStart = startOfWeek(now);
      if (workoutDate >= weekStart) {
        const weekCount = await Workout.countDocuments({
          user: user._id,
          date: { $gte: weekStart },
        });
        if (weekCount >= target) {
          await createNotification(user, {
            type: 'goal_workouts',
            message: `Goal achieved! Is hafte ka ${target} workouts ka target pura ho gaya.`,
            key: `goal-workouts-${dayKey(weekStart)}`,
          });
        }
      }
    }
  } catch (error) {
    console.error('[notify] onWorkoutCreated:', error.message);
  }
};

// ---------- Weight add hone par ----------
export const onWeightAdded = async (user) => {
  try {
    const weights = await Weight.find({ user: user._id }).sort({ date: 1 });
    if (weights.length < 2) return;

    const first = weights[0].weight;
    const latest = weights[weights.length - 1].weight;

    const goal = await Goal.findOne({ user: user._id });
    const target = goal?.targetWeight;
    if (target && first !== target) {
      const reached = first > target ? latest <= target : latest >= target;
      if (reached) {
        await createNotification(user, {
          type: 'goal_weight',
          message: `Goal achieved! Aap ne apna target weight (${target} kg) hasil kar liya.`,
          key: `goal-weight-${target}`,
        });
      }
    }

    // Shuru se ab tak har poora kg kam hone par
    const lost = Math.floor(first - latest);
    if (lost >= 1) {
      await createNotification(user, {
        type: 'weight_progress',
        message: `Shuru se ab tak aap ka ${lost} kg weight kam ho chuka hai. Keep going!`,
        key: `weight-progress-${lost}`,
      });
    }
  } catch (error) {
    console.error('[notify] onWeightAdded:', error.message);
  }
};

// ---------- Khana log hone par ----------
export const onNutritionAdded = async (user, entry) => {
  try {
    const goal = await Goal.findOne({ user: user._id });
    const limit = goal?.dailyCalorieTarget;
    if (!limit) return;

    const day = startOfDay(new Date(entry.date || Date.now()));
    const entries = await Nutrition.find({
      user: user._id,
      date: { $gte: day, $lt: addDays(day, 1) },
    }).select('calories');
    const total = entries.reduce((sum, e) => sum + (e.calories || 0), 0);

    if (total > limit) {
      await createNotification(user, {
        type: 'goal_calories',
        message: `Alert: aaj ki calories (${total}) apni limit (${limit}) se zyada ho gayi hain.`,
        key: `calories-${dayKey(day)}`,
      });
    }
  } catch (error) {
    console.error('[notify] onNutritionAdded:', error.message);
  }
};