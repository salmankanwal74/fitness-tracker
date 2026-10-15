import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateCaloriesBurned } from './calorieCalculator.js';

test('formula: MET x weight x ghante (running 30 min, 70 kg, MET 9.8 = 343)', () => {
  const r = estimateCaloriesBurned({ exerciseName: 'Morning Run', category: 'cardio', durationMinutes: 30, weightKg: 70 });
  assert.equal(r.met, 9.8);
  assert.equal(r.calories, 343);
  assert.equal(r.isEstimatedDuration, false);
  assert.equal(r.usedDefaultWeight, false);
});

test('exercise ka naam match na ho to category ka MET lagta hai', () => {
  const r = estimateCaloriesBurned({ exerciseName: 'Mystery', category: 'flexibility', durationMinutes: 60, weightKg: 60 });
  assert.equal(r.met, 2.5);
  assert.equal(r.calories, 150);
});

test('naam capital letters mein ho tab bhi match', () => {
  const r = estimateCaloriesBurned({ exerciseName: 'YOGA FLOW', category: 'other', durationMinutes: 60, weightKg: 70 });
  assert.equal(r.met, 2.5);
});

test('duration na ho to sets se andaza (2.5 min per set)', () => {
  const r = estimateCaloriesBurned({ exerciseName: 'Bench Press', category: 'strength', sets: 4, weightKg: 70 });
  assert.equal(r.usedDuration, 10);
  assert.equal(r.isEstimatedDuration, true);
});

test('weight na ho to default 70 kg aur flag', () => {
  const r = estimateCaloriesBurned({ exerciseName: 'Walk', category: 'cardio', durationMinutes: 60 });
  assert.equal(r.usedDefaultWeight, true);
  assert.equal(r.calories, Math.round(3.5 * 70));
});

test('na duration na sets to null (andaza nahi ban sakta)', () => {
  assert.equal(estimateCaloriesBurned({ exerciseName: 'Run', category: 'cardio', weightKg: 70 }), null);
});