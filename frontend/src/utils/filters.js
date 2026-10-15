// Pages par search/filter ke liye chhote helpers

// "2026-10-07T00:00:00.000Z" -> "2026-10-07"
export const dateOnly = (d) => String(d).split('T')[0];

// from/to khali ho to us taraf koi hadd nahi (dono "YYYY-MM-DD" strings)
export const inDateRange = (date, from, to) => {
  const d = dateOnly(date);
  return (!from || d >= from) && (!to || d <= to);
};

// order: 'newest' (naya pehle) ya 'oldest' (purana pehle)
export const sortByDate = (list, order = 'newest') =>
  [...list].sort((a, b) =>
    order === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)
  );