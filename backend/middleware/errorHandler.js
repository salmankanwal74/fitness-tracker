import logger from '../utils/logger.js';

// Koi route na mile to
export const notFound = (req, res) => {
  res.status(404).json({ message: `Route nahi mila: ${req.method} ${req.originalUrl}` });
};

// Har unhandled error yahan aata hai (Express 5 async errors bhi pakadta hai)
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  logger.error('request failed', {
    id: req.id,
    method: req.method,
    path: req.originalUrl.split('?')[0],
    error: err.message,
    // Stack sirf development mein; production logs mein nahi
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request ka JSON sahi nahi hai' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request bohat bari hai' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 && process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  });
};