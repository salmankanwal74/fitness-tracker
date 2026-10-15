// NoSQL injection se bachao: request ke body/query mein se wo keys hata deta hai jo "$" se shuru hon
// (jaise {"$ne": ""}, {"$gt": ""}) ya jin mein "." ho. Normal data par koi asar nahi.
const isDangerous = (key) => key.startsWith('$') || key.includes('.');

export const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (!isDangerous(k)) out[k] = clean(v);
    }
    return out;
  }
  return value;
};

export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);

  // Express 5 mein req.query sirf padhne wali property hai, isliye use is tarah badalna parta hai
  if (req.query && typeof req.query === 'object') {
    Object.defineProperty(req, 'query', {
      value: clean(req.query),
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
  next();
};