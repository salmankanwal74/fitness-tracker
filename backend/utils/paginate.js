// Bohat saari entries ek saath mangwane se bachne ke liye.
// Jawab hamesha ARRAY hi rehta hai (frontend ko kuch badalna nahi parta); page ki maloomat headers mein aati hai:
//   X-Total-Count (kul entries), X-Page, X-Limit
// Query: ?page=2&limit=50   (default: page 1, limit 1000, max 1000)
const DEFAULT_LIMIT = 1000;
const MAX_LIMIT = 1000;

export const getPageParams = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  return { page, limit };
};

// Model: mongoose model, filter: query object, sortField: 'date' ya 'createdAt'
// direction: -1 = nayi pehle (newest first), 1 = purani pehle (graphs ke liye)
// Page hamesha "sab se nayi entries" se banta hai; direction 1 ho to us page ke andar tarteeb purani se nayi hoti hai.
export const paginatedFind = async (Model, filter, req, res, { sortField = 'date', direction = -1 } = {}) => {
  const { page, limit } = getPageParams(req.query);
  const total = await Model.countDocuments(filter);
  const docs = await Model.find(filter)
    .sort({ [sortField]: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  const list = Array.isArray(docs) ? [...docs] : docs;
  if (direction === 1 && Array.isArray(list)) list.reverse();

  res.set('X-Total-Count', String(total));
  res.set('X-Page', String(page));
  res.set('X-Limit', String(limit));
  res.set('Access-Control-Expose-Headers', 'X-Total-Count, X-Page, X-Limit');
  return list;
};