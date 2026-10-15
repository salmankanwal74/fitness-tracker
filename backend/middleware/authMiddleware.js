import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Header mein "Bearer <token>" hona chahiye
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  let user;
  let decoded;
  try {
    const token = authHeader.split(' ')[1];
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    user = await User.findById(decoded.id).select('-password');
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }

  // Account delete hone ke baad purana token chalne se rokta hai
  if (!user) {
    return res.status(401).json({ message: 'Not authorized, user no longer exists' });
  }

  // Password reset ke baad purana token (jo reset se pehle bana tha) kaam nahi karega
  if (user.passwordChangedAt && decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    return res.status(401).json({ message: 'Not authorized, password badal chuka hai, dobara login karein' });
  }

  req.user = user;
  next();
};
// protect ke BAAD lagayein. Role har request par database se aata hai,
// isliye admin hatane par uska access foran band ho jata hai.
export const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Ye page sirf admin ke liye hai' });
};