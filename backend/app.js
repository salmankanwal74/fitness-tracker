// Express app (bina database connect kiye aur bina listen kiye) — tests isi ko import karte hain.
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import weightRoutes from './routes/weightRoutes.js';
import nutritionRoutes from './routes/nutritionRoutes.js';
import measurementRoutes from './routes/measurementRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { apiLimiter, authLimiter } from './middleware/rateLimiters.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { sanitizeInput } from './middleware/sanitize.js';

const app = express();

// Load balancer / proxy ke peeche chalane ke liye (real IP sahi milti hai)
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

// Middleware
app.use(helmet());
app.use(compression());
app.use(requestLogger); // har request ko id dena aur jawab ke baad ek log line likhna

// CORS_ORIGIN=https://app.com,https://www.app.com (khali ho to sab allowed, sirf development ke liye)
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));

app.use(express.json({ limit: '3mb' })); // profile image (max 2MB) base64 ke liye kaafi hai
app.use(sanitizeInput); // NoSQL injection ($ne, $gt wagera) rokta hai
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/forum', forumRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Fitness Tracker API is running...');
});

// Health check (uptime monitor / load balancer ke liye)
app.get('/health', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'degraded',
    db: dbUp ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;