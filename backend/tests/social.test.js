import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, makeToken, chain, hashPassword } from './helpers.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import ForumPost from '../models/ForumPost.js';
import Notification from '../models/Notification.js';
import Workout from '../models/Workout.js';
import Nutrition from '../models/Nutrition.js';
import Weight from '../models/Weight.js';
import Measurement from '../models/Measurement.js';
import Performance from '../models/Performance.js';
import Support from '../models/Support.js';
import Goal from '../models/Goal.js';
import { MAX_REPLIES } from '../models/ForumPost.js';

const ID1 = '64b000000000000000000001'; // ali (login wala)
const ID2 = '64b000000000000000000002'; // sara
const ID3 = '64b000000000000000000003'; // baqi
const ME = { _id: ID1, name: 'Ali', username: 'ali', email: 'ali@example.com', preferences: {} };
const SARA = { _id: ID2, name: 'Sara', username: 'sara', email: 'sara@example.com', preferences: {} };

const q = (v) => {
  const p = chain(v);
  p.populate = () => p;
  return p;
};

let userFilters;
let follows;
let notifications;
let posts;
let deletes;

User.findById = (id) => q([ME, SARA].find((u) => u._id === String(id)) || null);
User.find = (filter) => {
  userFilters.push(filter);
  return q([SARA]);
};
User.countDocuments = async () => 1;

Follow.find = () => q(follows);
Follow.aggregate = async () => [];
Follow.create = async (d) => {
  if (follows.some((f) => f.follower === d.follower && String(f.following) === String(d.following))) {
    const e = new Error('dup');
    e.code = 11000;
    throw e;
  }
  follows.push(d);
  return d;
};
Follow.deleteOne = async (f) => {
  follows = follows.filter((x) => !(x.follower === f.follower && String(x.following) === String(f.following)));
  return {};
};
Notification.create = async (d) => {
  notifications.push(d);
  return d;
};

ForumPost.find = (f) => {
  posts.lastFilter = f;
  return q(posts);
};
ForumPost.countDocuments = async () => posts.length;
ForumPost.create = async (d) => {
  const p = { _id: `p${posts.length + 1}`, replies: [], ...d };
  posts.push(p);
  return p;
};
ForumPost.findById = (id) => {
  const p = posts.find((x) => x._id === id);
  if (p) {
    p.save = async () => {};
    p.replies.push = function (r) {
      Array.prototype.push.call(this, { _id: `r${this.length + 1}`, ...r });
      return this.length;
    };
  }
  return q(p || null);
};
ForumPost.findOneAndDelete = async (f) => {
  const i = posts.findIndex((x) => x._id === f._id && x.author === f.author);
  return i === -1 ? null : posts.splice(i, 1)[0];
};
ForumPost.updateOne = async (f, u) => {
  const p = posts.find((x) => x._id === f._id);
  if (!p) return { modifiedCount: 0 };
  const cond = u.$pull.replies;
  const before = p.replies.length;
  p.replies = p.replies.filter((r) => !(r._id === cond._id && r.author === cond.author));
  return { modifiedCount: before - p.replies.length ? 1 : 0 };
};
ForumPost.deleteMany = async (f) => deletes.push(['ForumPost.deleteMany', f]);
ForumPost.updateMany = async (f, u) => deletes.push(['ForumPost.updateMany', f, u]);
Follow.deleteMany = async (f) => deletes.push(['Follow.deleteMany', f]);

let srv;
let token;
before(async () => {
  srv = await startServer();
  token = makeToken(ID1);
});
after(async () => {
  await srv.close();
});
beforeEach(() => {
  userFilters = [];
  follows = [];
  notifications = [];
  posts = [];
  deletes = [];
});

const get = (path) => srv.request('GET', path, { token });

// ---------------- Community ----------------
test('community routes: login ke baghair 401', async () => {
  assert.equal((await srv.request('GET', '/api/users/suggestions')).status, 401);
  assert.equal((await srv.request('GET', '/api/users/search?q=sa')).status, 401);
  assert.equal((await srv.request('POST', `/api/users/${ID2}/follow`)).status, 401);
  assert.equal((await srv.request('GET', '/api/forum')).status, 401);
});

