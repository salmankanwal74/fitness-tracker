// Chalane ka tareeqa:
//   npm run restore -- backups/backup-20261011-201500           (sirf khali collections mein restore)
//   npm run restore -- backups/backup-20261011-201500 --drop    (maujooda data hata kar backup se badal do)
import 'dotenv/config';
import path from 'node:path';
import mongoose from 'mongoose';
import { restoreDatabase } from '../utils/backup.js';

const args = process.argv.slice(2);
const folder = args.find((a) => !a.startsWith('--'));
const drop = args.includes('--drop');

if (!folder) {
  console.error('Folder ka naam dein, jaise: npm run restore -- backups/backup-20261011-201500');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const result = await restoreDatabase(mongoose.connection.db, path.resolve(folder), mongoose.mongo.BSON.EJSON, { drop });
  console.table(result);
  await mongoose.disconnect();
} catch (err) {
  console.error('Restore fail:', err.message);
  process.exit(1);
}