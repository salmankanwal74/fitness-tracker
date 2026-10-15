// Database ka backup/restore (mongodump ke baghair, sirf Node se).
// Har collection ek JSON file mein jati hai (EJSON format: ObjectId aur Date ki qisam bhi mehfooz rehti hai).
// DHYAN: backup mein password ke hash bhi hote hain, isliye backup folder ko private rakhein (git mein na dalein).
import fs from 'node:fs/promises';
import path from 'node:path';

const stamp = (d = new Date()) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .slice(0, 15); // 20261011-201500

// db: mongoose.connection.db ; EJSON: mongoose.mongo.BSON.EJSON
export const backupDatabase = async (db, baseDir, EJSON, now = new Date()) => {
  const dir = path.join(baseDir, `backup-${stamp(now)}`);
  await fs.mkdir(dir, { recursive: true });

  const collections = (await db.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.'));

  const counts = {};
  for (const name of collections) {
    const docs = await db.collection(name).find({}).toArray();
    await fs.writeFile(path.join(dir, `${name}.json`), EJSON.stringify(docs, { relaxed: false }));
    counts[name] = docs.length;
  }

  await fs.writeFile(
    path.join(dir, 'manifest.json'),
    JSON.stringify({ createdAt: now.toISOString(), collections: counts }, null, 2)
  );
  return { dir, counts };
};

// Sirf sab se nayi `keep` backups rakhta hai, purani delete kar deta hai
export const pruneBackups = async (baseDir, keep = 7) => {
  let names = [];
  try {
    names = (await fs.readdir(baseDir)).filter((n) => /^backup-\d{8}-\d{6}$/.test(n)).sort();
  } catch {
    return [];
  }
  const remove = names.slice(0, Math.max(0, names.length - keep));
  for (const n of remove) await fs.rm(path.join(baseDir, n), { recursive: true, force: true });
  return remove;
};

// Restore: jo collection pehle se khali nahi, usay chhor deta hai (data double na ho),
// jab tak drop=true na ho (us surat mein pehle us collection ka purana data hata deta hai)
export const restoreDatabase = async (db, backupDir, EJSON, { drop = false } = {}) => {
  const files = (await fs.readdir(backupDir)).filter((f) => f.endsWith('.json') && f !== 'manifest.json');
  const result = {};
  for (const file of files) {
    const name = file.replace(/\.json$/, '');
    const col = db.collection(name);
    const docs = EJSON.parse(await fs.readFile(path.join(backupDir, file), 'utf8'));

    if (drop) await col.deleteMany({});
    else if ((await col.countDocuments({})) > 0) {
      result[name] = 'skipped (collection khali nahi)';
      continue;
    }
    if (docs.length > 0) await col.insertMany(docs);
    result[name] = `${docs.length} restored`;
  }
  return result;
};