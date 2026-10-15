import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWorkouts } from '../services/workoutService';
import { getWeights } from '../services/weightService';
import { getNutrition } from '../services/nutritionService';
import { getMeasurements } from '../services/measurementService';
import { getGoal } from '../services/goalService';
import { useSettings } from '../context/SettingsContext';
import { displayWeight } from '../utils/unitConversion';
import FlyInHeading from '../components/motion/FlyInHeading';
import StaggerIn from '../components/motion/StaggerIn';
import CircularProgress from '../components/CircularProgress';
import WelcomeModal from '../components/WelcomeModal';
import GettingStartedChecklist from '../components/GettingStartedChecklist';
import { Dumbbell, Flame, Scale, UtensilsCrossed, Ruler } from 'lucide-react';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Is hafte (Monday se aaj tak) ki shuruaat
const getStartOfWeek = () => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diffToMonday);
  return monday;
};

function ProgressBar({ label, current, target, unit = '', color }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="goal-progress">
      <div className="goal-progress-header">
        <span>{label}</span>
        <span className="muted">
          {current}
          {unit} / {target}
          {unit}
        </span>
      </div>
      <div className="goal-progress-track">
        <div
          className="goal-progress-fill"
          style={{ width: `${pct}%`, background: color || 'var(--primary)' }}
        />
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [workouts, setWorkouts] = useState([]);
  const [weights, setWeights] = useState([]);
  const [nutrition, setNutrition] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [goal, setGoal] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [workoutData, weightData, nutritionData, measurementData, goalData] = await Promise.all([
      getWorkouts(),
      getWeights(),
      getNutrition(),
      getMeasurements(),
      getGoal(),
    ]);
    setWorkouts(workoutData);
    setWeights(weightData);
    setNutrition(nutritionData);
    setMeasurements(measurementData);
    setGoal(goalData);
    setLoaded(true);
  };

  const weightChartData = weights.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: entry.weight,
  }));

  const workoutsPerDay = {};
  workouts.forEach((w) => {
    const day = new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    workoutsPerDay[day] = (workoutsPerDay[day] || 0) + 1;
  });
  const workoutChartData = Object.keys(workoutsPerDay).map((day) => ({
    date: day,
    count: workoutsPerDay[day],
  }));

  const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

  const today = new Date().toDateString();
  const todaysNutrition = nutrition.filter((n) => new Date(n.date).toDateString() === today);
  const todaysCalories = todaysNutrition.reduce((sum, n) => sum + (n.calories || 0), 0);

  const latestMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  // --- Goal progress hisaab ---
  const startOfWeek = getStartOfWeek();
  const workoutsThisWeek = workouts.filter((w) => new Date(w.date) >= startOfWeek).length;

  const currentWeightKg = weights.length > 0 ? weights[weights.length - 1].weight : null;
  const startingWeightKg = weights.length > 0 ? weights[0].weight : null;

  const hasWeightGoal = goal?.targetWeight && currentWeightKg !== null;
  let weightGoalPct = 0;
  if (hasWeightGoal && startingWeightKg !== null) {
    const totalToLose = startingWeightKg - goal.targetWeight;
    const lostSoFar = startingWeightKg - currentWeightKg;
    weightGoalPct =
      totalToLose !== 0 ? Math.min(100, Math.max(0, Math.round((lostSoFar / totalToLose) * 100))) : 100;
  }

  const STAT_CARDS = [
    { icon: Dumbbell, value: workouts.length, label: 'Total Workouts', tone: 'teal' },
    { icon: Flame, value: totalCalories, label: 'Calories Burned', tone: 'orange' },
    {
      icon: Scale,
      value: currentWeightKg !== null ? `${displayWeight(currentWeightKg, settings.weightUnit)} ${settings.weightUnit}` : '-',
      label: 'Current Weight',
      tone: 'purple',
    },
    { icon: UtensilsCrossed, value: todaysCalories, label: 'Calories Eaten Today', tone: 'green' },
    { icon: Ruler, value: latestMeasurement ? `${latestMeasurement.waist || '-'} cm` : '-', label: 'Latest Waist', tone: 'blue' },
  ];

  return (
    <div className="page-container">
      <FlyInHeading text={`Welcome back, ${user.name} 👋`} as="h2" accentLastWord={false} />
            <WelcomeModal userId={user._id} />

      {loaded && (
        <GettingStartedChecklist
          workouts={workouts}
          nutrition={nutrition}
          weights={weights}
          measurements={measurements}
          goal={goal}
        />
      )}
      

      <StaggerIn className="stats-grid" startDelay={0.15}>
        {STAT_CARDS.map(({ icon: Icon, value, label, tone }) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon stat-icon-${tone}`}>
              <Icon size={20} />
            </div>
            <h3>{value}</h3>
            <p>{label}</p>
          </div>
        ))}
      </StaggerIn>

      {goal && (
        <div className="chart-container goals-summary">
          <h3>Your Goals</h3>

          <div className="gauge-row">
            <CircularProgress
              percent={goal.weeklyWorkoutTarget ? Math.round((workoutsThisWeek / goal.weeklyWorkoutTarget) * 100) : 0}
              label="Workouts this week"
              value={`${workoutsThisWeek}/${goal.weeklyWorkoutTarget || 0}`}
              color="#1f9d8f"
            />

            {goal.dailyCalorieTarget ? (
              <CircularProgress
                percent={Math.round((todaysCalories / goal.dailyCalorieTarget) * 100)}
                label="Calories today"
                value={`${todaysCalories}/${goal.dailyCalorieTarget}`}
                color={todaysCalories > goal.dailyCalorieTarget ? '#e07b3f' : '#8b5cf6'}
              />
            ) : null}

            {hasWeightGoal ? (
              <CircularProgress
                percent={weightGoalPct}
                label="Weight goal"
                value={`${displayWeight(currentWeightKg, settings.weightUnit)}/${displayWeight(goal.targetWeight, settings.weightUnit)} ${settings.weightUnit}`}
                color="#3b82f6"
              />
            ) : null}
          </div>

          {!goal.dailyCalorieTarget && !hasWeightGoal && (
            <p className="muted">
              Weight goal ya calorie target set nahi kiya. <a href="/goals">Goals page</a> par jaakar set karein,
              ya Goals page par "Suggested Goal" se automatically bhi bana sakte hain.
            </p>
          )}
        </div>
      )}

      <div className="charts-row">
        <div className="chart-container">
          <h3>Weight Progress</h3>
          {weightChartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={280}>
             <LineChart data={weightChartData}>
  <defs>
    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#1f9d8f" stopOpacity={0.3} />
      <stop offset="95%" stopColor="#1f9d8f" stopOpacity={0} />
    </linearGradient>
  </defs>
  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#666' }} />
  <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12, fill: '#666' }} />
  <Tooltip
    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
  />
  <Line
    type="monotone"
    dataKey="weight"
    stroke="#1f9d8f"
    strokeWidth={3}
    dot={{ fill: '#1f9d8f', r: 4 }}
    activeDot={{ r: 6 }}
  />
</LineChart>
            </ResponsiveContainer>
          ) : (
            <p>Add at least 2 weight entries to see your progress chart.</p>
          )}
        </div>

        <div className="chart-container">
          <h3>Workouts per Day</h3>
          {workoutChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={workoutChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
               <Bar dataKey="count" fill="#1f9d8f" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>Add a workout to see this chart.</p>
          )}
        </div>
      </div>

      <div className="recent-section">
        <div className="recent-card">
          <h3>Recent Workouts</h3>
          {workouts.slice(0, 3).length === 0 && <p className="muted">No workouts yet.</p>}
          {workouts.slice(0, 3).map((w) => (
            <div key={w._id} className="recent-item">
              <span>{w.exerciseName}</span>
              <span className="muted">{new Date(w.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>

        <div className="recent-card">
          <h3>Recent Nutrition</h3>
          {nutrition.slice(0, 3).length === 0 && <p className="muted">No nutrition logs yet.</p>}
          {nutrition.slice(0, 3).map((n) => (
            <div key={n._id} className="recent-item">
              <span>{n.foodItem}</span>
              <span className="muted">{n.calories} kcal</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