test('follow: khud ko 400, galat id 400, na-maujood user 404', async () => {
  assert.equal((await srv.request('POST', `/api/users/${ID1}/follow`, { token })).status, 400);
  assert.equal((await srv.request('POST', '/api/users/abc/follow', { token })).status, 400);
  assert.equal((await srv.request('POST', `/api/users/${ID3}/follow`, { token })).status, 404);
});

test('follow: pehli baar 201 + notification, dobara follow par duplicate nahi banta', async () => {
  const first = await srv.request('POST', `/api/users/${ID2}/follow`, { token });
  assert.equal(first.status, 201);
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].type, 'follower');
  assert.equal(notifications[0].user, ID2);

  const again = await srv.request('POST', `/api/users/${ID2}/follow`, { token });
  assert.equal(again.status, 200);
  assert.equal(follows.length, 1);
  assert.equal(notifications.length, 1, 'duplicate follow par dobara notification nahi');
});

test('unfollow kaam karta hai', async () => {
  await srv.request('POST', `/api/users/${ID2}/follow`, { token });
  const res = await srv.request('DELETE', `/api/users/${ID2}/follow`, { token });
  assert.equal(res.status, 200);
  assert.equal(follows.length, 0);
});

test('search: 2 se kam characters par 400', async () => {
  assert.equal((await get('/api/users/search?q=a')).status, 400);
});

test('search: regex escape hota hai, khud ko exclude karta hai, email leak nahi hota', async () => {
  const res = await get(`/api/users/search?q=${encodeURIComponent('.*')}`);
  assert.equal(res.status, 200);
  const filter = userFilters[0];
  assert.equal(filter._id.$ne, ID1);
  assert.equal(filter.$or[0].name.source, '\\.\\*'); // ".*" ab sab match nahi karta
  const user = res.json.users[0];
  assert.deepEqual(Object.keys(user).sort(), ['_id', 'followersCount', 'isFollowing', 'name', 'username']);
  assert.equal(JSON.stringify(res.json).includes('example.com'), false);
});

test('search: bohat bara page number cap ho jata hai', async () => {
  const res = await get('/api/users/search?q=sa&page=999999999');
  assert.equal(res.json.page, 1000);
});

test('suggestions / followers / following array wapas dete hain', async () => {
  for (const p of ['suggestions', 'me/followers', 'me/following']) {
    const res = await get(`/api/users/${p}`);
    assert.equal(res.status, 200, p);
    assert.ok(Array.isArray(res.json), p);
  }
});

// ---------------- Forum ----------------
test('forum: post banana validate hota hai', async () => {
  const bad = (body) => srv.request('POST', '/api/forum', { token, body });
  assert.equal((await bad({ title: '', body: 'x' })).status, 400);
  assert.equal((await bad({ title: 'x', body: '' })).status, 400);
  assert.equal((await bad({ title: 'a'.repeat(121), body: 'x' })).status, 400);
  assert.equal((await bad({ title: 'x', body: 'a'.repeat(2001) })).status, 400);
  assert.equal((await bad({ title: 'Diet', body: 'Tips' })).status, 201);
  assert.equal(posts[0].author, ID1);
});

test('forum: list mein body ka sirf preview jata hai aur search escape hoti hai', async () => {
  posts.push({ _id: 'p1', title: 'T', body: 'x'.repeat(500), author: ME, replies: [1, 2] });
  const res = await get(`/api/forum?search=${encodeURIComponent('(a+)+')}`);
  assert.equal(res.json.posts[0].body.length, 200);
  assert.equal(res.json.posts[0].repliesCount, 2);
  assert.equal(posts.lastFilter.$or[0].title.source, '\\(a\\+\\)\\+');
});

test('forum: galat id par 400, na-maujood post par 404', async () => {
  assert.equal((await srv.request('DELETE', '/api/forum/xyz', { token })).status, 400);
  assert.equal((await srv.request('DELETE', '/api/forum/64b0000000000000000000aa', { token })).status, 404);
});

