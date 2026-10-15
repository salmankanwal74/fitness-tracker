import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, makeToken, hashPassword, chain } from './helpers.js';
import User from '../models/User.js';

// ---- Fake in-memory User collection ----
let users = [];
let seq = 0;

const matches = (u, q) => {
  if (q.$or) return q.$or.some((c) => matches(u, c));
  return Object.entries(q).every(([k, v]) => u[k] === v);
};

User.findOne = (q) => chain(users.find((u) => matches(u, q)) || null);
User.findById = (id) => chain(users.find((u) => String(u._id) === String(id)) || null);
User.create = async (data) => {
  const doc = { _id: `u${++seq}`, profileImage: '', ...data, save: async () => doc };
  users.push(doc);
  return doc;
};

let srv;
before(async () => {
  srv = await startServer();
});
after(async () => {
  await srv.close();
});
beforeEach(() => {
  users = [];
  seq = 0;
});

const good = {
  name: 'Ali',
  username: 'ali_01',
  email: 'ali@example.com',
  password: 'secret123',
  acceptTerms: true,
};

test('signup: sahi data par 201 aur token milta hai, password wapas nahi aata', async () => {
  const r = await srv.request('POST', '/api/auth/signup', { body: good });
  assert.equal(r.status, 201);
  assert.ok(r.json.token);
  assert.equal(r.json.email, 'ali@example.com');
  assert.equal(r.json.password, undefined);
});

test('signup: password hash hokar save hota hai (plain text nahi)', async () => {
  await srv.request('POST', '/api/auth/signup', { body: good });
  assert.notEqual(users[0].password, 'secret123');
  assert.match(users[0].password, /^\$2[aby]\$/);
});

test('signup: consent (Terms/Privacy) save hota hai', async () => {
  await srv.request('POST', '/api/auth/signup', { body: good });
  assert.equal(users[0].consent.termsAccepted, true);
  assert.ok(users[0].consent.acceptedAt);
  assert.ok(users[0].consent.policyVersion);
});

test('signup: acceptTerms ke baghair 400', async () => {
  for (const v of [undefined, false, 'true', 1]) {
    const r = await srv.request('POST', '/api/auth/signup', { body: { ...good, acceptTerms: v } });
    assert.equal(r.status, 400, `acceptTerms=${String(v)} reject hona chahiye`);
  }
});

test('signup: kharab fields reject', async () => {
  const cases = [
    { ...good, name: '' },
    { ...good, username: 'a b' },
    { ...good, username: 'ab' },
    { ...good, email: 'not-an-email' },
    { ...good, password: '123' },
  ];
  for (const body of cases) {
    const r = await srv.request('POST', '/api/auth/signup', { body });
    assert.equal(r.status, 400);
  }
  assert.equal(users.length, 0);
});

test('signup: duplicate email aur username reject', async () => {
  await srv.request('POST', '/api/auth/signup', { body: good });
  const sameEmail = await srv.request('POST', '/api/auth/signup', {
    body: { ...good, username: 'other_name' },
  });
  assert.equal(sameEmail.status, 400);
  const sameUser = await srv.request('POST', '/api/auth/signup', {
    body: { ...good, email: 'other@example.com' },
  });
  assert.equal(sameUser.status, 400);
  assert.equal(users.length, 1);
});

test('login: email ya username dono se chalta hai', async () => {
  users.push({ _id: 'u9', name: 'Ali', username: 'ali_01', email: 'ali@example.com', password: await hashPassword('secret123') });
  const byEmail = await srv.request('POST', '/api/auth/login', { body: { identifier: 'ALI@example.com', password: 'secret123' } });
  assert.equal(byEmail.status, 200);
  assert.ok(byEmail.json.token);
  const byUser = await srv.request('POST', '/api/auth/login', { body: { identifier: 'ali_01', password: 'secret123' } });
  assert.equal(byUser.status, 200);
});

test('login: ghalat password / unknown user dono par ek jaisa "Invalid credentials"', async () => {
  users.push({ _id: 'u9', username: 'ali_01', email: 'ali@example.com', password: await hashPassword('secret123') });
  const wrong = await srv.request('POST', '/api/auth/login', { body: { identifier: 'ali_01', password: 'nope' } });
  const unknown = await srv.request('POST', '/api/auth/login', { body: { identifier: 'ghost', password: 'secret123' } });
  assert.equal(wrong.status, 400);
  assert.equal(unknown.status, 400);
  assert.equal(wrong.json.message, unknown.json.message);
});

test('login: khali fields par 400', async () => {
  const r = await srv.request('POST', '/api/auth/login', { body: {} });
  assert.equal(r.status, 400);
});

test('token: sahi token se protected route khulta hai (data export)', async () => {
  users.push({ _id: 'u9', name: 'Ali', email: 'ali@example.com', password: 'x' });
  // Export un models ko bhi padhta hai — unhein khali list dene wala fake lagate hain
  const models = await Promise.all(
    ['Workout', 'Nutrition', 'Weight', 'Measurement', 'Performance', 'Support', 'Goal', 'Notification'].map(
      async (n) => (await import(`../models/${n}.js`)).default
    )
  );
  for (const m of models) {
    m.find = () => chain([]);
    m.findOne = () => chain(null);
  }
  const r = await srv.request('GET', '/api/auth/export', { token: makeToken('u9') });
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-disposition') || '', /attachment/);
  assert.equal(JSON.stringify(r.json).includes('password'), false);
});

test('token: account delete ho gaya to purana token 401', async () => {
  const r = await srv.request('GET', '/api/auth/export', { token: makeToken('gone-user') });
  assert.equal(r.status, 401);
});

test('token: password badalne se pehle bana token 401', async () => {
  users.push({
    _id: 'u9',
    name: 'Ali',
    email: 'ali@example.com',
    password: 'x',
    passwordChangedAt: new Date(),
  });
  const oldToken = makeToken('u9', { iat: Math.floor(Date.now() / 1000) - 100 });
  const r = await srv.request('GET', '/api/auth/export', { token: oldToken });
  assert.equal(r.status, 401);
});

test('forgot-password: unknown email par bhi ek jaisa jawab (user enumeration nahi)', async () => {
  const unknown = await srv.request('POST', '/api/auth/forgot-password', { body: { email: 'nobody@example.com' } });
  assert.equal(unknown.status, 200);
  assert.equal(unknown.json.token, undefined);
});

test('reset-password: ghalat token par 400', async () => {
  const r = await srv.request('POST', `/api/auth/reset-password/${'0'.repeat(64)}`, { body: { newPassword: 'newpass123' } });
  assert.equal(r.status, 400);
});