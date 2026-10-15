import mongoose from 'mongoose';

const followSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Ek user ek hi user ko ek baar follow kar sakta hai
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1 });

// Apne aap ko follow karna model level par bhi block
followSchema.pre('validate', function () {
  if (this.follower && this.following && this.follower.equals(this.following)) {
    throw new Error('Aap khud ko follow nahi kar sakte');
  }
});

export default mongoose.model('Follow', followSchema);