test('forum: apni post delete ho jati hai, dusre ki nahi', async () => {
  const mine = '64b0000000000000000000a1';
  const theirs = '64b0000000000000000000a2';
  posts.push({ _id: mine, title: 'T', body: 'B', author: ID1, replies: [] });
  posts.push({ _id: theirs, title: 'T', body: 'B', author: ID2, replies: [] });
  assert.equal((await srv.request('DELETE', `/api/forum/${theirs}`, { token })).status, 404);
  assert.equal((await srv.request('DELETE', `/api/forum/${mine}`, { token })).status, 200);
  assert.deepEqual(posts.map((p) => p._id), [theirs]);
});

test('forum: reply par post ke author ko notification, apni post par nahi', async () => {
  const pid = '64b0000000000000000000b1';
  posts.push({ _id: pid, title: 'Diet', body: 'B', author: SARA, replies: [] });
  const res = await srv.request('POST', `/api/forum/${pid}/replies`, { token, body: { body: 'Nice' } });
  assert.equal(res.status, 201);
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].type, 'forum_reply');
  assert.equal(notifications[0].user, ID2);
  assert.equal(notifications[0].link, `/forum/${pid}`);

  const pid2 = '64b0000000000000000000b2';
  posts.push({ _id: pid2, title: 'Mine', body: 'B', author: ME, replies: [] });
  await srv.request('POST', `/api/forum/${pid2}/replies`, { token, body: { body: 'self' } });
  assert.equal(notifications.length, 1, 'apni post par reply ki notification nahi');
});

test('forum: reply validate hota hai aur MAX_REPLIES par 400 deta hai (500 nahi)', async () => {
  const pid = '64b0000000000000000000c1';
  posts.push({ _id: pid, title: 'T', body: 'B', author: SARA, replies: [] });
  const send = (body) => srv.request('POST', `/api/forum/${pid}/replies`, { token, body: { body } });
  assert.equal((await send('')).status, 400);
  assert.equal((await send('a'.repeat(1001))).status, 400);
  posts[0].replies = Array.from({ length: MAX_REPLIES }, (_, i) => ({ _id: `x${i}`, author: ID2 }));
  assert.equal((await send('one more')).status, 400);
});

test('forum: reply par author ka account delete ho chuka ho to crash nahi', async () => {
  const pid = '64b0000000000000000000c2';
  posts.push({ _id: pid, title: 'T', body: 'B', author: null, replies: [] });
  const res = await srv.request('POST', `/api/forum/${pid}/replies`, { token, body: { body: 'hi' } });
  assert.equal(res.status, 201);
});

test('forum: sirf apna reply delete hota hai', async () => {
  const pid = '64b0000000000000000000d1';
  const rid = '64b0000000000000000000e1';
  const rid2 = '64b0000000000000000000e2';
  posts.push({
    _id: pid, title: 'T', body: 'B', author: SARA,
    replies: [{ _id: rid, author: ID2, body: 'sara' }, { _id: rid2, author: ID1, body: 'ali' }],
  });
  assert.equal((await srv.request('DELETE', `/api/forum/${pid}/replies/${rid}`, { token })).status, 404);
  assert.equal((await srv.request('DELETE', `/api/forum/${pid}/replies/${rid2}`, { token })).status, 200);
  assert.deepEqual(posts[0].replies.map((r) => r._id), [rid]);
  assert.equal((await srv.request('DELETE', `/api/forum/${pid}/replies/bad`, { token })).status, 400);
});

// ---------------- Privacy: account delete ----------------
test('account delete: follows, posts aur replies bhi saaf hote hain', async () => {
  const hash = await hashPassword('Secret123');
  const full = { ...ME, password: hash, deleteOne: async () => {} };
  User.findById = (id) => q(String(id) === ID1 ? full : null);
  for (const M of [Workout, Nutrition, Weight, Measurement, Performance, Support, Goal, Notification]) {
    M.deleteMany = async () => ({});
  }
  const res = await srv.request('DELETE', '/api/auth/account', { token, body: { password: 'Secret123' } });
  assert.equal(res.status, 200);
  const names = deletes.map((d) => d[0]);
  assert.deepEqual(names.sort(), ['Follow.deleteMany', 'ForumPost.deleteMany', 'ForumPost.updateMany']);
  const f = deletes.find((d) => d[0] === 'Follow.deleteMany')[1];
  assert.equal(f.$or.length, 2); // follower + following dono taraf
});