import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clean, sanitizeInput } from '../middleware/sanitize.js';
import { escapeRegex } from '../utils/escapeRegex.js';

test('clean: $ wali keys hat jati hain, normal data jyon ka tyon', () => {
  assert.deepEqual(clean({ email: 'a@b.com', password: { $ne: '' } }), { email: 'a@b.com', password: {} });
  assert.deepEqual(clean({ a: { b: { $gt: 1, ok: 2 } } }), { a: { b: { ok: 2 } } });
  assert.deepEqual(clean({ name: 'Ali', tags: ['a', { $where: 'x', t: 1 }] }), { name: 'Ali', tags: ['a', { t: 1 }] });
});

test('clean: "." wali keys bhi hat jati hain', () => {
  assert.deepEqual(clean({ 'a.b': 1, ok: 1 }), { ok: 1 });
});

test('clean: number, string, null, date par kuch nahi karta', () => {
  assert.equal(clean(5), 5);
  assert.equal(clean('x'), 'x');
  assert.equal(clean(null), null);
  assert.deepEqual(clean({ n: null, z: 0, f: false }), { n: null, z: 0, f: false });
});

test('sanitizeInput: body aur (read-only) query dono saaf hote hain', () => {
  const req = { body: { email: { $ne: '' }, x: 1 } };
  Object.defineProperty(req, 'query', { get: () => ({ a: { $gt: '1' }, b: '2' }), configurable: true });
  let called = false;
  sanitizeInput(req, {}, () => {
    called = true;
  });
  assert.equal(called, true);
  assert.deepEqual(req.body, { email: {}, x: 1 });
  assert.deepEqual(req.query, { a: {}, b: '2' });
});

test('sanitizeInput: body/query na hon to crash nahi', () => {
  let called = false;
  sanitizeInput({}, {}, () => {
    called = true;
  });
  assert.equal(called, true);
});

test('escapeRegex: special characters escape hote hain', () => {
  assert.equal(escapeRegex('a.b*c'), 'a\\.b\\*c');
  assert.equal(escapeRegex('plain text'), 'plain text');
  assert.equal(new RegExp(escapeRegex('(x+)+')).test('(x+)+'), true);
});