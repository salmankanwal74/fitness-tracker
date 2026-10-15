// Aam khanon ka chhota database (andazan values, USDA/aam nutrition tables ke mutabiq).
// Har row: [naam, unit, base, calories, protein(g), carbs(g), fats(g)]
//   unit 'g' / 'ml'  -> values 100 g / 100 ml ke liye hain
//   baaqi units      -> values 1 piece / 1 cup / 1 slice wagera ke liye hain
const ROWS = [
  // Desi khana
  ['Roti / Chapati', 'piece', 1, 120, 3.6, 18, 3.7],
  ['Paratha', 'piece', 1, 260, 5, 32, 12],
  ['Naan', 'piece', 1, 260, 8, 45, 5],
  ['Rice (boiled)', 'g', 100, 130, 2.7, 28, 0.3],
  ['Chicken Biryani', 'g', 100, 160, 7, 20, 5],
  ['Daal (cooked)', 'g', 100, 130, 7, 15, 5],
  ['Chicken Karahi', 'g', 100, 150, 14, 3, 9],
  ['Chicken Tikka', 'g', 100, 148, 24, 3, 4],
  ['Seekh Kabab', 'piece', 1, 110, 8, 1, 8],
  ['Nihari', 'g', 100, 150, 12, 3, 10],
  ['Haleem', 'g', 100, 140, 9, 10, 7],
  ['Mutton Curry', 'g', 100, 200, 18, 3, 13],
  ['Chana (chickpeas, cooked)', 'g', 100, 164, 8.9, 27, 2.6],
  ['Rajma (kidney beans, cooked)', 'g', 100, 127, 8.7, 22.8, 0.5],
  ['Palak (spinach, cooked)', 'g', 100, 23, 2.9, 3.6, 0.4],
  ['Samosa', 'piece', 1, 250, 4, 28, 14],
  ['Chai (milk + sugar)', 'cup', 1, 90, 2, 12, 3.5],
  ['Lassi (sweet)', 'glass', 1, 180, 6, 28, 4],
  ['Kheer', 'g', 100, 120, 3.5, 19, 3.5],
  ['Gulab Jamun', 'piece', 1, 150, 2, 22, 6],
  // Protein
  ['Egg (boiled)', 'piece', 1, 72, 6.3, 0.4, 4.8],
  ['Egg (fried)', 'piece', 1, 90, 6.3, 0.4, 7],
  ['Chicken Breast (cooked)', 'g', 100, 165, 31, 0, 3.6],
  ['Beef (cooked)', 'g', 100, 250, 26, 0, 15],
  ['Fish (grilled)', 'g', 100, 140, 24, 0, 4],
  ['Salmon (cooked)', 'g', 100, 208, 20, 0, 13],
  ['Paneer', 'g', 100, 265, 18, 1.2, 20],
  ['Whey Protein', 'scoop', 1, 120, 24, 3, 1.5],
  ['Protein Bar', 'piece', 1, 200, 20, 22, 7],
  // Dairy
  ['Milk (full cream)', 'ml', 100, 61, 3.2, 4.8, 3.3],
  ['Yogurt / Dahi', 'g', 100, 61, 3.5, 4.7, 3.3],
  ['Cheese slice', 'slice', 1, 70, 4, 0.5, 5.5],
  ['Butter', 'tbsp', 1, 102, 0.1, 0, 11.5],
  ['Ghee', 'tbsp', 1, 112, 0, 0, 12.7],
  ['Olive Oil', 'tbsp', 1, 119, 0, 0, 13.5],
  // Grains / bread
  ['Bread (white slice)', 'slice', 1, 79, 2.7, 15, 1],
  ['Bread (brown slice)', 'slice', 1, 70, 3.5, 12, 1],
  ['Oats (dry)', 'g', 100, 389, 16.9, 66, 6.9],
  ['Cornflakes', 'g', 100, 357, 7.5, 84, 0.4],
  ['Pasta (cooked)', 'g', 100, 158, 5.8, 31, 0.9],
  ['Quinoa (cooked)', 'g', 100, 120, 4.4, 21, 1.9],
  // Fruits
  ['Banana', 'piece', 1, 105, 1.3, 27, 0.4],
  ['Apple', 'piece', 1, 95, 0.5, 25, 0.3],
  ['Orange', 'piece', 1, 62, 1.2, 15, 0.2],
  ['Mango', 'g', 100, 60, 0.8, 15, 0.4],
  ['Date (khajoor)', 'piece', 1, 20, 0.2, 5.3, 0],
  ['Grapes', 'g', 100, 69, 0.7, 18, 0.2],
  ['Watermelon', 'g', 100, 30, 0.6, 7.6, 0.2],
  ['Orange Juice', 'ml', 100, 45, 0.7, 10, 0.2],
  // Vegetables
  ['Potato (boiled)', 'g', 100, 87, 1.9, 20, 0.1],
  ['Sweet Potato', 'g', 100, 86, 1.6, 20, 0.1],
  ['Broccoli', 'g', 100, 34, 2.8, 7, 0.4],
  ['Cucumber', 'g', 100, 15, 0.7, 3.6, 0.1],
  ['Tomato', 'g', 100, 18, 0.9, 3.9, 0.2],
  ['Carrot', 'g', 100, 41, 0.9, 10, 0.2],
  ['Onion', 'g', 100, 40, 1.1, 9, 0.1],
  // Nuts / snacks / fast food
  ['Almonds', 'g', 100, 579, 21, 22, 50],
  ['Peanuts', 'g', 100, 567, 26, 16, 49],
  ['Walnuts', 'g', 100, 654, 15, 14, 65],
  ['Peanut Butter', 'tbsp', 1, 94, 4, 3, 8],
  ['Honey', 'tbsp', 1, 64, 0, 17, 0],
  ['Sugar', 'tsp', 1, 16, 0, 4, 0],
  ['Chocolate (milk)', 'g', 100, 535, 7.7, 59, 30],
  ['Ice Cream', 'g', 100, 207, 3.5, 24, 11],
  ['French Fries', 'g', 100, 312, 3.4, 41, 15],
  ['Pizza', 'slice', 1, 285, 12, 36, 10],
  ['Burger (cheese)', 'piece', 1, 300, 15, 33, 12],
  ['Cola', 'can', 1, 140, 0, 39, 0],
];

export const FOODS = ROWS.map(([name, unit, base, calories, protein, carbs, fats]) => ({
  name,
  unit,
  base,
  calories,
  protein,
  carbs,
  fats,
}));

// Naam se food dhoondna (capital/small ka farq nahi)
export const findFood = (name) => {
  const q = (name || '').trim().toLowerCase();
  if (!q) return null;
  return FOODS.find((f) => f.name.toLowerCase() === q) || null;
};

const round1 = (n) => Math.round(n * 10) / 10;

// amount (jaise 200 g ya 2 piece) ke hisab se calories/protein/carbs/fats nikalna
export const calcMacros = (food, amount) => {
  const factor = Number(amount) / food.base;
  if (!Number.isFinite(factor) || factor <= 0) return null;
  return {
    calories: Math.round(food.calories * factor),
    protein: round1(food.protein * factor),
    carbs: round1(food.carbs * factor),
    fats: round1(food.fats * factor),
  };
};

// "200 g" ya "2 piece" jaisi quantity string se number nikalna (edit ke waqt kaam aata hai)
export const parseAmount = (quantity) => {
  const m = String(quantity || '').trim().match(/^(\d+(?:\.\d+)?)/);
  return m ? m[1] : '';
};