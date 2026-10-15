import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, makeToken, chain } from './helpers.js';
import User from '../models/User.js';
import Workout from '../models/Workout.js';
import Goal from '../models/Goal.js';
import Notification from '../models/Notification.js';

// ---- Fakes ----
const me = { _id: 'u1', name: 'Ali', email: 'ali@example.com', preferences: {} };
const other = { _id: 'u2', name: 'Sara', email: 'sara@example.com', preferences: {} };
User.findById = (id) => chain([me, other].find((u) => u._id === id) || null);

let workouts = [];
let seq = 0;
Workout.create = async (data) => {
  const doc = { _id: `w${++seq}`, ...data };
  workouts.push(doc);
  return doc;
};
Workout.find = (q) => chain(workouts.filter((w) => w.user === q.user));
Workout.countDocuments = async () => 0;
Workout.findById = (id) => chain(workouts.find((w) => w._id === id) || null);
Workout.findByIdAndDelete = async (id) => {
  const i = workouts.findIndex((w) => w._id === id);
  return i < 0 ? null : workouts.splice(i, 1)[0];
};
// Notifications ka code bhi chalta hai — uske models ko khali fake dete hain
Goal.findOne = async () => null;
Notification.create = async (d) => d;

let srv;
let token;
let otherToken;
before(async () => {
  srv = await startServer();
  token = makeToken('u1');
  otherToken = makeToken('u2');
});
after(async () => {
  await srv.close();
});
beforeEach(() => {
  workouts = [];
  seq = 0;
});

const good = { exerciseName: 'Bench Press', sets: 3, reps: 10, weight: 40, duration: 20, caloriesBurned: 150 };

test('workout banana: sahi data par 201 aur user ki id lagti hai', async () => {
  const r = await srv.request('POST', '/api/workouts', { token, body: good });
  assert.equal(r.status, 201);
  assert.equal(r.json.exerciseName, 'Bench Press');
  assert.equal(r.json.user, 'u1');
});

test('workout banana: token ke baghair 401', async () => {
  const r = await srv.request('POST', '/api/workouts', { body: good });
  assert.equal(r.status, 401);
  assert.equal(workouts.length, 0);
});

test('workout banana: ghalat numbers reject (validation)', async () => {
  const bad = [
    { ...good, sets: 0 },
    { ...good, reps: -5 },
    { ...good, sets: 'abc' },
    { ...good, weight: 5000 },
    { ...good, duration: 99999 },
    { ...good, caloriesBurned: -1 },
  ];
  for (const body of bad) {
    const r = await srv.request('POST', '/api/workouts', { token, body });
    assert.equal(r.status, 400, JSON.stringify(body));
  }
  assert.equal(workouts.length, 0);
});

test('workout banana: exercise name ya sets/reps na ho to 400', async () => {
  const r1 = await srv.request('POST', '/api/workouts', { token, body: { sets: 3, reps: 10 } });
  assert.equal(r1.status, 400);
  const r2 = await srv.request('POST', '/api/workouts', { token, body: { exerciseName: 'Squat' } });
  assert.equal(r2.status, 400);
});

test('workout list: sirf apne workouts dikhte hain', async () => {
  await srv.request('POST', '/api/workouts', { token, body: good });
  await srv.request('POST', '/api/workouts', { token: otherToken, body: { ...good, exerciseName: 'Squat' } });
  const r = await srv.request('GET', '/api/workouts', { token });
  assert.equal(r.status, 200);
  assert.equal(r.json.length, 1);
  assert.equal(r.json[0].exerciseName, 'Bench Press');
});

test('doosre user ka workout delete nahi ho sakta (401, data bacha rehta hai)', async () => {
  const created = await srv.request('POST', '/api/workouts', { token, body: good });
  const r = await srv.request('DELETE', `/api/workouts/${created.json._id}`, { token: otherToken });
  assert.equal(r.status, 401);
  assert.equal(workouts.length, 1);
});

test('maujood na hone wala workout delete karne par 404', async () => {
  const r = await srv.request('DELETE', '/api/workouts/nope', { token });
  assert.equal(r.status, 404);
});

test('apna workout delete ho jata hai', async () => {
  const created = await srv.request('POST', '/api/workouts', { token, body: good });
  const r = await srv.request('DELETE', `/api/workouts/${created.json._id}`, { token });
  assert.equal(r.status, 200);
  assert.equal(workouts.length, 0);
});