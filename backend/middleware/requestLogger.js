import crypto from 'node:crypto';
import logger from '../utils/logger.js';

// Har request ko ek id deta hai (X-Request-Id header mein wapas bhi bhejta hai) aur jawab dene ke baad
// ek line log karta hai: method, path, status, kitne ms lage, kaun sa user.
// Password ya token kabhi log nahi hota; query string bhi nahi (us mein reset token jaisa kuch ho sakta hai).
export const requestLogger = (req, res, next) => {
  const incoming = req.headers['x-request-id'];
  req.id = typeof incoming === 'string' && /^[\w-]{1,64}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);

  const start = process.hrtime.bigint();
  res.on('finish', () => {
    // Health check har kuch second mein aata hai, usay tab tak chhupa dete hain jab tak masla na ho
    if (req.path === '/health' && res.statusCode < 400) return;
    const ms = Math.round(Number(process.hrtime.bigint() - start) / 1e6);
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('request', {
      id: req.id,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      ms,
      user: req.user?._id ? String(req.user._id) : undefined,
    });
  });
  next();
};