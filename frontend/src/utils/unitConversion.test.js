import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  kgToLbs,
  lbsToKg,
  cmToIn,
  inToCm,
  displayWeight,
  toStorageWeight,
  displayLength,
  toStorageLength,
} from './unitConversion.js';

const near = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} ~= ${b}`);

test('kg <-> lbs', () => {
  near(kgToLbs(100), 220.462);
  near(lbsToKg(220.462), 100);
});

test('cm <-> inch', () => {
  near(cmToIn(2.54), 1);
  near(inToCm(10), 25.4);
});

test('displayWeight: kg mein jyon ka tyon, lbs mein convert, 1 decimal tak round', () => {
  assert.equal(displayWeight(70, 'kg'), 70);
  assert.equal(displayWeight(70, 'lbs'), 154.3);
  assert.equal(displayWeight('', 'kg'), '');
  assert.equal(displayWeight(null, 'lbs'), '');
});

test('toStorageWeight: user ka input hamesha kg mein save hota hai', () => {
  assert.equal(toStorageWeight('70', 'kg'), 70);
  near(toStorageWeight('154.3', 'lbs'), 69.99, 0.05);
  assert.equal(toStorageWeight('abc', 'kg'), 'abc');
});

test('displayLength / toStorageLength', () => {
  assert.equal(displayLength(100, 'cm'), 100);
  assert.equal(displayLength(100, 'in'), 39.4);
  assert.equal(displayLength(undefined, 'cm'), '');
  near(toStorageLength('39.4', 'in'), 100.08, 0.1);
});

test('round trip: lbs me dikha kar wapas kg me save karne par lagbhag wahi value', () => {
  const kg = 82.5;
  near(toStorageWeight(displayWeight(kg, 'lbs'), 'lbs'), kg, 0.1);
});