import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';
import logger from '../utils/logger.js';

// stdout/stderr ko pakadne ka chhota helper
const capture = (fn) => {
  const lines = [];
  const o1 = process.stdout.write.bind(process.stdout);
  const o2 = process.stderr.write.bind(process.stderr);
  process.stdout.write = (s) => (lines.push(String(s)), true);
  process.stderr.write = (s) => (lines.push(String(s)), true);
  try {
    fn();
  } finally {
    process.stdout.write = o1;
    process.stderr.write = o2;
  }
  return lines;
};

const withEnv = (env, fn) => {
  const old = {};
  for (const k of Object.keys(env)) {
    old[k] = process.env[k];
    if (env[k] === undefined) delete process.env[k];
    else process.env[k] = env[k];
  }
  try {
    return fn();
  } finally {
    for (const k of Object.keys(old)) {
      if (old[k] === undefined) delete process.env[k];
      else process.env[k] = old[k];
    }
  }
};

test('tests mein logger default khamosh hai', () => {
  const lines = capture(() => logger.info('hello'));
  assert.equal(lines.length, 0);
});

test('production mein har log ek JSON line hai (time, level, msg + extra)', () => {
  const lines = withEnv({ NODE_ENV: 'production', LOG_LEVEL: 'info' }, () =>
    capture(() => logger.info('server started', { port: 5000 }))
  );
  assert.equal(lines.length, 1);
  const row = JSON.parse(lines[0]);
  assert.equal(row.level, 'info');
  assert.equal(row.msg, 'server started');
  assert.equal(row.port, 5000);
  assert.ok(!Number.isNaN(Date.parse(row.time)));
});

test('development mein parhne wali line', () => {
  const lines = withEnv({ NODE_ENV: 'development', LOG_LEVEL: 'info' }, () => capture(() => logger.warn('slow')));
  assert.match(lines[0], /\[warn\] slow/);
});

test('LOG_LEVEL se filter: warn level par info nahi aata, error aata hai', () => {
  const lines = withEnv({ NODE_ENV: 'production', LOG_LEVEL: 'warn' }, () =>
    capture(() => {
      logger.info('chhupa');
      logger.debug('chhupa');
      logger.warn('dikhega');
      logger.error('dikhega');
    })
  );
  assert.equal(lines.length, 2);
});

test('error aur warn stderr par jate hain', () => {
  const calls = [];
  const o = process.stderr.write.bind(process.stderr);
  process.stderr.write = (s) => (calls.push(String(s)), true);
  try {
    withEnv({ NODE_ENV: 'production', LOG_LEVEL: 'info' }, () => logger.error('boom'));
  } finally {
    process.stderr.write = o;
  }
  assert.equal(calls.length, 1);
});

let srv;
before(async () => {
  srv = await startServer();
});
after(async () => {
  await srv.close();
});

test('har jawab mein X-Request-Id header aata hai', async () => {
  const r = await srv.request('GET', '/');
  assert.match(r.headers.get('x-request-id'), /^[\w-]{8,64}$/);
});

test('client ki bheji sahi X-Request-Id wapas milti hai', async () => {
  const r = await srv.request('GET', '/', { headers: { 'X-Request-Id': 'trace-abc-123' } });
  assert.equal(r.headers.get('x-request-id'), 'trace-abc-123');
});

test('ghalat/khatarnak X-Request-Id ki jagah naya id banta hai (log injection se bachao)', async () => {
  const r = await srv.request('GET', '/', { headers: { 'X-Request-Id': 'bad id with spaces' } });
  assert.notEqual(r.headers.get('x-request-id'), 'bad id with spaces');
  assert.match(r.headers.get('x-request-id'), /^[\w-]+$/);
});

test('request log mein query string (jis mein token ho sakta hai) nahi aati', async () => {
  const lines = [];
  const o = process.stdout.write.bind(process.stdout);
  const o2 = process.stderr.write.bind(process.stderr);
  process.stdout.write = (s) => (lines.push(String(s)), true);
  process.stderr.write = (s) => (lines.push(String(s)), true);
  process.env.NODE_ENV = 'production';
  process.env.LOG_LEVEL = 'info';
  try {
    await srv.request('GET', '/api/nothing-here?token=SECRET123');
    await new Promise((r) => setTimeout(r, 50));
  } finally {
    process.stdout.write = o;
    process.stderr.write = o2;
    process.env.NODE_ENV = 'test';
    delete process.env.LOG_LEVEL;
  }
  const joined = lines.join('');
  assert.ok(joined.includes('/api/nothing-here'), 'path log hona chahiye');
  assert.equal(joined.includes('SECRET123'), false);
});