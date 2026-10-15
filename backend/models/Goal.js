import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true, // har user ka sirf ek hi Goal document
    },
    targetWeight: {
      type: Number, // kg mein
    },
    weeklyWorkoutTarget: {
      type: Number, // fi hafta kitni workouts
      default: 3,
    },
    dailyCalorieTarget: {
      type: Number, // roz ki calorie limit
    },
    workoutReminder: {
      enabled: { type: Boolean, default: false },
      time: { type: String, default: '18:00' }, // 24-hour "HH:MM"
    },
    mealReminder: {
      enabled: { type: Boolean, default: false },
      time: { type: String, default: '20:00' },
    },
    // --- Suggested-goal calculation ke liye inputs ---
    // Ye sirf estimate banane ke kaam aate hain, dobara dobara poochne
    // se bachne ke liye save kar lete hain.
    suggestionInputs: {
      age: { type: Number },
      gender: { type: String, enum: ['male', 'female', 'other'] },
      heightCm: { type: Number },
      activityLevel: {
        type: String,
        enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
        default: 'moderate',
      },
      goalDirection: {
        type: String,
        enum: ['lose', 'maintain', 'gain'],
        default: 'maintain',
      },
    },
  },
  {
    timestamps: true,
  }
);

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;