import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, makeToken, chain } from './helpers.js';
import User from '../models/User.js';
import Support from '../models/Support.js';
import Notification from '../models/Notification.js';
import { isAdminEmail } from '../utils/adminEmails.js';

// ---- Fakes ----
const normal = { _id: 'u1', name: 'Ali', email: 'ali@example.com', role: 'user', preferences: {} };
const admin = { _id: 'a1', name: 'Boss', email: 'boss@example.com', role: 'admin', preferences: {} };
User.findById = (id) => chain([normal, admin].find((u) => u._id === id) || null);
User.find = () => chain([]);

let tickets;
let notifications;
Notification.create = async (d) => {
  notifications.push(d);
  return d;
};
Support.create = async (d) => {
  const t = { _id: `t${tickets.length + 1}`, replies: [], status: 'open', ...d };
  tickets.push(t);
  return t;
};
Support.find = (f) => chain(tickets.filter((t) => t.user === f.user));
Support.countDocuments = async () => tickets.length;
Support.findOne = async (f) => {
  const t = tickets.find((x) => x._id === f._id && x.user === f.user);
  if (!t) return null;
  t.save = async () => {};
  return t;
};
Support.findById = (id) => {
  const t = tickets.find((x) => x._id === id);
  if (t) {
    t.save = async () => {};
    t.user = t.user === null || (t.user && typeof t.user === 'object') ? t.user : { _id: t.user, preferences: {} };
  }
  const q = chain(t || null);
  q.populate = () => q; // controller .populate('user', ...) bulata hai
  return q;
};

let srv;
let userToken;
let adminToken;
before(async () => {
  srv = await startServer();
  userToken = makeToken('u1');
  adminToken = makeToken('a1');
});
after(async () => {
  await srv.close();
});
beforeEach(() => {
  tickets = [];
  notifications = [];
});

test('isAdminEmail: sirf .env list wali email admin hai (case se farq nahi)', () => {
  process.env.ADMIN_EMAILS = 'Boss@Example.com, other@x.com';
  assert.equal(isAdminEmail('boss@example.com'), true);
  assert.equal(isAdminEmail(' OTHER@x.com '), true);
  assert.equal(isAdminEmail('ali@example.com'), false);
  process.env.ADMIN_EMAILS = '';
  assert.equal(isAdminEmail('boss@example.com'), false);
});

test('normal user admin routes par 403 paata hai', async () => {
  assert.equal((await srv.request('GET', '/api/support/admin/all', { token: userToken })).status, 403);
  assert.equal(
    (await srv.request('POST', '/api/support/admin/t1/reply', { token: userToken, body: { message: 'hi' } })).status,
    403
  );
  assert.equal(
    (await srv.request('PATCH', '/api/support/admin/t1/status', { token: userToken, body: { status: 'resolved' } })).status,
    403
  );
});

test('bina login ke admin route 401', async () => {
  assert.equal((await srv.request('GET', '/api/support/admin/all')).status, 401);
});

test('admin ka jawab: ticket mein reply judta hai aur user ko link wali notification milti hai', async () => {
  tickets.push({ _id: 't1', user: 'u1', subject: 'Bug', category: 'bug', message: 'x', status: 'open', replies: [] });
  const r = await srv.request('POST', '/api/support/admin/t1/reply', {
    token: adminToken,
    body: { message: 'Theek kar diya', resolve: true },
  });
  assert.equal(r.status, 201);
  assert.equal(tickets[0].replies.length, 1);
  assert.equal(tickets[0].replies[0].from, 'admin');
  assert.equal(tickets[0].status, 'resolved');
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].type, 'support_reply');
  assert.equal(notifications[0].link, '/support');
});

test('khali jawab 400, maujood na hone wala ticket 404', async () => {
  tickets.push({ _id: 't1', user: 'u1', subject: 'Bug', category: 'bug', message: 'x', status: 'open', replies: [] });
  assert.equal((await srv.request('POST', '/api/support/admin/t1/reply', { token: adminToken, body: { message: '  ' } })).status, 400);
  assert.equal((await srv.request('POST', '/api/support/admin/nope/reply', { token: adminToken, body: { message: 'hi' } })).status, 404);
});

test('ghalat status 400', async () => {
  tickets.push({ _id: 't1', user: 'u1', subject: 'Bug', category: 'bug', message: 'x', status: 'open', replies: [] });
  const r = await srv.request('PATCH', '/api/support/admin/t1/status', { token: adminToken, body: { status: 'deleted' } });
  assert.equal(r.status, 400);
});

test('user sirf apne ticket par dobara likh sakta hai (doosre ka ticket 404)', async () => {
  tickets.push({ _id: 't1', user: 'u2', subject: 'Bug', category: 'bug', message: 'x', status: 'resolved', replies: [] });
  const r = await srv.request('POST', '/api/support/t1/reply', { token: userToken, body: { message: 'hi' } });
  assert.equal(r.status, 404);
  tickets.push({ _id: 't2', user: 'u1', subject: 'Mine', category: 'bug', message: 'x', status: 'resolved', replies: [] });
  const ok = await srv.request('POST', '/api/support/t2/reply', { token: userToken, body: { message: 'phir se' } });
  assert.equal(ok.status, 201);
  assert.equal(tickets[1].status, 'open'); // resolved ticket dobara open
  assert.equal(tickets[1].replies[0].from, 'user');
});
test('jis user ka account delete ho chuka, uske ticket par admin jawab de sakta hai (crash nahi)', async () => {
  tickets.push({ _id: 't9', user: null, subject: 'Purana', category: 'other', message: 'x', status: 'open', replies: [] });
  const r = await srv.request('POST', '/api/support/admin/t9/reply', { token: adminToken, body: { message: 'ok' } });
  assert.equal(r.status, 201);
  assert.equal(notifications.length, 0);
  const s = await srv.request('PATCH', '/api/support/admin/t9/status', { token: adminToken, body: { status: 'open' } });
  assert.equal(s.status, 200);
});