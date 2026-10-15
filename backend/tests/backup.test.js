import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import { backupDatabase, pruneBackups, restoreDatabase } from '../utils/backup.js';

const { EJSON, ObjectId } = mongoose.mongo.BSON ? { EJSON: mongoose.mongo.BSON.EJSON, ObjectId: mongoose.mongo.ObjectId } : {};

// Memory wala fake database (listCollections / collection().find().toArray() / insertMany ...)
const fakeDb = (data) => ({
  data,
  listCollections: () => ({ toArray: async () => Object.keys(data).map((name) => ({ name })) }),
  collection: (name) => ({
    find: () => ({ toArray: async () => [...(data[name] || [])] }),
    countDocuments: async () => (data[name] || []).length,
    deleteMany: async () => {
      data[name] = [];
    },
    insertMany: async (docs) => {
      data[name] = [...(data[name] || []), ...docs];
    },
  }),
});

const tmp = () => fs.mkdtemp(path.join(os.tmpdir(), 'backup-test-'));

test('backup: har collection ki file + manifest, system collections chhodh kar', async () => {
  const base = await tmp();
  const db = fakeDb({
    users: [{ _id: new ObjectId(), name: 'Ali' }],
    workouts: [{ _id: new ObjectId() }, { _id: new ObjectId() }],
    'system.views': [{ x: 1 }],
  });
  const { dir, counts } = await backupDatabase(db, base, EJSON, new Date('2026-10-11T15:00:00Z'));

  assert.match(path.basename(dir), /^backup-20261011-150000$/);
  assert.deepEqual(counts, { users: 1, workouts: 2 });
  const files = (await fs.readdir(dir)).sort();
  assert.deepEqual(files, ['manifest.json', 'users.json', 'workouts.json']);
  const manifest = JSON.parse(await fs.readFile(path.join(dir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.collections.workouts, 2);
});

test('backup + restore: ObjectId aur Date ki qisam bilkul wahi wapas aati hai', async () => {
  const base = await tmp();
  const id = new ObjectId();
  const when = new Date('2026-01-05T10:20:30Z');
  const source = fakeDb({ weights: [{ _id: id, user: id, weight: 71.5, date: when }] });
  const { dir } = await backupDatabase(source, base, EJSON);

  const target = fakeDb({});
  const result = await restoreDatabase(target, dir, EJSON);
  assert.equal(result.weights, '1 restored');
  const doc = target.data.weights[0];
  assert.ok(doc._id instanceof ObjectId);
  assert.equal(doc._id.toString(), id.toString());
  assert.ok(doc.date instanceof Date);
  assert.equal(doc.date.toISOString(), when.toISOString());
  assert.equal(doc.weight, 71.5);
});

test('restore: jis collection mein data pehle se hai usay chhor deta hai (double nahi karta)', async () => {
  const base = await tmp();
  const { dir } = await backupDatabase(fakeDb({ notes: [{ _id: new ObjectId(), t: 'old' }] }), base, EJSON);
  const live = fakeDb({ notes: [{ _id: new ObjectId(), t: 'live' }] });
  const result = await restoreDatabase(live, dir, EJSON);
  assert.match(result.notes, /skipped/);
  assert.equal(live.data.notes.length, 1);
  assert.equal(live.data.notes[0].t, 'live');
});

test('restore --drop: maujooda data hata kar backup wala laga deta hai', async () => {
  const base = await tmp();
  const { dir } = await backupDatabase(fakeDb({ notes: [{ _id: new ObjectId(), t: 'old' }] }), base, EJSON);
  const live = fakeDb({ notes: [{ _id: new ObjectId(), t: 'live' }, { _id: new ObjectId(), t: 'live2' }] });
  await restoreDatabase(live, dir, EJSON, { drop: true });
  assert.deepEqual(
    live.data.notes.map((n) => n.t),
    ['old']
  );
});

test('khali collection ka backup/restore crash nahi karta', async () => {
  const base = await tmp();
  const { dir, counts } = await backupDatabase(fakeDb({ empty: [] }), base, EJSON);
  assert.equal(counts.empty, 0);
  const target = fakeDb({});
  const result = await restoreDatabase(target, dir, EJSON);
  assert.equal(result.empty, '0 restored');
});

test('pruneBackups: sirf nayi N rakhta hai, doosri files/folders ko haath nahi lagata', async () => {
  const base = await tmp();
  for (const n of ['backup-20261001-000000', 'backup-20261002-000000', 'backup-20261003-000000', 'backup-20261004-000000']) {
    await fs.mkdir(path.join(base, n));
  }
  await fs.mkdir(path.join(base, 'my-notes'));
  const removed = await pruneBackups(base, 2);
  assert.deepEqual(removed, ['backup-20261001-000000', 'backup-20261002-000000']);
  const left = (await fs.readdir(base)).sort();
  assert.deepEqual(left, ['backup-20261003-000000', 'backup-20261004-000000', 'my-notes']);
});

test('pruneBackups: folder maujood na ho to khali list', async () => {
  assert.deepEqual(await pruneBackups(path.join(os.tmpdir(), 'does-not-exist-xyz'), 3), []);
});