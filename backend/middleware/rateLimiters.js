import rateLimit from 'express-rate-limit';

const base = { standardHeaders: true, legacyHeaders: false };

// .env se badal sakte hain (tests aur deployment ke liye); na ho to ye default
const API_LIMIT = Number(process.env.API_RATE_LIMIT) || 300;
const AUTH_LIMIT = Number(process.env.AUTH_RATE_LIMIT) || 20;

// Poori API: 300 requests (default) / 15 min / IP
export const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: API_LIMIT,
  message: { message: 'Bohat zyada requests, thori der baad try karein' },
});

// Login/signup: brute-force se bachao, 20 koshishein (default) / 15 min / IP
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: AUTH_LIMIT,
  message: { message: 'Bohat zyada koshishein, 15 minute baad dobara try karein' },
});