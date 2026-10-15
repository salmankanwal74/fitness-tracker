import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

let srv;
before(async () => {
  srv = await startServer();
});
after(async () => {
  await srv.close();
});

test('GET / API chal rahi hai', async () => {
  const r = await srv.request('GET', '/');
  assert.equal(r.status, 200);
  assert.match(r.text, /Fitness Tracker API/);
});

test('GET /health: database na ho to 503 "degraded"', async () => {
  const r = await srv.request('GET', '/health');
  assert.equal(r.status, 503);
  assert.equal(r.json.status, 'degraded');
  assert.equal(r.json.db, 'disconnected');
  assert.equal(typeof r.json.uptime, 'number');
});

test('Unknown route 404 JSON deta hai', async () => {
  const r = await srv.request('GET', '/api/does-not-exist');
  assert.equal(r.status, 404);
  assert.match(r.json.message, /Route nahi mila/);
});

test('Kharab JSON body par 400 (crash nahi)', async () => {
  const r = await srv.request('POST', '/api/auth/login', { raw: '{bad json' });
  assert.equal(r.status, 400);
  assert.match(r.json.message, /JSON/);
});

test('Bohat bari body par 413', async () => {
  const big = JSON.stringify({ x: 'a'.repeat(4 * 1024 * 1024) });
  const r = await srv.request('POST', '/api/auth/login', { raw: big });
  assert.equal(r.status, 413);
});

test('Security headers (helmet) lage hain', async () => {
  const r = await srv.request('GET', '/');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(r.headers.get('x-frame-options') || r.headers.get('content-security-policy'));
  assert.equal(r.headers.get('x-powered-by'), null);
});

test('Protected routes token ke baghair 401 dete hain', async () => {
  const paths = [
    '/api/workouts',
    '/api/weight',
    '/api/nutrition',
    '/api/measurements',
    '/api/performance',
    '/api/goals',
    '/api/notifications',
    '/api/settings',
    '/api/auth/export',
  ];
  for (const p of paths) {
    const r = await srv.request('GET', p);
    assert.equal(r.status, 401, `${p} ko 401 dena chahiye tha, mila ${r.status}`);
  }
});

test('Ghalat token par 401', async () => {
  const r = await srv.request('GET', '/api/workouts', { token: 'not.a.real.token' });
  assert.equal(r.status, 401);
});