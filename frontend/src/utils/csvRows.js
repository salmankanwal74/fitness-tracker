// CSV mein sirf kaam ke columns jaayen (database ki _id, user, __v wagera nahi)
const day = (d) => String(d).split('T')[0];

export const workoutsToCSVRows = (workouts) =>
  workouts.map((w) => ({
    date: day(w.date),
    exercise: w.exerciseName,
    category: w.category,
    tags: (w.tags || []).join('; '),
    sets: w.sets,
    reps: w.reps,
    weight_kg: w.weight || 0,
    duration_min: w.duration ?? '',
    calories_burned: w.caloriesBurned ?? '',
    notes: w.notes || '',
  }));

export const nutritionToCSVRows = (entries) =>
  entries.map((n) => ({
    date: day(n.date),
    meal: n.mealType,
    food: n.foodItem,
    quantity: n.quantity,
    calories: n.calories,
    protein_g: n.protein || 0,
    carbs_g: n.carbs || 0,
    fats_g: n.fats || 0,
  }));