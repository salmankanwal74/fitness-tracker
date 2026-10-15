// Mifflin-St Jeor formula se BMR (resting calories) nikalte hain,
// phir activity level se multiply kar ke TDEE (roz ki total calories) milti hai.
// Ye standard, widely-used fitness-science formula hai.

const ACTIVITY_MULTIPLIER = {
  sedentary: 1.2, // desk job, thori walk
  light: 1.375, // hafte mein 1-3 din halki activity
  moderate: 1.55, // hafte mein 3-5 din workout
  active: 1.725, // hafte mein 6-7 din workout
  very_active: 1.9, // physically demanding job + roz workout
};

const WEEKLY_WORKOUT_SUGGESTION = {
  sedentary: 3,
  light: 4,
  moderate: 5,
  active: 6,
  very_active: 6,
};

/**
 * @param {object} params
 * @param {number} params.weightKg - current weight (kg)
 * @param {number} params.heightCm
 * @param {number} params.age
 * @param {'male'|'female'|'other'} params.gender
 * @param {'sedentary'|'light'|'moderate'|'active'|'very_active'} params.activityLevel
 * @param {'lose'|'maintain'|'gain'} params.goalDirection
 * @returns {{dailyCalorieTarget: number, weeklyWorkoutTarget: number, targetWeight: number|null, bmr: number, tdee: number}|null}
 */
export function calculateSuggestedGoal({ weightKg, heightCm, age, gender, activityLevel, goalDirection }) {
  if (!weightKg || !heightCm || !age || !gender) return null;

  // Mifflin-St Jeor
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  bmr += gender === 'male' ? 5 : gender === 'female' ? -161 : -78; // 'other' → beech ka average

  const tdee = bmr * (ACTIVITY_MULTIPLIER[activityLevel] || 1.55);

  let dailyCalorieTarget = tdee;
  if (goalDirection === 'lose') dailyCalorieTarget = tdee - 500; // ~0.5kg/week loss
  if (goalDirection === 'gain') dailyCalorieTarget = tdee + 300; // halka surplus

  // Healthy BMI range (18.5–24.9) ka midpoint (~21.7) se target weight
  const heightM = heightCm / 100;
  const healthyWeight = Math.round(21.7 * heightM * heightM * 10) / 10;

  let targetWeight = null;
  if (goalDirection === 'lose' && weightKg > healthyWeight) targetWeight = healthyWeight;
  if (goalDirection === 'gain' && weightKg < healthyWeight) targetWeight = healthyWeight;

  return {
    dailyCalorieTarget: Math.round(dailyCalorieTarget / 10) * 10, // nearest 10 tak round
    weeklyWorkoutTarget: WEEKLY_WORKOUT_SUGGESTION[activityLevel] || 4,
    targetWeight,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
  };
}