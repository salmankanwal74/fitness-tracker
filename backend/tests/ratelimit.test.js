import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Is file mein limit chhoti rakhni hai, isliye helpers se PEHLE set karte hain
process.env.AUTH_RATE_LIMIT = '5';
const { startServer } = await import('./helpers.js');

let srv;
before(async () => {
  srv = await startServer();
});
after(async () => {
  await srv.close();
});

test('login par bar bar koshish karne se 429 (brute-force se bachao)', async () => {
  const statuses = [];
  for (let i = 0; i < 7; i++) {
    const r = await srv.request('POST', '/api/auth/login', { body: {} });
    statuses.push(r.status);
  }
  // Pehli 5 requests normal (400: khali fields), us ke baad 429
  assert.deepEqual(statuses.slice(0, 5), [400, 400, 400, 400, 400]);
  assert.deepEqual(statuses.slice(5), [429, 429]);
});

test('429 ke jawab mein samajh aane wala message hai', async () => {
  const r = await srv.request('POST', '/api/auth/login', { body: {} });
  assert.equal(r.status, 429);
  assert.match(r.json.message, /koshishein/);
});