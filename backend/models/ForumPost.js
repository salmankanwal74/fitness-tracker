import mongoose from 'mongoose';

export const MAX_REPLIES = 200;

const replySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

const forumPostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    replies: {
      type: [replySchema],
      default: [],
      validate: {
        validator: (v) => v.length <= MAX_REPLIES,
        message: `Is post par ${MAX_REPLIES} se zyada replies nahi ho sakti`,
      },
    },
  },
  { timestamps: true }
);

forumPostSchema.index({ createdAt: -1 });
forumPostSchema.index({ 'replies.author': 1 });

export default mongoose.model('ForumPost', forumPostSchema);