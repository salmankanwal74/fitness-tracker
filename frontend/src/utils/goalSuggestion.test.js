import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSuggestedGoal } from './goalSuggestion.js';

const base = { weightKg: 80, heightCm: 180, age: 30, gender: 'male', activityLevel: 'moderate' };

test('Mifflin-St Jeor: male 80kg/180cm/30y -> BMR 1780, TDEE 2759', () => {
  const r = calculateSuggestedGoal({ ...base, goalDirection: 'maintain' });
  assert.equal(r.bmr, 1780);
  assert.equal(r.tdee, 2759);
  assert.equal(r.dailyCalorieTarget, 2760);
});

test('lose: 500 kam, gain: 300 zyada', () => {
  const lose = calculateSuggestedGoal({ ...base, goalDirection: 'lose' });
  const gain = calculateSuggestedGoal({ ...base, goalDirection: 'gain' });
  assert.equal(lose.dailyCalorieTarget, 2260);
  assert.equal(gain.dailyCalorieTarget, 3060);
});

test('female formula male se 166 kam BMR deti hai', () => {
  const m = calculateSuggestedGoal({ ...base, goalDirection: 'maintain' });
  const f = calculateSuggestedGoal({ ...base, gender: 'female', goalDirection: 'maintain' });
  assert.equal(m.bmr - f.bmr, 166);
});

test('target weight: lose par sirf tab jab abhi healthy weight se zyada ho', () => {
  const heavy = calculateSuggestedGoal({ ...base, weightKg: 100, goalDirection: 'lose' });
  assert.equal(heavy.targetWeight, 70.3); // 21.7 x 1.8^2
  const light = calculateSuggestedGoal({ ...base, weightKg: 60, goalDirection: 'lose' });
  assert.equal(light.targetWeight, null);
  const gain = calculateSuggestedGoal({ ...base, weightKg: 60, goalDirection: 'gain' });
  assert.equal(gain.targetWeight, 70.3);
});

test('activity level ke hisab se weekly workout target', () => {
  assert.equal(calculateSuggestedGoal({ ...base, activityLevel: 'sedentary', goalDirection: 'maintain' }).weeklyWorkoutTarget, 3);
  assert.equal(calculateSuggestedGoal({ ...base, activityLevel: 'active', goalDirection: 'maintain' }).weeklyWorkoutTarget, 6);
});

test('zaroori data na ho to null', () => {
  assert.equal(calculateSuggestedGoal({ ...base, age: 0, goalDirection: 'lose' }), null);
  assert.equal(calculateSuggestedGoal({ goalDirection: 'lose' }), null);
});