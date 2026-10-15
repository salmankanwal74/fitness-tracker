import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dateOnly, inDateRange, sortByDate } from './filters.js';

test('dateOnly: ISO date se sirf din nikalta hai', () => {
  assert.equal(dateOnly('2026-10-07T18:30:00.000Z'), '2026-10-07');
  assert.equal(dateOnly('2026-10-07'), '2026-10-07');
});

test('inDateRange: dono hadd khali ho to sab pass', () => {
  assert.equal(inDateRange('2026-10-07T00:00:00Z', '', ''), true);
});

test('inDateRange: from aur to dono inclusive hain', () => {
  assert.equal(inDateRange('2026-10-07T10:00:00Z', '2026-10-07', '2026-10-07'), true);
  assert.equal(inDateRange('2026-10-06T10:00:00Z', '2026-10-07', ''), false);
  assert.equal(inDateRange('2026-10-08T10:00:00Z', '', '2026-10-07'), false);
});

test('sortByDate: newest / oldest, aur asli list nahi badalti', () => {
  const list = [
    { id: 'b', date: '2026-10-02' },
    { id: 'c', date: '2026-10-03' },
    { id: 'a', date: '2026-10-01' },
  ];
  assert.deepEqual(sortByDate(list, 'newest').map((x) => x.id), ['c', 'b', 'a']);
  assert.deepEqual(sortByDate(list, 'oldest').map((x) => x.id), ['a', 'b', 'c']);
  assert.deepEqual(list.map((x) => x.id), ['b', 'c', 'a']);
});