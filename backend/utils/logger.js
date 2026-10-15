// Chhota structured logger (koi naya package nahi chahiye).
//  - Production (NODE_ENV=production): har line ek JSON  {"time":..., "level":..., "msg":..., ...}
//    (log tools jaise Datadog/Loki/CloudWatch aasani se padh lete hain)
//  - Development: seedhi parhne wali line
//  - LOG_LEVEL = debug | info | warn | error | silent   (tests mein default silent)
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

const currentLevel = () => {
  const name = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info')).toLowerCase();
  return LEVELS[name] ?? LEVELS.info;
};

const write = (level, msg, meta = {}) => {
  if (LEVELS[level] < currentLevel()) return;
  const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;

  if (process.env.NODE_ENV === 'production') {
    stream.write(`${JSON.stringify({ time: new Date().toISOString(), level, msg, ...meta })}\n`);
  } else {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    stream.write(`${new Date().toISOString().slice(11, 19)} [${level}] ${msg}${extra}\n`);
  }
};

const logger = {
  debug: (msg, meta) => write('debug', msg, meta),
  info: (msg, meta) => write('info', msg, meta),
  warn: (msg, meta) => write('warn', msg, meta),
  error: (msg, meta) => write('error', msg, meta),
};

export default logger;