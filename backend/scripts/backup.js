// Chalane ka tareeqa:  npm run backup
// .env mein optional:  BACKUP_DIR=./backups   BACKUP_KEEP=7
import 'dotenv/config';
import path from 'node:path';
import mongoose from 'mongoose';
import { backupDatabase, pruneBackups } from '../utils/backup.js';

const baseDir = path.resolve(process.env.BACKUP_DIR || './backups');
const keep = Number(process.env.BACKUP_KEEP) || 7;

try {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const { dir, counts } = await backupDatabase(mongoose.connection.db, baseDir, mongoose.mongo.BSON.EJSON);
  console.log(`Backup ban gaya: ${dir}`);
  console.table(counts);
  const removed = await pruneBackups(baseDir, keep);
  if (removed.length) console.log(`Purani ${removed.length} backup(s) hata di gayi (sirf nayi ${keep} rakhi hain)`);
  await mongoose.disconnect();
} catch (err) {
  console.error('Backup fail:', err.message);
  process.exit(1);
}