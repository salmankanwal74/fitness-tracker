import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // unique username — sparse: true isliye ke purane users ke paas username nahi hai
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
        // 'admin' sirf .env ki ADMIN_EMAILS list se milta hai (dekhein utils/adminEmails.js)
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
     // Forgot password: token ka sirf hash save hota hai (asli token sirf email mein jaata hai)
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    // Password reset ke baad purane tokens band karne ke liye
    passwordChangedAt: { type: Date },
        // Privacy: user ne Terms aur Privacy Policy kab aur kaunsa version accept kiya
    consent: {
      termsAccepted: { type: Boolean, default: false },
      acceptedAt: { type: Date },
      policyVersion: { type: String },
    },
    
    // Step 3: user ki settings (theme, units, notification preferences)
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'light',
      },
      // Database mein data hamesha kg/cm mein save hota hai;
      // ye unit sirf dikhane ke liye hai
      weightUnit: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg',
      },
      lengthUnit: {
        type: String,
        enum: ['cm', 'in'],
        default: 'cm',
      },
      notifications: {
        workoutMilestones: { type: Boolean, default: true },
        streaks: { type: Boolean, default: true },
        weightProgress: { type: Boolean, default: true },
        mealReminders: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;