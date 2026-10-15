// Numbers ki range check karne wala chhota middleware.
// Istemal: validateNumbers({ weight: { min: 1, max: 700, required: true } })
export const validateNumbers = (rules) => (req, res, next) => {
  const body = req.body || {};
  const isCreate = req.method === 'POST';

  for (const [field, rule] of Object.entries(rules)) {
    const raw = body[field];
    const empty = raw === undefined || raw === null || raw === '';

    if (empty) {
      if (rule.required && isCreate) {
        return res.status(400).json({ message: `${rule.label || field} zaroori hai` });
      }
      continue;
    }

    const value = Number(raw);
    if (!Number.isFinite(value)) {
      return res.status(400).json({ message: `${rule.label || field} sahi number hona chahiye` });
    }
    if (rule.min !== undefined && value < rule.min) {
      return res.status(400).json({ message: `${rule.label || field} kam az kam ${rule.min} hona chahiye` });
    }
    if (rule.max !== undefined && value > rule.max) {
      return res.status(400).json({ message: `${rule.label || field} zyada se zyada ${rule.max} ho sakta hai` });
    }
  }
  next();
};

// Text fields ki max length check
export const validateText = (rules) => (req, res, next) => {
  const body = req.body || {};
  for (const [field, max] of Object.entries(rules)) {
    if (typeof body[field] === 'string' && body[field].length > max) {
      return res.status(400).json({ message: `${field} ${max} characters se zyada nahi ho sakta` });
    }
  }
  next();
};