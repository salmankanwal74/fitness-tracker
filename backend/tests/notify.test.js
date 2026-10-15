import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { chain } from './helpers.js';
import Notification from '../models/Notification.js';
import Workout from '../models/Workout.js';
import Weight from '../models/Weight.js';
import Nutrition from '../models/Nutrition.js';
import Goal from '../models/Goal.js';
import { onWorkoutCreated, onWeightAdded, onNutritionAdded } from '../utils/notify.js';

const allOn = { workoutMilestones: true, streaks: true, weightProgress: true, mealReminders: true };
const user = { _id: 'u1', preferences: { notifications: allOn } };

// din(0) = aaj, din(1) = kal ... (dopahar 12 baje, taake timezone ka masla na ho)
const day = (n) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

let workouts;
let weights;
let meals;
let goal;
let notes;
let seq = 0;

Workout.countDocuments = async (f) => workouts.filter((w) => !f.date || w.date >= f.date.$gte).length;
Workout.find = (f) => chain(workouts.filter((w) => w.date >= f.date.$gte));
Weight.find = () => chain(weights);
Nutrition.find = (f) => chain(meals.filter((e) => e.date >= f.date.$gte && e.date < f.date.$lt));
Goal.findOne = async () => goal;
Notification.create = async (d) => {
  if (d.key && notes.some((n) => n.key === d.key && n.user === d.user)) {
    const e = new Error('duplicate');
    e.code = 11000; // MongoDB ka unique-index error
    throw e;
  }
  const n = { _id: `n${++seq}`, ...d };
  notes.push(n);
  return n;
};

beforeEach(() => {
  workouts = [];
  weights = [];
  meals = [];
  goal = null;
  notes = [];
});

const addWorkout = async (date, name = 'Bench', u = user) => {
  const w = { _id: `w${++seq}`, exerciseName: name, sets: 3, reps: 10, date };
  workouts.push(w);
  await onWorkoutCreated(u, w);
  return w;
};
const types = () => notes.map((n) => n.type);

test('pehla workout: sirf workout_completed', async () => {
  await addWorkout(day(0));
  assert.deepEqual(types(), ['workout_completed']);
});

test('har 5th workout par milestone', async () => {
  for (let i = 0; i < 5; i++) await addWorkout(day(0), `Ex${i}`);
  assert.ok(notes.some((n) => n.type === 'workout_milestone' && n.message.includes('5 workouts')));
});

test('3 din lagataar workout par streak notification', async () => {
  workouts.push({ _id: 'old1', date: day(2) }, { _id: 'old2', date: day(1) });
  await addWorkout(day(0));
  assert.ok(notes.some((n) => n.type === 'streak' && n.message.startsWith('3 din')));
});

test('din chhoot jaye to streak nahi', async () => {
  workouts.push({ _id: 'old1', date: day(3) }, { _id: 'old2', date: day(1) });
  await addWorkout(day(0));
  assert.equal(types().includes('streak'), false);
});

test('weekly goal poora hone par goal_workouts', async () => {
  goal = { weeklyWorkoutTarget: 2 };
  await addWorkout(day(0), 'A');
  assert.equal(types().includes('goal_workouts'), false);
  await addWorkout(day(0), 'B');
  assert.equal(types().includes('goal_workouts'), true);
});

test('wahi event dobara aaye to duplicate notification nahi banti', async () => {
  const w = await addWorkout(day(0));
  const before = notes.length;
  await onWorkoutCreated(user, w);
  assert.equal(notes.length, before);
});

test('Settings mein workoutMilestones OFF ho to workout notification nahi', async () => {
  const off = { _id: 'u1', preferences: { notifications: { ...allOn, workoutMilestones: false } } };
  await addWorkout(day(0), 'Squat', off);
  assert.equal(notes.length, 0);
});

test('weight kam hone par weight_progress (poore kg ke hisab se)', async () => {
  weights = [{ weight: 80, date: day(10) }, { weight: 78.5, date: day(5) }];
  await onWeightAdded(user);
  assert.ok(notes.some((n) => n.key === 'weight-progress-1'));
});

test('sirf ek weight entry ho to kuch nahi', async () => {
  weights = [{ weight: 80, date: day(0) }];
  await onWeightAdded(user);
  assert.equal(notes.length, 0);
});

test('target weight (kam karna) poora hone par goal_weight', async () => {
  goal = { targetWeight: 70 };
  weights = [{ weight: 80, date: day(10) }, { weight: 78, date: day(5) }];
  await onWeightAdded(user);
  assert.equal(types().includes('goal_weight'), false);
  weights.push({ weight: 69.8, date: day(0) });
  await onWeightAdded(user);
  assert.equal(types().includes('goal_weight'), true);
});

test('target weight (barhana) bhi sahi kaam karta hai', async () => {
  goal = { targetWeight: 75 };
  weights = [{ weight: 60, date: day(9) }, { weight: 75.2, date: day(0) }];
  await onWeightAdded(user);
  assert.equal(types().includes('goal_weight'), true);
});

test('calories limit se zyada hone par alert, wo bhi din mein sirf ek baar', async () => {
  goal = { dailyCalorieTarget: 2000 };
  meals = [{ calories: 1200, date: day(0) }, { calories: 900, date: day(0) }];
  await onNutritionAdded(user, { date: day(0) });
  await onNutritionAdded(user, { date: day(0) });
  assert.deepEqual(types(), ['goal_calories']);
});

test('limit ke andar ho ya goal set na ho to kuch nahi (crash bhi nahi)', async () => {
  goal = { dailyCalorieTarget: 2000 };
  meals = [{ calories: 500, date: day(0) }];
  await onNutritionAdded(user, { date: day(0) });
  goal = null;
  await onNutritionAdded(user, { date: day(0) });
  assert.equal(notes.length, 0);
});

test('database error aaye to workout save hone ka flow nahi tootta', async () => {
  const original = Notification.create;
  Notification.create = async () => {
    throw new Error('db down');
  };
  const origError = console.error;
  console.error = () => {};
  await assert.doesNotReject(() => addWorkout(day(0)));
  console.error = origError;
  Notification.create = original;
});