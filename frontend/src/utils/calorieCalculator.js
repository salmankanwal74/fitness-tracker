// MET (Metabolic Equivalent of Task) values — standard fitness-science
// numbers jo batate hain koi activity aapke resting metabolism se kitni
// guna energy use karti hai. Formula: Calories = MET x weight(kg) x hours.

// Exercise ke NAAM mein ye keywords dhoondte hain (jo pehle match ho wahi MET).
const EXERCISE_MET_KEYWORDS = [
  { keywords: ['run', 'sprint', 'dauna', 'daud'], met: 9.8 },
  { keywords: ['jog'], met: 7.0 },
  { keywords: ['walk', 'walking'], met: 3.5 },
  { keywords: ['cycle', 'cycling', 'bike', 'bicycle'], met: 7.5 },
  { keywords: ['swim'], met: 8.0 },
  { keywords: ['yoga'], met: 2.5 },
  { keywords: ['pilates'], met: 3.0 },
  { keywords: ['row', 'rowing'], met: 7.0 },
  { keywords: ['jump rope', 'skipping', 'skip rope'], met: 11.0 },
  { keywords: ['hiit', 'interval'], met: 8.0 },
  { keywords: ['box', 'boxing', 'kickbox'], met: 7.8 },
  { keywords: ['basketball'], met: 6.5 },
  { keywords: ['football', 'soccer'], met: 7.0 },
  { keywords: ['tennis'], met: 7.3 },
  { keywords: ['stair'], met: 8.8 },
  { keywords: ['elliptical'], met: 5.0 },
  { keywords: ['squat', 'deadlift', 'bench', 'press', 'curl', 'lift', 'weight'], met: 5.0 },
  { keywords: ['pull up', 'pullup', 'push up', 'pushup', 'plank', 'burpee'], met: 6.0 },
];

// Agar exercise ke naam se match nahi mila, to uski CATEGORY se andaza lagate hain
const CATEGORY_MET = {
  strength: 5.0,
  cardio: 8.0,
  flexibility: 2.5,
  sports: 7.0,
  other: 4.0,
};

const DEFAULT_WEIGHT_KG = 70; // agar user ne abhi tak koi weight entry nahi ki

// exerciseName ke liye best MET value dhoondta hai
function findMET(exerciseName, category) {
  const name = (exerciseName || '').toLowerCase();
  for (const entry of EXERCISE_MET_KEYWORDS) {
    if (entry.keywords.some((k) => name.includes(k))) {
      return entry.met;
    }
  }
  return CATEGORY_MET[category] || CATEGORY_MET.other;
}

// Agar duration nahi di gayi, sets ke hisaab se ek mota-mota andaza
// (strength training mein har set + rest mila kar takreeban 2.5 minute)
function estimateDurationMinutes(sets) {
  if (!sets || sets <= 0) return null;
  return Math.round(sets * 2.5);
}

/**
 * @param {object} params
 * @param {string} params.exerciseName
 * @param {string} params.category
 * @param {number} params.durationMinutes - agar khali ho to sets se andaza lagaya jaata hai
 * @param {number} params.sets
 * @param {number} params.weightKg - user ka latest tracked weight (kg mein)
 * @returns {{calories: number, met: number, usedDuration: number, isEstimatedDuration: boolean, usedDefaultWeight: boolean}|null}
 */
export function estimateCaloriesBurned({ exerciseName, category, durationMinutes, sets, weightKg }) {
  const met = findMET(exerciseName, category);

  let usedDuration = durationMinutes;
  let isEstimatedDuration = false;
  if (!usedDuration || usedDuration <= 0) {
    usedDuration = estimateDurationMinutes(sets);
    isEstimatedDuration = true;
  }
  if (!usedDuration) return null; // na duration hai na sets — estimate nahi ban sakta

  const usedDefaultWeight = !weightKg || weightKg <= 0;
  const weight = usedDefaultWeight ? DEFAULT_WEIGHT_KG : weightKg;

  const calories = Math.round(met * weight * (usedDuration / 60));

  return { calories, met, usedDuration, isEstimatedDuration, usedDefaultWeight };
}