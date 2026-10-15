import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
      enum: [
        'workout_completed',
        'workout_milestone',
        'streak',
        'goal_workouts',
        'goal_weight',
        'goal_calories',
        'weight_progress',
        'follower',
        'forum_reply',
        'support_ticket',
        'support_reply',
        'system',
      ],
    },
    message: {
      type: String,
      required: true,
    },
    // Duplicate notification rokne ke liye (jaise "5th workout" dobara na aaye)
    key: {
      type: String,
    },
    // Click karne par kahan jana hai (jaise /forum/<postId>)
    link: {
      type: String,
      default: '',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, createdAt: -1 });
// Ek user ke liye ek key sirf ek baar
notificationSchema.index(
  { user: 1, key: 1 },
  { unique: true, partialFilterExpression: { key: { $type: 'string' } } }
);
// 90 din baad purani notifications khud delete ho jayen
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;