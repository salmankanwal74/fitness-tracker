import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workoutsToCSVRows, nutritionToCSVRows } from './csvRows.js';

test('workoutsToCSVRows: sirf kaam ke columns, database ki _id wagera nahi', () => {
  const rows = workoutsToCSVRows([
    {
      _id: 'x',
      user: 'u',
      __v: 0,
      date: '2026-10-07T10:00:00Z',
      exerciseName: 'Squat',
      category: 'strength',
      tags: ['legs', 'heavy'],
      sets: 3,
      reps: 8,
      weight: 60,
      duration: 20,
      caloriesBurned: 150,
      notes: 'good',
    },
  ]);
  assert.deepEqual(rows[0], {
    date: '2026-10-07',
    exercise: 'Squat',
    category: 'strength',
    tags: 'legs; heavy',
    sets: 3,
    reps: 8,
    weight_kg: 60,
    duration_min: 20,
    calories_burned: 150,
    notes: 'good',
  });
});

test('workoutsToCSVRows: khali / missing values crash nahi karti', () => {
  const [row] = workoutsToCSVRows([{ date: '2026-10-07', exerciseName: 'Run', sets: 1, reps: 1 }]);
  assert.equal(row.tags, '');
  assert.equal(row.weight_kg, 0);
  assert.equal(row.duration_min, '');
  assert.equal(row.calories_burned, '');
  assert.equal(row.notes, '');
});

test('nutritionToCSVRows: macros missing ho to 0', () => {
  const [row] = nutritionToCSVRows([
    { date: '2026-10-07T00:00:00Z', mealType: 'lunch', foodItem: 'Rice', quantity: '100 g', calories: 130 },
  ]);
  assert.deepEqual(row, {
    date: '2026-10-07',
    meal: 'lunch',
    food: 'Rice',
    quantity: '100 g',
    calories: 130,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 0,
  });
});

test('khali list par khali list', () => {
  assert.deepEqual(workoutsToCSVRows([]), []);
  assert.deepEqual(nutritionToCSVRows([]), []);
});