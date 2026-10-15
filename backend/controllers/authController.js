import User from '../models/User.js';
import Workout from '../models/Workout.js';
import Nutrition from '../models/Nutrition.js';
import Weight from '../models/Weight.js';
import Measurement from '../models/Measurement.js';
import Performance from '../models/Performance.js';
import Support from '../models/Support.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';
import Goal from '../models/Goal.js';
import Notification from '../models/Notification.js';
import Follow from '../models/Follow.js';
import ForumPost from '../models/ForumPost.js';
import { applyAdminRole } from '../utils/adminEmails.js';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
// Jab bhi Privacy Policy ya Terms badlein, ye date badal dein
const POLICY_VERSION = '2026-10-10';

// Helper: JWT token generate karne ke liye
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Helper: frontend ko jo user data bhejna hai (password kabhi nahi)
const userResponse = (user, token) => ({
  _id: user._id,
  name: user.name,
  username: user.username || '',
  email: user.email,
  profileImage: user.profileImage,
  role: user.role || 'user',
  token,
});

// @desc    Register new user
// @route   POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { name, password } = req.body || {};
    const email = (req.body?.email || '').trim().toLowerCase();
    const username = (req.body?.username || '').trim().toLowerCase();

    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: 'Name, username, email aur password zaroori hain' });
    }
    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        message: 'Username 3-20 characters ka ho, sirf a-z, 0-9 aur underscore (_) allowed hain',
      });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Sahi email address likhein' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ message: `Password kam az kam ${MIN_PASSWORD_LENGTH} characters ka ho` });
    }
        // Consent: Terms aur Privacy Policy accept karna zaroori hai
    if (req.body?.acceptTerms !== true) {
      return res
        .status(400)
        .json({ message: 'Account banane ke liye Terms aur Privacy Policy se agree karna zaroori hai' });
    }

    // Pehle se exist to nahi karta?
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Is email se account pehle se bana hua hai' });
    }
    if (await User.findOne({ username })) {
      return res.status(400).json({ message: 'Ye username pehle se le liya gaya hai' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

   const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      consent: { termsAccepted: true, acceptedAt: new Date(), policyVersion: POLICY_VERSION },
    });
    await applyAdminRole(user);
    res.status(201).json(userResponse(user, generateToken(user._id)));
  } catch (error) {
    // Do log ek saath signup karein to database ka unique index bhi error deta hai
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email ya username pehle se maujood hai' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user (email YA username se)
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { password } = req.body || {};
    // "identifier" naya naam hai; "email" purane frontend ke liye chalta rahega

    const rawIdentifier = (req.body?.identifier || req.body?.email || '').trim();

    if (!rawIdentifier || !password) {
      return res.status(400).json({ message: 'Email/username aur password likhein' });
    }

    const lower = rawIdentifier.toLowerCase();

    const user = await User.findOne({
      $or: [{ email: rawIdentifier }, { email: lower }, { username: lower }],
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.status(200).json(userResponse(user, generateToken(user._id)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update profile (name, username, email, profileImage)
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, profileImage } = req.body || {};

    // --- Name ---
    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ message: 'Name khali nahi ho sakta' });
      }
      user.name = String(name).trim();
    }

    // --- Username ---
    if (req.body?.username !== undefined) {
      const username = String(req.body.username).trim().toLowerCase();

      if (!USERNAME_REGEX.test(username)) {
        return res.status(400).json({
          message: 'Username 3-20 characters ka ho, sirf a-z, 0-9 aur underscore (_) allowed hain',
        });
      }
      if (username !== user.username) {
        const taken = await User.findOne({ username, _id: { $ne: user._id } });
        if (taken) {
          return res.status(400).json({ message: 'Ye username pehle se le liya gaya hai' });
        }
        user.username = username;
      }
    }

    // --- Email ---
    if (req.body?.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();

      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ message: 'Sahi email address likhein' });
      }
      if (email !== user.email) {
        const taken = await User.findOne({ email, _id: { $ne: user._id } });
        if (taken) {
          return res.status(400).json({ message: 'Ye email pehle se kisi aur account par hai' });
        }
        user.email = email;
      }
    }

    // --- Profile image ---
    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    const updatedUser = await user.save();

    res
      .status(200)
      .json(userResponse(updatedUser, req.headers.authorization.split(' ')[1]));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email ya username pehle se maujood hai' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Purana aur naya password dono likhein' });
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      
      return res
        .status(400)
        .json({ message: `Naya password kam az kam ${MIN_PASSWORD_LENGTH} characters ka ho` });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Purana password galat hai' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'Naya password purane se different hona chahiye' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password kamyabi se change ho gaya' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Delete account + saara data
