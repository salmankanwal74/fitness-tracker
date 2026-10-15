import mongoose from 'mongoose';


const weightSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    weight: {
      type: Number,
      required: true,
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

weightSchema.index({ user: 1, date: -1 });
const Weight = mongoose.model('Weight', weightSchema);

export default Weight;