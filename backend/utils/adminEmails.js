import User from '../models/User.js';
import logger from './logger.js';

// .env mein:  ADMIN_EMAILS=aap@example.com,dusra@example.com
// In emails wale accounts hi admin banenge. Koi bhi aur signup se admin nahi ban sakta.
export const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isAdminEmail = (email) => getAdminEmails().includes(String(email || '').trim().toLowerCase());

// Server start par: .env ki list ke mutabiq saare roles theek kar deta hai
// (list se email hata dein to restart ke baad wo admin nahi rehta)
export const syncAdminRoles = async () => {
  try {
    const emails = getAdminEmails();
    const collation = { locale: 'en', strength: 2 }; // email ka case farq na kare
    const promoted = await User.updateMany(
      { email: { $in: emails }, role: { $ne: 'admin' } },
      { $set: { role: 'admin' } },
      { collation }
    );
    const demoted = await User.updateMany(
      { email: { $nin: emails }, role: 'admin' },
      { $set: { role: 'user' } },
      { collation }
    );
    logger.info('Admin roles sync', {
      configured: emails.length,
      promoted: promoted.modifiedCount,
      demoted: demoted.modifiedCount,
    });
  } catch (error) {
    logger.error('Admin roles sync nahi hue', { error: error.message });
  }
};

// Signup/login par ek user ka role foran theek karta hai (restart ka intezar nahi)
export const applyAdminRole = async (user) => {
  const target = isAdminEmail(user.email) ? 'admin' : 'user';
  if ((user.role || 'user') !== target) {
    await User.updateOne({ _id: user._id }, { $set: { role: target } });
    user.role = target;
  }
};