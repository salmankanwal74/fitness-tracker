// Chalane ka tareeqa:  npm run check:setup
// Batata hai ke Admin Support, Community/Forum aur baqi features ki zaroori cheezein project mein maujood hain ya nahi.
// Database ya internet nahi chahiye, aur kuch badalta bhi nahi.
import 'dotenv/config';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'check-setup-only';
process.env.AUTH_RATE_LIMIT = '1000';
process.env.API_RATE_LIMIT = '10000';

const results = [];
const check = (name, ok, fix) => results.push({ name, ok, fix });

const tryImport = async (path) => {
  try {
    return await import(path);
  } catch (e) {
    return { __error: e.message };
  }
};

// ---- 1. Models ----
const User = (await tryImport('../models/User.js')).default;
check('User model mein `role` field hai', Boolean(User?.schema?.path('role')), 'models/User.js mein role add karein (Admin Support B4)');

const Notification = (await tryImport('../models/Notification.js')).default;
const types = Notification?.schema?.path('type')?.enumValues || [];
check(
  'Notification type mein support_ticket aur support_reply hain',
  types.includes('support_ticket') && types.includes('support_reply'),
  'models/Notification.js poori replace karein (Admin Support B3)'
);
check('Notification model mein `link` field hai', Boolean(Notification?.schema?.path('link')), 'models/Notification.js (B3)');

const Support = (await tryImport('../models/Support.js')).default;
check('Support model mein `replies` hain', Boolean(Support?.schema?.path('replies')), 'models/Support.js poori replace karein (B2)');

// ---- 2. Middleware / utils ----
const auth = await tryImport('../middleware/authMiddleware.js');
check('authMiddleware mein adminOnly hai', typeof auth.adminOnly === 'function', 'middleware/authMiddleware.js ke aakhir mein adminOnly add karein (B5)');

const adminEmails = await tryImport('../utils/adminEmails.js');
check('utils/adminEmails.js maujood hai', typeof adminEmails.applyAdminRole === 'function', 'utils/adminEmails.js nayi file banayein (B1)');

const notify = await tryImport('../utils/notify.js');
check('utils/notify.js maujood hai', typeof notify.createNotification === 'function', 'utils/notify.js dekhein');
if (notify.createNotification && Notification) {
  // Asli check: link dene par woh Notification.create tak pahunchta hai ya nahi (database ki zaroorat nahi)
  let saved = null;
  const original = Notification.create;
  Notification.create = async (doc) => {
    saved = doc;
    return doc;
  };
  await notify.createNotification({ _id: 'x', preferences: {} }, { type: 'system', message: 'test', key: 'k', link: '/support' });
  Notification.create = original;
  check('createNotification `link` save karta hai', saved?.link === '/support', 'utils/notify.js mein link wali 2 lines badlein (B8)');
}

for (const [file, label, fix] of [
  ['../utils/logger.js', 'utils/logger.js (Step 9)', 'Step 9 Part A lagayein'],
  ['../utils/paginate.js', 'utils/paginate.js (Step 10)', 'Step 10 lagayein'],
  ['../middleware/sanitize.js', 'middleware/sanitize.js (Step 10)', 'Step 10 lagayein'],
]) {
  const m = await tryImport(file);
  check(`${label} maujood hai`, !m.__error, fix);
}

// ---- 3. Routes (asli app par request bhej kar: 404 = route mounted nahi, 401 = route maujood) ----
const appMod = await tryImport('../app.js');
if (appMod.__error) {
  check('app.js load hota hai', false, `app.js mein error: ${appMod.__error}`);
} else {
  const server = await new Promise((resolve) => {
    const s = appMod.default.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const routes = [
    ['/api/support/admin/all', 'Admin Support route', "supportRoutes.js poori replace karein (B6)"],
    ['/api/users/suggestions', 'Community (users) route', "app.js mein app.use('/api/users', userRoutes);"],
    ['/api/forum', 'Forum route', "app.js mein app.use('/api/forum', forumRoutes);"],
    ['/api/notifications', 'Notifications route', "app.js mein notificationRoutes"],
    ['/api/support', 'Support route', "app.js mein supportRoutes"],
  ];
  for (const [path, label, fix] of routes) {
    const res = await fetch(base + path);
    check(`${label} (${path}) mounted hai`, res.status === 401, fix);
  }
  await new Promise((r) => server.close(r));
}

// ---- 4. Env ----
check(
  '.env mein ADMIN_EMAILS hai (admin banane ke liye)',
  Boolean((process.env.ADMIN_EMAILS || '').trim()) || 'skip',
  'backend/.env mein ADMIN_EMAILS=aap-ki-email@gmail.com likhein'
);

// ---- Natija ----
let bad = 0;
for (const r of results) {
  if (r.ok === 'skip') {
    console.log(`?  ${r.name}  (abhi khali hai: admin ka account nahi banega, jab Support Inbox chahiye tab daalein)`);
    continue;
  }
  console.log(`${r.ok ? 'OK ' : 'XX '} ${r.name}`);
  if (!r.ok) {
    bad += 1;
    console.log(`     -> ${r.fix}`);
  }
}
console.log(bad ? `\n${bad} cheez(ein) theek karni hain.` : '\nSab theek hai.');
process.exit(bad ? 1 : 0);