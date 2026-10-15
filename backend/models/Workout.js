import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    exerciseName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['strength', 'cardio', 'flexibility', 'sports', 'other'],
      default: 'strength',
    },
    tags: {
      type: [String],
      default: [],
    },
    sets: {
      type: Number,
      required: true,
    },
    reps: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number, // kg mein — kitna wazan uthaya
      default: 0,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    duration: {
      type: Number, // minutes mein
    },
    caloriesBurned: {
      type: Number,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Search aur filter fast karne ke liye index
workoutSchema.index({ user: 1, date: -1 });
workoutSchema.index({ user: 1, category: 1 });

const Workout = mongoose.model('Workout', workoutSchema);

export default Workout;