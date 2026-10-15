import { test } from 'node:test';
import assert from 'node:assert/strict';
import './helpers.js';
import { validateNumbers, validateText } from '../middleware/validate.js';

// Express ke req/res ka chhota fake
const run = (mw, req) => {
  const out = { nexted: false, status: null, json: null };
  const res = {
    status(c) {
      out.status = c;
      return this;
    },
    json(j) {
      out.json = j;
      return this;
    },
  };
  mw(req, res, () => {
    out.nexted = true;
  });
  return out;
};

const rules = {
  weight: { min: 1, max: 700, required: true, label: 'Weight' },
  notes: { min: 0, max: 10 },
};

test('sahi number guzar jata hai', () => {
  assert.equal(run(validateNumbers(rules), { method: 'POST', body: { weight: 70 } }).nexted, true);
});

test('required field POST par na ho to 400', () => {
  const r = run(validateNumbers(rules), { method: 'POST', body: {} });
  assert.equal(r.status, 400);
  assert.match(r.json.message, /zaroori/);
});

test('required field PUT (update) par optional hai', () => {
  assert.equal(run(validateNumbers(rules), { method: 'PUT', body: {} }).nexted, true);
});

test('number nahi (abc) to 400', () => {
  const r = run(validateNumbers(rules), { method: 'POST', body: { weight: 'abc' } });
  assert.equal(r.status, 400);
});

test('min se kam / max se zyada to 400', () => {
  assert.equal(run(validateNumbers(rules), { method: 'POST', body: { weight: 0 } }).status, 400);
  assert.equal(run(validateNumbers(rules), { method: 'POST', body: { weight: 701 } }).status, 400);
});

test('boundary values (min aur max) allowed hain', () => {
  assert.equal(run(validateNumbers(rules), { method: 'POST', body: { weight: 1 } }).nexted, true);
  assert.equal(run(validateNumbers(rules), { method: 'POST', body: { weight: 700 } }).nexted, true);
});

test('body hi na ho to crash nahi hota', () => {
  const r = run(validateNumbers(rules), { method: 'POST' });
  assert.equal(r.status, 400);
});

test('validateText: lambi string reject, chhoti pass', () => {
  const mw = validateText({ message: 5 });
  assert.equal(run(mw, { body: { message: '123456' } }).status, 400);
  assert.equal(run(mw, { body: { message: '12345' } }).nexted, true);
  assert.equal(run(mw, { body: {} }).nexted, true);
});