// @route   DELETE /api/auth/account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body || {};

    if (!password) {
      return res.status(400).json({ message: 'Account delete karne ke liye password likhein' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password galat hai' });
    }

    // Pehle user ka saara data delete karo, phir user khud
    await Promise.all([
      Workout.deleteMany({ user: user._id }),
      Nutrition.deleteMany({ user: user._id }),
      Weight.deleteMany({ user: user._id }),
      Measurement.deleteMany({ user: user._id }),
      Performance.deleteMany({ user: user._id }),
      Support.deleteMany({ user: user._id }),
      Goal.deleteMany({ user: user._id }),
      Notification.deleteMany({ user: user._id }),
      // Community/Forum: follows, posts aur dusron ki posts par kiye gaye replies
      Follow.deleteMany({ $or: [{ follower: user._id }, { following: user._id }] }),
      ForumPost.deleteMany({ author: user._id }),
      ForumPost.updateMany({ 'replies.author': user._id }, { $pull: { replies: { author: user._id } } }),
    ]);
    await user.deleteOne();

    res.status(200).json({ message: 'Account aur saara data delete ho gaya' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// @desc    Forgot password: reset link email karo
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Sahi email address likhein' });
    }

    // Hamesha ek jaisa jawab dete hain, taake koi guess na kar sake ke kaunsi email registered hai
    const genericReply = {
      message: 'Agar yeh email registered hai to password reset ka link bhej diya gaya hai',
    };

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json(genericReply);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minute
    await user.save({ validateBeforeSave: false });

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Fitness Tracker - Password reset',
        text:
          `Assalam o Alaikum ${user.name},\n\n` +
          `Password reset karne ke liye yeh link kholein (30 minute tak chalega):\n${resetUrl}\n\n` +
          `Agar aap ne yeh request nahi ki to is email ko nazar andaz kar dein.`,
      });
    } catch (mailError) {
      console.error('[forgotPassword] email nahi gayi:', mailError.message);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(200).json(genericReply);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password (email wale token se)
// @route   POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body || {};

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ message: `Naya password kam az kam ${MIN_PASSWORD_LENGTH} characters ka ho` });
    }

    const user = await User.findOne({
      passwordResetToken: hashToken(req.params.token),
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ message: 'Reset link galat hai ya expire ho gaya hai' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Reset ke baad seedha login kar dete hain
    res.status(200).json(userResponse(user, generateToken(user._id)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    User ka saara data download karo (GDPR: right of access / data portability)
// @route   GET /api/auth/export
export const exportMyData = async (req, res) => {
  try {
    const uid = req.user._id;

    const [workouts, nutrition, weights, measurements, performance, goal, notifications, support] =
      await Promise.all([
        Workout.find({ user: uid }).sort({ date: 1 }).lean(),
        Nutrition.find({ user: uid }).sort({ date: 1 }).lean(),
        Weight.find({ user: uid }).sort({ date: 1 }).lean(),
        Measurement.find({ user: uid }).sort({ date: 1 }).lean(),
        Performance.find({ user: uid }).sort({ date: 1 }).lean(),
        Goal.findOne({ user: uid }).lean(),
        Notification.find({ user: uid }).sort({ createdAt: 1 }).lean(),
        Support.find({ user: uid }).sort({ createdAt: 1 }).lean(),
      ]);

    // Password ya reset token kabhi export nahi hota
    const u = req.user;
    const data = {
      exportedAt: new Date().toISOString(),
      profile: {
        name: u.name,
        username: u.username || '',
        email: u.email,
        profileImage: u.profileImage || '',
        preferences: u.preferences,
        consent: u.consent,
        createdAt: u.createdAt,
      },
      goals: goal || null,
      workouts,
      nutrition,
      weight: weights,
      measurements,
      performance,
      notifications,
      supportTickets: support,
    };

    res.setHeader('Content-Disposition', 'attachment; filename="my-fitness-data.json"');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};