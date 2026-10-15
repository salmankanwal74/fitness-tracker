import 'dotenv/config'; // sab se pehle .env load ho
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import app from './app.js';
import logger from './utils/logger.js';

connectDB();

process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', { reason: String(reason?.stack || reason) });
});

// Koi unexpected crash ho to log karke band ho jao (Docker/PM2 usay khud dobara chala deta hai)
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { error: err.message, stack: err.stack });
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info('Server started', { port: Number(PORT), env: process.env.NODE_ENV || 'development' });
});

// Graceful shutdown: deploy/restart par chalti requests poori hone dein
const shutdown = (signal) => {
  logger.info('Shutdown signal mila', { signal });
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  // Agar 10 second mein band na ho to zabardasti
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;