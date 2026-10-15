import { useState, useEffect } from 'react';
import { getGoal, updateGoal } from '../services/goalService';
import { getWeights } from '../services/weightService';
import { useSettings } from '../context/SettingsContext';
import { displayWeight, toStorageWeight, displayLength, toStorageLength } from '../utils/unitConversion';
import { calculateSuggestedGoal } from '../utils/goalSuggestion';

function GoalsPage() {
  const { settings } = useSettings();
  const weightUnit = settings.weightUnit;
  const lengthUnit = settings.lengthUnit;

  const [goal, setGoal] = useState(null);
  const [targetWeight, setTargetWeight] = useState('');
  const [weeklyWorkoutTarget, setWeeklyWorkoutTarget] = useState(3);
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState('');
  const [workoutReminderEnabled, setWorkoutReminderEnabled] = useState(false);
  const [workoutReminderTime, setWorkoutReminderTime] = useState('18:00');
  const [mealReminderEnabled, setMealReminderEnabled] = useState(false);
  const [mealReminderTime, setMealReminderTime] = useState('20:00');

  // --- Suggested goal calculator ke fields ---
  const [currentWeightKg, setCurrentWeightKg] = useState(null);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState(''); // display unit mein
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goalDirection, setGoalDirection] = useState('maintain');
  const [suggestion, setSuggestion] = useState(null);
  const [suggestionMsg, setSuggestionMsg] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [permissionWarning, setPermissionWarning] = useState(false);

  useEffect(() => {
    (async () => {
      const [data, weights] = await Promise.all([getGoal(), getWeights()]);
      applyGoalToForm(data);
      if (weights.length > 0) setCurrentWeightKg(weights[weights.length - 1].weight);
      setLoading(false);
    })();
  }, []);

  const applyGoalToForm = (data) => {
    setGoal(data);
    setTargetWeight(data.targetWeight ? displayWeight(data.targetWeight, weightUnit) : '');
    setWeeklyWorkoutTarget(data.weeklyWorkoutTarget ?? 3);
    setDailyCalorieTarget(data.dailyCalorieTarget || '');
    setWorkoutReminderEnabled(data.workoutReminder?.enabled || false);
    setWorkoutReminderTime(data.workoutReminder?.time || '18:00');
    setMealReminderEnabled(data.mealReminder?.enabled || false);
    setMealReminderTime(data.mealReminder?.time || '20:00');

    const si = data.suggestionInputs || {};
    if (si.age) setAge(si.age);
    if (si.gender) setGender(si.gender);
    if (si.heightCm) setHeight(displayLength(si.heightCm, lengthUnit));
    if (si.activityLevel) setActivityLevel(si.activityLevel);
    if (si.goalDirection) setGoalDirection(si.goalDirection);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  };

  const handleCalculateSuggestion = () => {
    setSuggestionMsg('');

    if (!currentWeightKg) {
      setSuggestionMsg('Pehle Weight page par apna weight add karein — suggestion isi se banti hai.');
      return;
    }
    if (!age || !height) {
      setSuggestionMsg('Age aur height dono bharein.');
      return;
    }

    const result = calculateSuggestedGoal({
      weightKg: currentWeightKg,
      heightCm: toStorageLength(height, lengthUnit),
      age: Number(age),
      gender,
      activityLevel,
      goalDirection,
    });

    setSuggestion(result);
  };

  const handleApplySuggestion = () => {
    if (!suggestion) return;
    setWeeklyWorkoutTarget(suggestion.weeklyWorkoutTarget);
    setDailyCalorieTarget(suggestion.dailyCalorieTarget);
    if (suggestion.targetWeight) {
      setTargetWeight(displayWeight(suggestion.targetWeight, weightUnit));
    }
    setSuggestionMsg('Suggestion form mein bhar di gayi hai — neeche "Save Goals" dabana na bhoolein.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });
    setPermissionWarning(false);

    // Agar koi reminder on kiya hai to browser permission maango
    if (workoutReminderEnabled || mealReminderEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setPermissionWarning(true);
      }
    }

    try {
      const updated = await updateGoal({
        targetWeight: targetWeight === '' ? null : toStorageWeight(targetWeight, weightUnit),
        weeklyWorkoutTarget: Number(weeklyWorkoutTarget),
        dailyCalorieTarget: dailyCalorieTarget === '' ? null : Number(dailyCalorieTarget),
        workoutReminder: { enabled: workoutReminderEnabled, time: workoutReminderTime },
        mealReminder: { enabled: mealReminderEnabled, time: mealReminderTime },
        suggestionInputs: {
          age: age === '' ? null : Number(age),
          gender,
          heightCm: height === '' ? null : toStorageLength(height, lengthUnit),
          activityLevel,
          goalDirection,
        },
      });
      applyGoalToForm(updated);
      setMsg({ type: 'success', text: 'Goals save ho gaye' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Save nahi ho saka' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="page-container settings-page">
      <h2>Goals & Reminders</h2>
      {msg.text && <p className={msg.type === 'success' ? 'success-msg' : 'error'}>{msg.text}</p>}
      {permissionWarning && (
        <p className="error">
          Browser notifications block hain. Reminders on hain lekin popup nahi aayega jab tak
          browser settings mein is site ko notification permission na dein.
        </p>
      )}

      {/* ---------- Suggested Goal calculator ---------- */}
      <div className="settings-section suggestion-section">
        <h3>💡 Apna goal pata nahi? Suggestion le lein</h3>
        <p className="settings-desc">
          Apni details bharein — hum aapke liye ek reasonable weekly workout target, calorie
          target, aur (zaroorat ho to) weight goal calculate kar dete hain, based on standard
          fitness formulas.
        </p>

        <div className="suggestion-inputs">
          <div>
            <label>Age</label>
            <input
              type="number"
              min="10"
              max="100"
              placeholder="e.g. 28"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              onWheel={(e) => e.target.blur()}
            />
          </div>
          <div>
            <label>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label>Height ({lengthUnit})</label>
            <input
              type="number"
              placeholder={lengthUnit === 'cm' ? 'e.g. 170' : 'e.g. 67'}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              onWheel={(e) => e.target.blur()}
            />
          </div>
          <div>
            <label>Activity Level</label>
            <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
              <option value="sedentary">Sedentary (desk job)</option>
              <option value="light">Light (1-3 days/week)</option>
              <option value="moderate">Moderate (3-5 days/week)</option>
              <option value="active">Active (6-7 days/week)</option>
              <option value="very_active">Very Active (physical job)</option>
            </select>
          </div>
          <div>
            <label>Goal</label>
            <select value={goalDirection} onChange={(e) => setGoalDirection(e.target.value)}>
              <option value="lose">Lose weight</option>
              <option value="maintain">Maintain weight</option>
              <option value="gain">Gain weight</option>
            </select>
          </div>
        </div>

        {!currentWeightKg && (
          <p className="settings-desc">
            Note: aapki koi weight entry nahi mili — pehle Weight page par ek entry add karein,
            calculation usi par depend karti hai.
          </p>
        )}

        <button type="button" onClick={handleCalculateSuggestion} className="suggestion-calc-btn">
          Calculate Suggestion
        </button>

        {suggestionMsg && <p className="settings-desc" style={{ marginTop: 10 }}>{suggestionMsg}</p>}

        {suggestion && (
          <div className="suggestion-result">
            <div>
              <strong>{suggestion.weeklyWorkoutTarget}</strong>
              <span>workouts/week</span>
            </div>
            <div>
              <strong>{suggestion.dailyCalorieTarget}</strong>
              <span>kcal/day</span>
            </div>
            <div>
              <strong>{suggestion.targetWeight ? `${displayWeight(suggestion.targetWeight, weightUnit)} ${weightUnit}` : '—'}</strong>
              <span>target weight</span>
            </div>
            <button type="button" onClick={handleApplySuggestion} className="suggestion-apply-btn">
              ✅ Use This Goal
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="settings-section">
          <h3>Targets</h3>
          <p className="settings-desc">
            Dashboard par inka progress bar dikhega — upar se suggestion le kar bhi bhar sakte hain, ya khud likh sakte hain.
          </p>

          <div className="settings-row">
            <div>
              <strong>Target Weight</strong>
              <p className="settings-desc">Aap kis weight tak pahunchna chahte hain</p>
            </div>
            <input
              type="number"
              step="0.1"
              placeholder={`e.g. 70 ${weightUnit}`}
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              onWheel={(e) => e.target.blur()}
              style={{ width: 140 }}
            />
          </div>

          <div className="settings-row">
            <div>
              <strong>Weekly Workout Target</strong>
              <p className="settings-desc">Fi hafta kitni workouts karni hain</p>
            </div>
            <input
              type="number"
              min="0"
              max="21"
              value={weeklyWorkoutTarget}
              onChange={(e) => setWeeklyWorkoutTarget(e.target.value)}
              onWheel={(e) => e.target.blur()}
              style={{ width: 140 }}
            />
          </div>

          <div className="settings-row">
            <div>
              <strong>Daily Calorie Target</strong>
              <p className="settings-desc">Roz ki calorie limit (nutrition tracking ke liye)</p>
            </div>
            <input
              type="number"
              placeholder="e.g. 2000"
              value={dailyCalorieTarget}
              onChange={(e) => setDailyCalorieTarget(e.target.value)}
              onWheel={(e) => e.target.blur()}
              style={{ width: 140 }}
            />
          </div>
        </div>

        <div className="settings-section">
          <h3>Reminders</h3>
          <p className="settings-desc">
            App khuli hone par browser notification ke zariye yaad dilayega
          </p>

          <div className="settings-row">
            <div>
              <strong>Workout Reminder</strong>
              <p className="settings-desc">Agar aaj tak workout nahi ki</p>
            </div>
            <div className="reminder-controls">
              <input
                type="time"
                value={workoutReminderTime}
                onChange={(e) => setWorkoutReminderTime(e.target.value)}
                disabled={!workoutReminderEnabled}
              />
              <label className="switch">
                <input
                  type="checkbox"
                  checked={workoutReminderEnabled}
                  onChange={(e) => setWorkoutReminderEnabled(e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <strong>Meal Reminder</strong>
              <p className="settings-desc">Agar aaj koi meal log nahi hui</p>
            </div>
            <div className="reminder-controls">
              <input
                type="time"
                value={mealReminderTime}
                onChange={(e) => setMealReminderTime(e.target.value)}
                disabled={!mealReminderEnabled}
              />
              <label className="switch">
                <input
                  type="checkbox"
                  checked={mealReminderEnabled}
                  onChange={(e) => setMealReminderEnabled(e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Goals'}
        </button>
      </form>
    </div>
  );
}

export default GoalsPage;