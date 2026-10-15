import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { syncAdminRoles } from '../utils/adminEmails.js';

const connectDB = async () => {
  try {
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Database kuch der ke liye na mile to 10 second baad saaf error (warna request latki rehti hai)
      serverSelectionTimeoutMS: 10000,
    });
    logger.info('MongoDB connected', { host: conn.connection.host });
    await syncAdminRoles();
  } catch (error) {
    logger.error('MongoDB connection failed', { error: error.message });
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

export default connectDB;