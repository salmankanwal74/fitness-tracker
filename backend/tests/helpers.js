// Tests ke liye common madad: env set karna, server start karna, fake (mock) database.
// Koi asli MongoDB nahi chahiye — models ke functions ko memory wale fake se badal dete hain.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-only-for-tests';
// Tests bohat saari requests karte hain, isliye limit unchi (ratelimit.test.js apni limit khud set karta hai)
process.env.AUTH_RATE_LIMIT = process.env.AUTH_RATE_LIMIT || '1000';
process.env.API_RATE_LIMIT = process.env.API_RATE_LIMIT || '10000';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Quiet logs: morgan/errorHandler ka shor test output mein na aaye
const origError = console.error;
console.error = (...args) => {
  if (String(args[0]).startsWith('[error]')) return;
  origError(...args);
};

export const startServer = async () => {
  const { default: app } = await import('../app.js');
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const request = async (method, path, { body, token, headers = {}, raw } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* text response */
    }
    return { status: res.status, json, text, headers: res.headers };
  };

  return {
    base,
    request,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
};

export const makeToken = (id, extra = {}) =>
  jwt.sign({ id, ...extra }, process.env.JWT_SECRET, { expiresIn: '1h' });

export const hashPassword = (plain) => bcrypt.hash(plain, 4);

// mongoose query jaisa chain (.select/.sort/.limit) banane wala helper
export const chain = (value) => {
  const p = Promise.resolve(value);
  p.select = () => p;
  p.sort = () => p;
  p.limit = () => p;
  p.skip = () => p;
  p.lean = () => p;
  return p;
};