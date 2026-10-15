import mongoose from 'mongoose';

// Ticket ke andar baat-cheet: user aur admin dono ke jawab yahan jama hote hain
const replySchema = new mongoose.Schema(
  {
    from: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const supportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    category: {
      type: String,
      required: true,
      enum: ['bug', 'feedback', 'question', 'other'],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      default: 'open',
      enum: ['open', 'resolved'],
    },
    replies: {
      type: [replySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

supportSchema.index({ user: 1, createdAt: -1 });
// Admin inbox: pehle open tickets, phir sab se naya activity
supportSchema.index({ status: 1, updatedAt: -1 });
const Support = mongoose.model('Support', supportSchema);

export default Support;