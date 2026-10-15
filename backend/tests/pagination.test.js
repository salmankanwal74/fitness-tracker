import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, makeToken, chain } from './helpers.js';
import User from '../models/User.js';
import Weight from '../models/Weight.js';
import Workout from '../models/Workout.js';
import { getPageParams } from '../utils/paginate.js';

// ---- Fake models jo sach mein sort/skip/limit karte hain ----
User.findById = (id) => chain(id === 'u1' ? { _id: 'u1', name: 'Ali', preferences: {} } : null);

const fakeFind = (rows) => {
  let list = [...rows];
  const q = {
    sort(spec) {
      const [[field, dir]] = Object.entries(spec);
      list.sort((a, b) => (new Date(a[field]) - new Date(b[field])) * dir);
      return q;
    },
    skip(n) {
      list = list.slice(n);
      return q;
    },
    limit(n) {
      list = list.slice(0, n);
      return q;
    },
    then: (resolve, reject) => Promise.resolve(list).then(resolve, reject),
  };
  return q;
};

let weights;
let lastWorkoutFilter;
Weight.countDocuments = async (f) => weights.filter((w) => w.user === f.user).length;
Weight.find = (f) => fakeFind(weights.filter((w) => w.user === f.user));
Workout.countDocuments = async () => 0;
Workout.find = (f) => {
  lastWorkoutFilter = f;
  return fakeFind([]);
};

let srv;
let token;
before(async () => {
  srv = await startServer();
  token = makeToken('u1');
});
after(async () => {
  await srv.close();
});
beforeEach(() => {
  // 25 entries: din 1 se din 25 (din 25 sab se nayi)
  weights = Array.from({ length: 25 }, (_, i) => ({
    _id: `w${i + 1}`,
    user: 'u1',
    weight: 70 + i,
    date: new Date(Date.UTC(2026, 0, i + 1)),
  }));
  lastWorkoutFilter = null;
});

test('getPageParams: defaults, limit ki had (max 1000), ghalat values', () => {
  assert.deepEqual(getPageParams({}), { page: 1, limit: 1000 });
  assert.deepEqual(getPageParams({ page: '3', limit: '20' }), { page: 3, limit: 20 });
  assert.equal(getPageParams({ limit: '999999' }).limit, 1000);
  assert.deepEqual(getPageParams({ page: '-4', limit: 'abc' }), { page: 1, limit: 1000 });
  assert.equal(getPageParams({ limit: '0' }).limit, 1000);
});

test('bina page/limit ke: saari entries, purani se nayi tarteeb (graphs ke liye), array hi milta hai', async () => {
  const r = await srv.request('GET', '/api/weight', { token });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json));
  assert.equal(r.json.length, 25);
  assert.equal(r.json[0]._id, 'w1');
  assert.equal(r.json[24]._id, 'w25');
  assert.equal(r.headers.get('x-total-count'), '25');
});

test('limit=10: sab se nayi 10 entries, phir bhi purani se nayi tarteeb mein', async () => {
  const r = await srv.request('GET', '/api/weight?limit=10', { token });
  assert.equal(r.json.length, 10);
  assert.equal(r.json[0]._id, 'w16');
  assert.equal(r.json[9]._id, 'w25');
  assert.equal(r.headers.get('x-limit'), '10');
  assert.equal(r.headers.get('x-total-count'), '25');
});

test('page=2&limit=10: agli (purani) 10 entries', async () => {
  const r = await srv.request('GET', '/api/weight?page=2&limit=10', { token });
  assert.deepEqual(
    r.json.map((w) => w._id),
    ['w6', 'w7', 'w8', 'w9', 'w10', 'w11', 'w12', 'w13', 'w14', 'w15']
  );
  assert.equal(r.headers.get('x-page'), '2');
});

test('aakhri page chhota ho sakta hai, us se aage khali list', async () => {
  const last = await srv.request('GET', '/api/weight?page=3&limit=10', { token });
  assert.equal(last.json.length, 5);
  const beyond = await srv.request('GET', '/api/weight?page=9&limit=10', { token });
  assert.deepEqual(beyond.json, []);
});

test('browser (CORS) headers padh sake isliye expose kiye jate hain', async () => {
  const r = await srv.request('GET', '/api/weight', { token });
  assert.match(r.headers.get('access-control-expose-headers') || '', /X-Total-Count/);
});

test('workout search: regex ke special characters "normal" ban jate hain (ReDoS se bachao)', async () => {
  await srv.request('GET', '/api/workouts?search=' + encodeURIComponent('(a+)+$.*'), { token });
  assert.equal(lastWorkoutFilter.exerciseName.$regex, '\\(a\\+\\)\\+\\$\\.\\*');
  assert.equal(lastWorkoutFilter.exerciseName.$options, 'i');
});

test('query mein NoSQL operator ($ne) hata diya jata hai', async () => {
  await srv.request('GET', '/api/workouts?category[$ne]=strength', { token });
  assert.equal(lastWorkoutFilter.category, undefined);
  assert.equal(JSON.stringify(lastWorkoutFilter).includes('$ne'), false);
});

test('tag array ban kar aaye (tag=a&tag=b) to bhi 500 nahi', async () => {
  const r = await srv.request('GET', '/api/workouts?tag=a&tag=b', { token });
  assert.equal(r.status, 200);
});