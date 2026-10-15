import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FOODS, findFood, calcMacros, parseAmount } from './foods.js';

test('database mein khane hain aur naam duplicate nahi', () => {
  assert.ok(FOODS.length >= 50);
  const names = FOODS.map((f) => f.name);
  assert.equal(new Set(names).size, names.length);
});

test('har food ke numbers sahi hain (negative nahi, base > 0, calories macros se milti-julti)', () => {
  for (const f of FOODS) {
    assert.ok(f.base > 0, `${f.name}: base`);
    for (const k of ['calories', 'protein', 'carbs', 'fats']) assert.ok(f[k] >= 0, `${f.name}: ${k}`);
    // 4/4/9 kcal rule: macros se nikli calories asli calories se bohat door na hon
    const fromMacros = f.protein * 4 + f.carbs * 4 + f.fats * 9;
    assert.ok(Math.abs(fromMacros - f.calories) <= Math.max(60, f.calories * 0.35), `${f.name}: ${fromMacros} vs ${f.calories}`);
  }
});

test('findFood: capital/small aur extra spaces ka farq nahi', () => {
  assert.equal(findFood('  banana ').name, 'Banana');
  assert.equal(findFood('ROTI / CHAPATI').name, 'Roti / Chapati');
  assert.equal(findFood('xyz'), null);
  assert.equal(findFood(''), null);
  assert.equal(findFood(undefined), null);
});

test('calcMacros: 200 g chicken breast', () => {
  assert.deepEqual(calcMacros(findFood('Chicken Breast (cooked)'), 200), {
    calories: 330,
    protein: 62,
    carbs: 0,
    fats: 7.2,
  });
});

test('calcMacros: 2 roti', () => {
  const m = calcMacros(findFood('Roti / Chapati'), 2);
  assert.equal(m.calories, 240);
  assert.equal(m.protein, 7.2);
});

test('calcMacros: 0, negative ya number nahi to null', () => {
  const f = findFood('Banana');
  assert.equal(calcMacros(f, 0), null);
  assert.equal(calcMacros(f, -3), null);
  assert.equal(calcMacros(f, 'abc'), null);
});

test('parseAmount: quantity string se number', () => {
  assert.equal(parseAmount('200 g'), '200');
  assert.equal(parseAmount('1.5 cup'), '1.5');
  assert.equal(parseAmount('some'), '');
  assert.equal(parseAmount(undefined), '');
});