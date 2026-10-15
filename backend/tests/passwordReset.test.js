import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, makeToken, hashPassword, chain } from './helpers.js';
import User from '../models/User.js';

let doc;
User.findOne = (q) => {
  let found = null;
  if (q.$or) found = q.$or.some((c) => c.email === doc.email) ? doc : null; // login ka sawal
  if (q.email && q.email === doc.email) found = doc;
  if (q.passwordResetToken && doc.passwordResetToken === q.passwordResetToken && doc.passwordResetExpires > q.passwordResetExpires.$gt) {
    found = doc;
  }
  return chain(found);
};
User.findById = (id) => chain(id === doc._id ? doc : null);

let srv;
const logs = [];
const origLog = console.log;

before(async () => {
  doc = {
    _id: 'u1',
    name: 'Ali',
    email: 'ali@example.com',
    password: await hashPassword('oldpass1'),
    save: async () => doc,
  };
  srv = await startServer();
  console.log = (...a) => logs.push(a.join(' ')); // dev mode mein reset link console par aata hai
});
after(async () => {
  console.log = origLog;
  await srv.close();
});

test('poora flow: forgot -> reset -> naya password chalta hai, purana token band', async () => {
  const oldToken = makeToken('u1', { iat: Math.floor(Date.now() / 1000) - 100 });

  const forgot = await srv.request('POST', '/api/auth/forgot-password', { body: { email: 'ali@example.com' } });
  assert.equal(forgot.status, 200);

  const link = logs.join('\n').match(/reset-password\/([a-f0-9]{64})/);
  assert.ok(link, 'reset link console par aana chahiye (SMTP ke baghair)');
  // Token database mein hash ho kar rakha jata hai, asli token nahi
  assert.notEqual(doc.passwordResetToken, link[1]);

  const short = await srv.request('POST', `/api/auth/reset-password/${link[1]}`, { body: { newPassword: '123' } });
  assert.equal(short.status, 400);

  const reset = await srv.request('POST', `/api/auth/reset-password/${link[1]}`, { body: { newPassword: 'newpass123' } });
  assert.equal(reset.status, 200);
  assert.ok(reset.json.token);

  // Wahi link dobara istemal nahi ho sakta
  const reuse = await srv.request('POST', `/api/auth/reset-password/${link[1]}`, { body: { newPassword: 'another123' } });
  assert.equal(reuse.status, 400);

  // Naye password se login
  const login = await srv.request('POST', '/api/auth/login', { body: { identifier: 'ali@example.com', password: 'newpass123' } });
  assert.equal(login.status, 200);
  const stale = await srv.request('POST', '/api/auth/login', { body: { identifier: 'ali@example.com', password: 'oldpass1' } });
  assert.equal(stale.status, 400);

  // Reset se pehle ka token ab kaam nahi karta
  const me = await srv.request('GET', '/api/auth/export', { token: oldToken });
  assert.equal(me.status, 401);
});