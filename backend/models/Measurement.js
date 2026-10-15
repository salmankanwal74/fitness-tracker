import mongoose from 'mongoose';

const measurementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    chest: {
      type: Number,
    },
    waist: {
      type: Number,
    },
    hips: {
      type: Number,
    },
    arms: {
      type: Number,
    },
    thighs: {
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
measurementSchema.index({ user: 1, date: -1 });
const Measurement = mongoose.model('Measurement', measurementSchema);

export default Measurement;